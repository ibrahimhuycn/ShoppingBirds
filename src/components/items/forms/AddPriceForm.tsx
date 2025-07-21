import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TaxSelector } from '@/components/tax';
import { getAllTaxTypes, updateTaxAssociations } from '@/lib/tax-service';
import type { AddPriceFormProps, PriceFormData } from '@/types/items';
import type { TaxType } from '@/types/tax';
import { useEffect } from 'react';

export function AddPriceForm({ 
  itemId, 
  itemDescription, 
  stores, 
  units, 
  onSubmit, 
  onCancel, 
  isLoading,
  showTaxSelector = true
}: AddPriceFormProps) {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [formData, setFormData] = useState<PriceFormData>({
    barcode: '',
    store_id: '',
    retail_price: '',
    unit_id: '',
    selectedTaxIds: [],
  });

  // Load tax types on component mount
  useEffect(() => {
    if (showTaxSelector) {
      loadTaxTypes();
    }
  }, [showTaxSelector]);

  const loadTaxTypes = async (): Promise<void> => {
    try {
      const taxes = await getAllTaxTypes();
      setTaxTypes(taxes);
    } catch (error) {
      console.error('Error loading tax types:', error);
    }
  };

  const handleSubmit = async (): Promise<void> => {
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
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const updateFormData = (field: keyof PriceFormData, value: string | number[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = (): boolean => {
    return !!(formData.barcode && formData.store_id && formData.retail_price && formData.unit_id);
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-muted/50">
      <h4 className="font-semibold mb-3">Add Price for: {itemDescription}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Barcode</label>
          <Input
            value={formData.barcode}
            onChange={(e) => updateFormData('barcode', e.target.value)}
            placeholder="Enter barcode"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Retail Price</label>
          <Input
            type="number"
            step="0.01"
            value={formData.retail_price}
            onChange={(e) => updateFormData('retail_price', e.target.value)}
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Store</label>
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
        <div>
          <label className="text-sm font-medium">Unit</label>
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
      
      {showTaxSelector && taxTypes.length > 0 && (
        <>
          <Separator className="my-4" />
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
      
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
