import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Store as StoreIcon,
  Package,
  Save,
  X,
  Percent,
  Receipt
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { TaxSelector, CompactTaxBreakdown } from '@/components/tax';
import { getAllTaxTypes, updateTaxAssociations, getPriceWithTaxes } from '@/lib/tax-service';
import type { Store, Unit } from '@/types/items';
import type { TaxType, PriceWithTaxes } from '@/types/tax';

interface PriceList {
  id: number;
  item_id: number;
  barcode: string;
  store_id: number;
  retail_price: number;
  unit_id: number;
  price_effective_date: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  stores: { name: string };
  units: { unit: string; description: string };
}

interface PriceFormData {
  barcode: string;
  store_id: string;
  retail_price: string;
  unit_id: string;
  selectedTaxIds: number[];
}

interface PriceTrend {
  store_name: string;
  price_date: string;
  price: number;
  change_type: string;
  price_change_percentage: number | null;
}

interface EnhancedPriceManagerProps {
  itemId: number;
  itemDescription: string;
  onPricesUpdated: () => void;
}

export function EnhancedPriceManager({ 
  itemId, 
  itemDescription, 
  onPricesUpdated 
}: EnhancedPriceManagerProps) {
  const [prices, setPrices] = useState<PriceList[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [pricesWithTax, setPricesWithTax] = useState<Record<number, PriceWithTaxes>>({});
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingPrice, setEditingPrice] = useState<PriceList | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState<boolean>(false);
  const [showTrends, setShowTrends] = useState<boolean>(false);
  const [showTaxes, setShowTaxes] = useState<boolean>(true);

  const [formData, setFormData] = useState<PriceFormData>({
    barcode: '',
    store_id: '',
    retail_price: '',
    unit_id: '',
    selectedTaxIds: [],
  });

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [pricesResult, storesResult, unitsResult, taxTypesData] = await Promise.all([
        supabase
          .from('price_lists')
          .select(`
            *,
            stores (name),
            units (unit, description)
          `)
          .eq('item_id', itemId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('stores')
          .select('*')
          .order('name'),
        supabase
          .from('units')
          .select('*')
          .order('unit'),
        getAllTaxTypes()
      ]);

      if (pricesResult.error) throw pricesResult.error;
      if (storesResult.error) throw storesResult.error;
      if (unitsResult.error) throw unitsResult.error;

      const pricesData = pricesResult.data || [];
      setPrices(pricesData);
      setStores(storesResult.data || []);
      setUnits(unitsResult.data || []);
      setTaxTypes(taxTypesData);

      // Load tax information for each price
      if (pricesData.length > 0) {
        const taxPromises = pricesData.map(async (price) => {
          try {
            const priceWithTax = await getPriceWithTaxes(price.id);
            return { priceListId: price.id, data: priceWithTax };
          } catch (error) {
            console.error(`Error loading taxes for price ${price.id}:`, error);
            return { priceListId: price.id, data: null };
          }
        });

        const taxResults = await Promise.all(taxPromises);
        const taxMap: Record<number, PriceWithTaxes> = {};
        taxResults.forEach(result => {
          if (result.data) {
            taxMap[result.priceListId] = result.data;
          }
        });
        setPricesWithTax(taxMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load price data');
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  const loadPriceTrends = useCallback(async (): Promise<void> => {
    try {
      // TODO: Fix TypeScript issue with custom RPC functions
      // const { data, error } = await supabase
      //   .rpc('get_item_price_trend', {
      //     p_item_id: itemId,
      //     p_days: 30
      //   });

      // if (error) throw error;
      // setPriceTrends(data || []);
      setPriceTrends([]); // Temporary: empty trends until we fix the RPC types
    } catch (error) {
      console.error('Error loading price trends:', error);
      toast.error('Failed to load price trends');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (showTrends) {
      loadPriceTrends();
    }
  }, [showTrends, loadPriceTrends]);

  const resetForm = (): void => {
    setFormData({
      barcode: '',
      store_id: '',
      retail_price: '',
      unit_id: '',
      selectedTaxIds: [],
    });
    setEditingPrice(null);
    setIsAddingPrice(false);
  };

  const handleAddPrice = (): void => {
    resetForm();
    setIsAddingPrice(true);
  };

  const handleEditPrice = async (price: PriceList): Promise<void> => {
    try {
      // Load existing tax associations
      const { data: taxAssociations, error } = await supabase
        .from('price_list_taxes')
        .select('tax_type_id')
        .eq('price_list_id', price.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading tax associations:', error);
        toast.error('Failed to load tax information');
        return;
      }

      const selectedTaxIds = taxAssociations?.map(ta => ta.tax_type_id) || [];

      setFormData({
        barcode: price.barcode,
        store_id: price.store_id.toString(),
        retail_price: price.retail_price.toString(),
        unit_id: price.unit_id.toString(),
        selectedTaxIds,
      });
      setEditingPrice(price);
      setIsAddingPrice(false);
    } catch (error) {
      console.error('Error setting up edit form:', error);
      toast.error('Failed to load price for editing');
    }
  };

  const handleDeletePrice = async (priceId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this price?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', priceId);

      if (error) throw error;

      await loadData();
      onPricesUpdated();
      toast.success('Price deleted successfully');
    } catch (error) {
      console.error('Error deleting price:', error);
      toast.error('Failed to delete price');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPrice = async (): Promise<void> => {
    if (!formData.barcode || !formData.store_id || !formData.retail_price || !formData.unit_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const priceData = {
        item_id: itemId,
        barcode: formData.barcode,
        store_id: parseInt(formData.store_id),
        retail_price: parseFloat(formData.retail_price),
        unit_id: parseInt(formData.unit_id),
      };

      let priceListId: number;

      if (editingPrice) {
        // Update existing price
        const { error } = await supabase
          .from('price_lists')
          .update(priceData)
          .eq('id', editingPrice.id);

        if (error) throw error;
        priceListId = editingPrice.id;
        toast.success('Price updated successfully');
      } else {
        // Create new price
        const { data: newPrice, error } = await supabase
          .from('price_lists')
          .insert(priceData)
          .select('id')
          .single();

        if (error) throw error;
        if (!newPrice) throw new Error('Failed to get new price ID');
        
        priceListId = newPrice.id;
        toast.success('Price added successfully');
      }

      // Update tax associations
      await updateTaxAssociations(priceListId, formData.selectedTaxIds);

      await loadData();
      onPricesUpdated();
      resetForm();
    } catch (error) {
      console.error('Error saving price:', error);
      toast.error('Failed to save price');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof PriceFormData, value: string | number[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFormValid = (): boolean => {
    return !!(formData.barcode && formData.store_id && formData.retail_price && formData.unit_id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Management</h2>
          <p className="text-muted-foreground">{itemDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTrends(!showTrends)}
            disabled={isLoading}
          >
            {showTrends ? <TrendingDown className="size-4 mr-2" /> : <TrendingUp className="size-4 mr-2" />}
            {showTrends ? 'Hide Trends' : 'View Trends'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTaxes(!showTaxes)}
            disabled={isLoading}
          >
            {showTaxes ? <Receipt className="size-4 mr-2" /> : <Percent className="size-4 mr-2" />}
            {showTaxes ? 'Hide Tax Info' : 'Show Tax Info'}
          </Button>
          <Button
            onClick={handleAddPrice}
            disabled={isLoading || isAddingPrice || editingPrice !== null}
          >
            <Plus className="size-4 mr-2" />
            Add Price
          </Button>
        </div>
      </div>

      {/* Add/Edit Price Form */}
      {(isAddingPrice || editingPrice) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              {editingPrice ? 'Edit Price' : 'Add New Price'}
            </CardTitle>
            <CardDescription>
              {editingPrice ? 'Update the price information' : 'Enter price information for this item'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode *</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => updateFormData('barcode', e.target.value)}
                  placeholder="Enter barcode"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="retail_price">Price *</Label>
                <Input
                  id="retail_price"
                  type="number"
                  step="0.01"
                  value={formData.retail_price}
                  onChange={(e) => updateFormData('retail_price', e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store">Store *</Label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => updateFormData('store_id', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(value) => updateFormData('unit_id', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.unit} - {unit.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Tax Selection */}
            <div className="space-y-4">
              <TaxSelector
                availableTaxes={taxTypes}
                selectedTaxIds={formData.selectedTaxIds}
                onSelectionChange={(taxIds) => updateFormData('selectedTaxIds', taxIds)}
                disabled={isLoading}
                showCalculatedAmount={!!formData.retail_price && parseFloat(formData.retail_price) > 0}
                basePrice={parseFloat(formData.retail_price) || 0}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSubmitPrice}
                disabled={!isFormValid() || isLoading}
              >
                <Save className="size-4 mr-2" />
                {isLoading ? 'Saving...' : editingPrice ? 'Update Price' : 'Add Price'}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                <X className="size-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Trends */}
      {showTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Price Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>
              Price change history across all stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {priceTrends.length > 0 ? (
              <div className="space-y-3">
                {priceTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <StoreIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">{trend.store_name}</span>
                      </div>
                      <Badge 
                        variant={trend.change_type === 'CREATE' ? 'default' : 
                                trend.change_type === 'UPDATE' ? 'secondary' : 'destructive'}
                      >
                        {trend.change_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(trend.price)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {trend.price_change_percentage !== null && (
                          <span className={`flex items-center gap-1 ${
                            trend.price_change_percentage > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {trend.price_change_percentage > 0 ? 
                              <TrendingUp className="size-3" /> : 
                              <TrendingDown className="size-3" />
                            }
                            {Math.abs(trend.price_change_percentage)}%
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {formatDate(trend.price_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No price changes in the last 30 days</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Current Prices ({prices.length})
          </CardTitle>
          <CardDescription>
            All active prices for this item across different stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prices.length > 0 ? (
            <div className="space-y-3">
              {prices.map((price) => (
                <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {price.barcode}
                        </span>
                        <span className="font-medium">{price.stores.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {price.units.unit}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Updated: {formatDate(price.updated_at || price.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-2">
                      {showTaxes && pricesWithTax[price.id] ? (
                        <CompactTaxBreakdown
                          taxBreakdown={pricesWithTax[price.id].appliedTaxes || []}
                          basePrice={price.retail_price}
                        />
                      ) : (
                        <>
                          <div className="font-semibold text-lg">
                            {formatCurrency(price.retail_price)}
                          </div>
                          {showTaxes && (
                            <div className="text-xs text-muted-foreground">
                              No tax information
                            </div>
                          )}
                        </>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {price.units.description}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPrice(price)}
                        disabled={isLoading || isAddingPrice || editingPrice !== null}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePrice(price.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No prices set for this item</p>
              <Button onClick={handleAddPrice} disabled={isLoading}>
                <Plus className="size-4 mr-2" />
                Add First Price
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
