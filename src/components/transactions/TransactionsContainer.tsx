import { TransactionFiltersComponent } from "./TransactionFilters";
import { TransactionList } from "./TransactionList";
import { TransactionSummaryCards } from "./TransactionSummaryCards";
import { useTransactions } from "@/hooks/transactions";
import { useI18n } from "@/contexts/translation-context";

interface TransactionsContainerProps {
  className?: string;
}

export function TransactionsContainer({ className }: TransactionsContainerProps): JSX.Element {
  const { t } = useI18n();
  
  const {
    transactions,
    totalCount,
    isLoading,
    error,
    searchOptions,
    updateSearchOptions
  } = useTransactions({
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    filters: {}
  });

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t('transactions.title')}</h1>
        <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <TransactionSummaryCards
        transactions={transactions}
        isLoading={isLoading}
        dateRange={{
          from: searchOptions.filters.dateFrom,
          to: searchOptions.filters.dateTo
        }}
      />

      {/* Filters */}
      <TransactionFiltersComponent
        searchOptions={searchOptions}
        onOptionsChange={updateSearchOptions}
        isLoading={isLoading}
      />

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        totalCount={totalCount}
        searchOptions={searchOptions}
        onOptionsChange={updateSearchOptions}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
