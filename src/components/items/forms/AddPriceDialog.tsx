import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import { TaxSelector } from '@/components/tax';
import { getAllTaxTypes } from '@/lib/tax-service';
import type { PriceFormData, Store, Unit } from '@/types/items';
import type { TaxType } from '@/types/tax';

interface AddPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemDescription: string;
  stores: Store[];
  units: Unit[];
  onSubmit: (itemId: number, data: PriceFormData) => Promise<void>;
  isLoading: boolean;
  showTaxSelector?: boolean;
}

export function AddPriceDialog({ 
  open, 
  onOpenChange, 
  itemId, 
  itemDescription, 
  stores, 
  units, 
  onSubmit, 
  isLoading,
  showTaxSelector = true
}: AddPriceDialogProps) {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [formData, setFormData] = useState<PriceFormData>({
    barcode: '',
    store_id: '',
    retail_price: '',
    unit_id: '',
    selectedTaxIds: [],
  });

  // Load tax types when dialog opens
  useEffect(() => {
    if (open && showTaxSelector) {
      loadTaxTypes();
    }
  }, [open, showTaxSelector]);

  const loadTaxTypes = async (): Promise<void> => {
    try {
      const taxes = await getAllTaxTypes();
      setTaxTypes(taxes);
    } catch (error) {
      console.error('Error loading tax types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.barcode || !formData.store_id || !formData.retail_price || !formData.unit_id) {
      return;
    }

    try {
      await onSubmit(itemId, formData);
      setFormData({
        barcode: '',
        store_id: '',
        retail_price: '',
        unit_id: '',
        selectedTaxIds: [],
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = (): void => {
    setFormData({
      barcode: '',
      store_id: '',
      retail_price: '',
      unit_id: '',
      selectedTaxIds: [],
    });
    onOpenChange(false);
  };

  const updateFormData = (field: keyof PriceFormData, value: string | number[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = (): boolean => {
    return !!(formData.barcode && formData.store_id && formData.retail_price && formData.unit_id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Add Price Information
            </DialogTitle>
            <DialogDescription>
              Add pricing information for "{itemDescription}". Fill in all fields to save the price.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => updateFormData('barcode', e.target.value)}
                placeholder="Enter barcode"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="retail_price">Retail Price</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                value={formData.retail_price}
                onChange={(e) => updateFormData('retail_price', e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="store">Store</Label>
              <Select
                value={formData.store_id}
                onValueChange={(value) => updateFormData('store_id', value)}
                disabled={isLoading}
                required
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
            <div className="grid gap-3">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(value) => updateFormData('unit_id', value)}
                disabled={isLoading}
                required
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
            
            {showTaxSelector && taxTypes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <TaxSelector
                    availableTaxes={taxTypes}
                    selectedTaxIds={formData.selectedTaxIds || []}
                    onSelectionChange={(taxIds) => updateFormData('selectedTaxIds', taxIds)}
                    disabled={isLoading}
                    showCalculatedAmount={!!formData.retail_price && parseFloat(formData.retail_price) > 0}
                    basePrice={parseFloat(formData.retail_price) || 0}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Price'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
