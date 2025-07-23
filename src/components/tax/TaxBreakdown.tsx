import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, DollarSign, Percent, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TaxBreakdownProps } from '@/types/tax';

export function TaxBreakdown({
  taxBreakdown,
  basePrice,
  currency = 'USD',
  showDetailed = true
}: TaxBreakdownProps) {
  const totalTaxAmount = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
  const totalTaxPercentage = taxBreakdown.reduce((sum, tax) => sum + tax.percentage, 0);
  const finalPrice = basePrice + totalTaxAmount;

  if (taxBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="size-5" />
            Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Percent className="size-4" />
              <span>No taxes applied</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This item uses the default "No Tax" configuration
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="size-5" />
          Tax Breakdown
        </CardTitle>
        {showDetailed && (
          <CardDescription>
            Detailed breakdown of all applied taxes
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Price */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Base Price:</span>
          <span className="font-mono">{formatCurrency(basePrice, currency)}</span>
        </div>

        <Separator />

        {/* Individual Tax Breakdown */}
        {showDetailed && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="size-4" />
              Applied Taxes
            </h4>
            {taxBreakdown.map((tax, index) => (
              <div key={tax.taxId || index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tax.taxName}</span>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {tax.percentage}%
                    </Badge>
                  </div>
                  <span className="font-mono text-sm">
                    {formatCurrency(tax.amount, currency)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(basePrice, currency)} × {tax.percentage}% = {formatCurrency(tax.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tax Summary */}
        {!showDetailed && taxBreakdown.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Applied Taxes:</span>
              <div className="flex items-center gap-2">
                {taxBreakdown.map((tax, index) => (
                  <Badge key={tax.taxId || index} variant="secondary" className="text-xs">
                    {tax.taxName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Tax Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Total Tax ({totalTaxPercentage}%):
          </span>
          <span className="font-mono font-medium">
            {formatCurrency(totalTaxAmount, currency)}
          </span>
        </div>

        <Separator />

        {/* Final Price */}
        <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg">
          <span className="font-semibold flex items-center gap-2">
            <DollarSign className="size-4" />
            Final Price:
          </span>
          <span className="font-mono font-bold text-lg">
            {formatCurrency(finalPrice, currency)}
          </span>
        </div>

        {/* Additional Information */}
        {showDetailed && taxBreakdown.length > 1 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Multiple taxes are calculated using the additive method, 
              where each tax is applied to the original base price separately.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version of tax breakdown for inline display
 */
export function CompactTaxBreakdown({
  taxBreakdown,
  basePrice,
  currency = 'USD'
}: Omit<TaxBreakdownProps, 'showDetailed'>) {
  const totalTaxAmount = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
  const totalTaxPercentage = taxBreakdown.reduce((sum, tax) => sum + tax.percentage, 0);
  const finalPrice = basePrice + totalTaxAmount;

  if (taxBreakdown.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">No tax</span>
        <span className="font-mono">{formatCurrency(basePrice, currency)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Base:</span>
        <span className="font-mono">{formatCurrency(basePrice, currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Tax:</span>
          <Badge variant="secondary" className="text-xs">
            {totalTaxPercentage}%
          </Badge>
        </div>
        <span className="font-mono">{formatCurrency(totalTaxAmount, currency)}</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between font-medium">
        <span>Total:</span>
        <span className="font-mono">{formatCurrency(finalPrice, currency)}</span>
      </div>
    </div>
  );
}
