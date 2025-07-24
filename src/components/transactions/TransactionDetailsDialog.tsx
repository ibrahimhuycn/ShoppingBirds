import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaxBreakdown } from "@/components/tax";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Calendar, MapPin, User, Printer, Download, Copy, RefreshCw } from "lucide-react";
import { useI18n } from "@/contexts/translation-context";
import { TransactionUtils } from "@/lib/transaction-utils";
import type { Transaction } from "@/types/transactions";

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsDialog({ 
  transaction, 
  isOpen, 
  onClose 
}: TransactionDetailsDialogProps): JSX.Element {
  const { t } = useI18n();

  if (!transaction) {
    return <></>;
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrintReceipt = (): void => {
    try {
      const receiptText = TransactionUtils.generateReceiptText(transaction, 'MVR', 'Rf.');
      
      // Open print dialog with receipt content
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${transaction.number}</title>
              <style>
                body { font-family: monospace; white-space: pre-wrap; font-size: 12px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>${receiptText}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Print receipt error:', error);
    }
  };

  const handleExportTransaction = (): void => {
    try {
      const csvData = TransactionUtils.exportTransactionsToCSV([transaction], 'MVR');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transaction-${transaction.number}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export transaction error:', error);
    }
  };

  const handleDuplicateTransaction = (): void => {
    // This would typically redirect to POS with pre-filled items
    const itemsData = transaction.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      basePrice: item.basePrice
    }));
    
    // Store items in session storage for POS to pick up
    sessionStorage.setItem('duplicateTransactionItems', JSON.stringify(itemsData));
    
    // Redirect to POS
    window.location.href = '/pos';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-6 text-primary" />
            {t('transactions.transactionDetails')} - {transaction.number}
          </DialogTitle>
          <DialogDescription>
            {t('transactions.processed')} {t('transactions.on')} {formatDate(transaction.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('transactions.paymentSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {t('transactions.date')}
                  </div>
                  <div className="font-medium">{formatDateShort(transaction.date)}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {t('transactions.store')}
                  </div>
                  <div className="font-medium">{transaction.store.name}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4" />
                    {t('transactions.cashier')}
                  </div>
                  <div className="font-medium">{transaction.user.fullName}</div>
                  <div className="text-xs text-muted-foreground">@{transaction.user.username}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('transactions.itemDetails')}</CardTitle>
              <CardDescription>
                {transaction.items.length} {transaction.items.length === 1 ? 'item' : 'items'} purchased
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transaction.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.description}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          {item.brand && (
                            <span>{t('transactions.brand')}: {item.brand}</span>
                          )}
                          {item.model && (
                            <span>{t('transactions.model')}: {item.model}</span>
                          )}
                          {item.category && (
                            <span>{t('transactions.category')}: {item.category}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('transactions.basePrice')}:</span>
                        <div className="font-medium">
                          {formatCurrency(item.basePrice)}
                        </div>
                      </div>
                      
                      {item.taxAmount > 0 && (
                        <div>
                          <span className="text-muted-foreground">{t('transactions.taxAmount')}:</span>
                          <div className="font-medium">
                            {formatCurrency(item.taxAmount)}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-muted-foreground">{t('transactions.finalPrice')}:</span>
                        <div className="font-medium">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">{t('transactions.lineTotal')}:</span>
                        <div className="font-medium text-primary">
                          {formatCurrency(item.totalPrice * item.quantity)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tax Breakdown for this item */}
                    {item.taxBreakdown.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">{t('transactions.appliedTaxes')}:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {item.taxBreakdown.map((tax, taxIndex) => (
                            <div key={taxIndex} className="flex justify-between p-2 bg-muted/50 rounded">
                              <span>{tax.taxName} ({tax.percentage}%)</span>
                              <span>
                                {formatCurrency(tax.amount * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('transactions.paymentSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{t('transactions.subtotal')}:</span>
                  {formatCurrency(transaction.subtotal)}
                </div>
                
                {transaction.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>{t('transactions.tax')}:</span>
                    {formatCurrency(transaction.totalTax)}
                  </div>
                )}
                
                {transaction.adjustAmount !== 0 && (
                  <div className="flex justify-between">
                    <span>{t('transactions.adjustment')}:</span>
                    <span className={transaction.adjustAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {transaction.adjustAmount > 0 ? '+' : ''}
                      {formatCurrency(transaction.adjustAmount)}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('transactions.total')}:</span>
                  <span className="text-primary">
                    {formatCurrency(transaction.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary - Only show if there are taxes */}
          {transaction.totalTax > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('transactions.taxBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <TaxBreakdown 
                  taxBreakdown={transaction.items.flatMap(item => 
                    item.taxBreakdown.map(tax => ({
                      ...tax,
                      amount: tax.amount * item.quantity
                    }))
                  )}
                  basePrice={transaction.subtotal}
                  currency="MVR"
                  showDetailed={true}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={handlePrintReceipt} variant="outline" size="sm">
            <Printer className="size-4 mr-2" />
            {t('transactions.printReceipt')}
          </Button>
          
          <Button onClick={handleExportTransaction} variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            {t('transactions.exportTransaction')}
          </Button>
          
          <Button onClick={handleDuplicateTransaction} variant="outline" size="sm">
            <Copy className="size-4 mr-2" />
            {t('transactions.duplicateTransaction')}
          </Button>
          
          <div className="flex-1" />
          
          <Button onClick={onClose} variant="default">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
