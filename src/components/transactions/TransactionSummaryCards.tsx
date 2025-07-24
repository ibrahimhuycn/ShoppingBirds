import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, Users } from "lucide-react";
import { useI18n } from "@/contexts/translation-context";
import { TransactionUtils } from "@/lib/transaction-utils";
import type { Transaction } from "@/types/transactions";

interface TransactionSummaryCardsProps {
  transactions: Transaction[];
  isLoading?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export function TransactionSummaryCards({ 
  transactions, 
  isLoading = false,
  dateRange 
}: TransactionSummaryCardsProps): JSX.Element {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = TransactionUtils.calculateTransactionStats(transactions);
  const topItems = TransactionUtils.getTopSellingItems(transactions, 1);
  const storePerformance = TransactionUtils.getSalesPerformanceByStore(transactions);

  const summaryCards = [
    {
      title: t('transactions.total'),
      value: formatCurrency(stats.totalRevenue),
      description: `${stats.totalTransactions} ${t('transactions.title').toLowerCase()}`,
      icon: DollarSign,
      trend: null, // Could calculate trend if we had historical data
      color: "text-green-600"
    },
    {
      title: t('transactions.items'),
      value: stats.totalItemsSold.toString(),
      description: t('transactions.oneItem', { count: stats.totalItemsSold }),
      icon: ShoppingBag,
      trend: null,
      color: "text-blue-600"
    },
    {
      title: "Average Transaction",
      value: formatCurrency(stats.averageTransactionValue),
      description: "Per transaction",
      icon: Receipt,
      trend: null,
      color: "text-purple-600"
    },
    {
      title: "Top Item",
      value: topItems.length > 0 ? topItems[0].totalQuantity.toString() : "0",
      description: topItems.length > 0 ? topItems[0].description : "No items",
      icon: TrendingUp,
      trend: null,
      color: "text-orange-600"
    }
  ];

  const formatDateRange = (): string => {
    if (!dateRange?.from && !dateRange?.to) {
      return "All time";
    }
    
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    } else if (dateRange.from) {
      return `From ${formatDate(dateRange.from)}`;
    } else if (dateRange.to) {
      return `Until ${formatDate(dateRange.to)}`;
    }
    
    return "All time";
  };

  return (
    <div className="space-y-4">
      {/* Date Range Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Transaction Summary</h3>
          <p className="text-sm text-muted-foreground">{formatDateRange()}</p>
        </div>
        {stats.totalTransactions > 0 && (
          <Badge variant="secondary">
            {stats.totalTransactions} {stats.totalTransactions === 1 ? 'transaction' : 'transactions'}
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                {card.trend && (
                  <div className="flex items-center text-xs mt-1">
                    {card.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={card.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(card.trend)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Store Performance */}
      {storePerformance.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store Performance</CardTitle>
            <CardDescription>Revenue by store location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storePerformance.slice(0, 5).map((store, index) => (
                <div key={store.storeId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{store.storeName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(store.totalRevenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {store.transactionCount} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
