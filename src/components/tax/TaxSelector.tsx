import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Percent, DollarSign, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TaxSelectorProps, TaxCalculation, AppliedTax } from '@/types/tax';
import { calculateTaxesForPrice } from '@/lib/tax-service';

export function TaxSelector({
  availableTaxes,
  selectedTaxIds,
  onSelectionChange,
  disabled = false,
  required = false,
  showCalculatedAmount = false,
  basePrice = 0
}: TaxSelectorProps) {
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const calculateTaxesPreview = useCallback(async (): Promise<void> => {
    if (!showCalculatedAmount || basePrice <= 0) return;

    setIsCalculating(true);
    try {
      const result = await calculateTaxesForPrice(basePrice, selectedTaxIds);
      setTaxCalculation(result);
    } catch (error) {
      console.error('Error calculating tax preview:', error);
      setTaxCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  }, [showCalculatedAmount, basePrice, selectedTaxIds]);

  // Calculate taxes when selection or base price changes
  useEffect(() => {
    if (showCalculatedAmount && basePrice > 0 && selectedTaxIds.length > 0) {
      calculateTaxesPreview();
    } else if (selectedTaxIds.length === 0) {
      setTaxCalculation({
        basePrice,
        appliedTaxes: [],
        totalTaxAmount: 0,
        totalTaxPercentage: 0,
        finalPrice: basePrice,
        usesDefaultNoTax: true
      });
    }
  }, [selectedTaxIds, basePrice, showCalculatedAmount, calculateTaxesPreview]);

  const handleTaxToggle = (taxId: number, checked: boolean): void => {
    if (disabled) return;

    let newSelection: number[];
    if (checked) {
      newSelection = [...selectedTaxIds, taxId];
    } else {
      newSelection = selectedTaxIds.filter(id => id !== taxId);
    }

    onSelectionChange(newSelection);
  };

  const getTaxPercentageDisplay = (percentage: number): string => {
    return percentage === 0 ? '0%' : `${percentage}%`;
  };

  const getTotalSelectedPercentage = (): number => {
    return availableTaxes
      .filter(tax => selectedTaxIds.includes(tax.id))
      .reduce((sum, tax) => sum + tax.percentage, 0);
  };

  return (
    <div className="space-y-4">
      {/* Tax Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="size-5" />
            Select Taxes
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
          <CardDescription>
            Choose which taxes apply to this price. Taxes are calculated additively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableTaxes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <AlertCircle className="size-8 mx-auto mb-2" />
              <p>No tax types available</p>
            </div>
          ) : (
            <>
              {availableTaxes.map((tax) => {
                const isSelected = selectedTaxIds.includes(tax.id);
                const isDefaultTax = tax.is_default;
                
                return (
                  <div
                    key={tax.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !disabled && handleTaxToggle(tax.id, !isSelected)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`tax-${tax.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleTaxToggle(tax.id, checked as boolean)}
                        disabled={disabled}
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`tax-${tax.id}`}
                            className={`font-medium ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {tax.name}
                          </Label>
                          {isDefaultTax && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {tax.description && (
                          <p className="text-sm text-muted-foreground">
                            {tax.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isSelected ? "default" : "outline"}
                        className="font-mono"
                      >
                        {getTaxPercentageDisplay(tax.percentage)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Selection Summary */}
          {selectedTaxIds.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Tax Rate:</span>
                <Badge variant="default" className="font-mono">
                  {getTaxPercentageDisplay(getTotalSelectedPercentage())}
                </Badge>
              </div>
              {selectedTaxIds.length > 1 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="size-3" />
                  <span>Multiple taxes are applied additively to the base price</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Calculation Preview */}
      {showCalculatedAmount && basePrice > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="size-5" />
              Tax Calculation Preview
            </CardTitle>
            <CardDescription>
              Preview of tax calculation for base price {formatCurrency(basePrice)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Calculating taxes...</p>
              </div>
            ) : taxCalculation ? (
              <div className="space-y-3">
                {/* Base Price */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">Base Price:</span>
                  <span className="font-mono">{formatCurrency(taxCalculation.basePrice)}</span>
                </div>

                {/* Tax Breakdown */}
                {taxCalculation.appliedTaxes.length > 0 ? (
                  <>
                    <div className="border-t pt-2">
                      <h4 className="text-sm font-medium mb-2">Tax Breakdown:</h4>
                      {taxCalculation.appliedTaxes.map((tax) => (
                        <div key={tax.taxId} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {tax.taxName} ({tax.percentage}%):
                          </span>
                          <span className="font-mono">{formatCurrency(tax.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">Total Tax:</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(taxCalculation.totalTaxAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    No taxes applied (using default "No Tax")
                  </div>
                )}

                {/* Final Price */}
                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border-t">
                  <span className="font-semibold flex items-center gap-2">
                    <DollarSign className="size-4" />
                    Final Price:
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {formatCurrency(taxCalculation.finalPrice)}
                  </span>
                </div>

                {taxCalculation.usesDefaultNoTax && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="size-3" />
                    <span>Using default "No Tax" configuration</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="size-8 mx-auto mb-2" />
                <p>Unable to calculate tax preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
