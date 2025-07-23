import { useState, useEffect, useCallback } from 'react';
import { TransactionService } from '@/lib/transaction-service';
import type { 
  Transaction, 
  TransactionFilters, 
  TransactionSearchOptions,
  TransactionSummary 
} from '@/types/transactions';

export interface UseTransactionsReturn {
  transactions: Transaction[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  searchOptions: TransactionSearchOptions;
  updateSearchOptions: (options: Partial<TransactionSearchOptions>) => void;
  refreshTransactions: () => Promise<void>;
  getTransactionById: (id: number) => Promise<Transaction | null>;
}

const DEFAULT_SEARCH_OPTIONS: TransactionSearchOptions = {
  sortBy: 'date',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
  filters: {}
};

export function useTransactions(initialOptions?: Partial<TransactionSearchOptions>): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOptions, setSearchOptions] = useState<TransactionSearchOptions>({
    ...DEFAULT_SEARCH_OPTIONS,
    ...initialOptions
  });

  const fetchTransactions = useCallback(async (options: TransactionSearchOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await TransactionService.getTransactions(options);
      setTransactions(result.transactions);
      setTotalCount(result.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSearchOptions = useCallback((options: Partial<TransactionSearchOptions>) => {
    setSearchOptions(prev => {
      const newOptions = {
        ...prev,
        ...options,
        filters: { ...prev.filters, ...options.filters }
      };
      
      // If page is not explicitly set and other options changed, reset to page 1
      if (!options.page && (options.sortBy || options.sortOrder || options.filters)) {
        newOptions.page = 1;
      }
      
      return newOptions;
    });
  }, []);

  const refreshTransactions = useCallback(async () => {
    await fetchTransactions(searchOptions);
  }, [fetchTransactions, searchOptions]);

  const getTransactionById = useCallback(async (id: number): Promise<Transaction | null> => {
    try {
      return await TransactionService.getTransactionById(id);
    } catch (err) {
      console.error('Error fetching transaction by ID:', err);
      return null;
    }
  }, []);

  // Fetch transactions when search options change
  useEffect(() => {
    fetchTransactions(searchOptions);
  }, [fetchTransactions, searchOptions]);

  return {
    transactions,
    totalCount,
    isLoading,
    error,
    searchOptions,
    updateSearchOptions,
    refreshTransactions,
    getTransactionById
  };
}

export interface UseTransactionSummaryReturn {
  summary: TransactionSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshSummary: () => Promise<void>;
}

export function useTransactionSummary(filters?: TransactionFilters): UseTransactionSummaryReturn {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await TransactionService.getTransactionSummary(filters);
      setSummary(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction summary';
      setError(errorMessage);
      console.error('Error fetching transaction summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const refreshSummary = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary
  };
}
