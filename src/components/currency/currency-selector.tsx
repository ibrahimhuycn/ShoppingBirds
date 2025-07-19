"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveCurrencies, type Currency } from "@/lib/currency";
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
  placeholder = "Select currency",
  disabled = false,
  className,
  size = "default",
  showFullName = false,
}: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCurrencies = async (): Promise<void> => {
      try {
        const currencyList = await getActiveCurrencies();
        setCurrencies(currencyList);
      } catch (error) {
        console.error("Failed to load currencies:", error);
        toast.error("Failed to load currencies");
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrencies();
  }, []);

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
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder}>
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
