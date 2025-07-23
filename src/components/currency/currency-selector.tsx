"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveCurrencies, type Currency } from "@/lib/currency";
import { useI18n } from "@/contexts/translation-context";
import { toast } from "sonner";

interface CurrencySelectorProps {
  value?: number;
  onValueChange?: (currencyId: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  showFullName?: boolean; // Show both symbol and name
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  size = "default",
  showFullName = false,
}: CurrencySelectorProps) {
  const { t } = useI18n()
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const defaultPlaceholder = placeholder || t('currency.selectCurrency')

  const loadCurrencies = useCallback(async (): Promise<void> => {
    try {
      const currencyList = await getActiveCurrencies();
      setCurrencies(currencyList);
    } catch (error) {
      console.error("Failed to load currencies:", error);
      toast.error(t('currency.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleValueChange = (currencyIdString: string): void => {
    const currencyId = currencyIdString ? parseInt(currencyIdString, 10) : undefined;
    onValueChange?.(currencyId);
  };

  const selectedCurrency = currencies.find(c => c.id === value);

  return (
    <Select
      value={value?.toString() || ""}
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={isLoading ? t('currency.loading') : defaultPlaceholder}>
          {selectedCurrency && (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedCurrency.symbol}</span>
              {showFullName && (
                <span className="text-muted-foreground">
                  {selectedCurrency.name} ({selectedCurrency.code})
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.id} value={currency.id.toString()}>
            <span className="flex items-center gap-2">
              <span className="font-medium text-base">{currency.symbol}</span>
              <span className="text-sm">{currency.code}</span>
              {showFullName && (
                <span className="text-muted-foreground text-xs">- {currency.name}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
