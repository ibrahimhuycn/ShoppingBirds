import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyDisplay } from "@/components/currency";
import { Eye, Calendar, MapPin, User, ShoppingBag, Receipt } from "lucide-react";
import { useI18n } from "@/contexts/translation-context";
import { useTransactionCurrency } from "@/hooks/currency";
import type { Transaction } from "@/types/transactions";

interface TransactionCardProps {
  transaction: Transaction;
  onViewDetails: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, onViewDetails }: TransactionCardProps): JSX.Element {
  const { t } = useI18n();
  const { currencyId: fallbackCurrencyId } = useTransactionCurrency();
  
  // Use transaction's actual currency if available, otherwise fallback to global currency
  const currencyId = transaction.currency?.id || fallbackCurrencyId;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemsText = (count: number): string => {
    return count === 1 ? t('transactions.oneItem') : t('transactions.itemsCount', { count });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="size-5 text-primary" />
              {transaction.number}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {formatDate(transaction.date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {transaction.store.name}
              </span>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              <MoneyDisplay amount={transaction.total} currencyId={currencyId} variant="large" />
            </div>
            {transaction.adjustAmount !== 0 && (
              <div className="text-sm text-muted-foreground">
                {transaction.adjustAmount > 0 ? '+' : ''}
                <MoneyDisplay amount={transaction.adjustAmount} currencyId={currencyId} /> {t('transactions.adjustment')}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('transactions.subtotal')}:</span>
              <MoneyDisplay amount={transaction.subtotal} currencyId={currencyId} />
            </div>
            {transaction.totalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('transactions.tax')}:</span>
                <MoneyDisplay amount={transaction.totalTax} currencyId={currencyId} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <ShoppingBag className="size-3" />
                {t('transactions.items')}:
              </span>
              <Badge variant="secondary">
                {getItemsText(transaction.itemCount)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="size-3" />
                {t('transactions.cashier')}:
              </span>
              <span className="text-xs">{transaction.user.fullName}</span>
            </div>
          </div>
        </div>
        
        {/* Items preview */}
        {transaction.items.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2">
              {t('transactions.itemDetails')}:
            </div>
            <div className="space-y-1">
              {transaction.items.slice(0, 2).map((item, index) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="truncate flex-1">
                    {item.quantity}× {item.description}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    <MoneyDisplay amount={item.totalPrice * item.quantity} currencyId={currencyId} />
                  </span>
                </div>
              ))}
              {transaction.items.length > 2 && (
                <div className="text-xs text-muted-foreground italic">
                  ...and {transaction.items.length - 2} more items
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {t('transactions.processed')} {t('transactions.on')} {formatDate(transaction.createdAt)}
          </div>
          <Button 
            onClick={() => onViewDetails(transaction)}
            variant="outline" 
            size="sm"
            className="ml-2"
          >
            <Eye className="size-4 mr-1" />
            {t('transactions.viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
