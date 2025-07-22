"use client";

import { useState, useEffect } from 'react';
import { getActiveCurrencies, getBaseCurrency, getCurrencyById } from '@/lib/currency';
import { useTransactionCurrency } from '@/hooks/currency';
import { MoneyDisplay } from '@/components/currency';
import type { Currency } from '@/types/currency';

export default function CurrencyDebugPage(): JSX.Element {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currencyId, currency } = useTransactionCurrency();

  useEffect(() => {
    const loadCurrencies = async (): Promise<void> => {
      try {
        const [allCurrencies, base] = await Promise.all([
          getActiveCurrencies(),
          getBaseCurrency()
        ]);
        
        setCurrencies(allCurrencies);
        setBaseCurrency(base);
        
        console.log('All currencies:', allCurrencies);
        console.log('Base currency:', base);
        console.log('Transaction currency ID:', currencyId);
        console.log('Transaction currency object:', currency);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load currencies');
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();
  }, [currencyId, currency]);

  if (loading) {
    return <div>Loading currencies...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Currency Debug Information</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold">Current Transaction Currency</h2>
          <p>Currency ID: {currencyId}</p>
          <p>Currency Object: {JSON.stringify(currency, null, 2)}</p>
          <p>Test Amount Display: <MoneyDisplay amount={100.50} currencyId={currencyId} /></p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold">Base Currency</h2>
          <pre>{JSON.stringify(baseCurrency, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold">All Active Currencies</h2>
          {currencies.map((curr) => (
            <div key={curr.id} className="mb-2 p-2 border">
              <p><strong>ID:</strong> {curr.id}</p>
              <p><strong>Code:</strong> {curr.code}</p>
              <p><strong>Name:</strong> {curr.name}</p>
              <p><strong>Symbol:</strong> {curr.symbol}</p>
              <p><strong>Factor:</strong> {curr.factor}</p>
              <p><strong>Is Base:</strong> {curr.isBaseCurrency ? 'Yes' : 'No'}</p>
              <p><strong>Test Display:</strong> <MoneyDisplay amount={100.50} currencyId={curr.id} /></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
