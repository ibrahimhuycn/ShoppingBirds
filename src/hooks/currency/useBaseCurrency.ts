import { useState, useEffect } from 'react';
import { getBaseCurrency } from '@/lib/currency';
import { SettingsService } from '@/lib/settings';
import type { Currency } from '@/types/currency';

/**
 * Hook to get the base currency for the application
 */
export function useBaseCurrency(): {
  baseCurrency: Currency | null;
  isLoading: boolean;
  error: string | null;
} {
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBaseCurrency = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get default currency from settings first
        const defaultCurrencyId = SettingsService.getDefaultCurrencyId();
        
        if (defaultCurrencyId) {
          const { getCurrencyById } = await import('@/lib/currency');
          const defaultCurrency = await getCurrencyById(defaultCurrencyId);
          if (defaultCurrency) {
            setBaseCurrency(defaultCurrency);
            return;
          }
        }
        
        // Fallback to system base currency
        const currency = await getBaseCurrency();
        setBaseCurrency(currency);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load base currency';
        setError(errorMessage);
        console.error('Error loading base currency:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBaseCurrency();
  }, []);

  return {
    baseCurrency,
    isLoading,
    error
  };
}

/**
 * Hook to get currency ID for transactions display
 * Returns the base currency ID to use for consistent transaction display
 */
export function useTransactionCurrency(): {
  currencyId: number;
  currency: Currency | null;
  isLoading: boolean;
} {
  const { baseCurrency, isLoading } = useBaseCurrency();
  
  return {
    currencyId: baseCurrency?.id ?? 1, // Default to ID 1 if no base currency
    currency: baseCurrency,
    isLoading
  };
}
