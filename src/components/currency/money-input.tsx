"use client";

import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { CurrencySelector } from "./currency-selector";
import { getCurrencyById, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value?: {
    amount: number;
    currencyId: number;
  };
  onValueChange?: (value: { amount: number; currencyId: number } | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  currencyDisabled?: boolean;
  showCurrencyFullName?: boolean;
  defaultCurrencyId?: number;
}

export const MoneyInput = forwardRef<HTMLDivElement, MoneyInputProps>(
  ({
    value,
    onValueChange,
    placeholder = "0.00",
    disabled = false,
    className,
    currencyDisabled = false,
    showCurrencyFullName = false,
    defaultCurrencyId,
  }, ref) => {
    const [currency, setCurrency] = useState<Currency | null>(null);

    useEffect(() => {
      const loadCurrency = async (): Promise<void> => {
        if (value?.currencyId) {
          const currencyData = await getCurrencyById(value.currencyId);
          setCurrency(currencyData);
        } else if (defaultCurrencyId) {
          const currencyData = await getCurrencyById(defaultCurrencyId);
          setCurrency(currencyData);
        }
      };

      loadCurrency();
    }, [value?.currencyId, defaultCurrencyId]);

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
      const numericValue = parseFloat(event.target.value) || 0;
      const currencyId = value?.currencyId || defaultCurrencyId;
      
      if (currencyId) {
        onValueChange?.({
          amount: numericValue,
          currencyId,
        });
      }
    };

    const handleCurrencyChange = (currencyId: number | undefined): void => {
      if (currencyId) {
        onValueChange?.({
          amount: value?.amount || 0,
          currencyId,
        });
      }
    };

    const formatPlaceholder = (): string => {
      if (currency?.decimalPlaces === 0) {
        return "0";
      }
      return "0." + "0".repeat(currency?.decimalPlaces || 2);
    };

    return (
      <div ref={ref} className={cn("flex gap-2", className)}>
        <div className="relative flex-1">
          {currency && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {currency.symbol}
            </span>
          )}
          <Input
            type="number"
            value={value?.amount || ""}
            onChange={handleAmountChange}
            placeholder={currency ? formatPlaceholder() : placeholder}
            disabled={disabled}
            className={currency ? "pl-8" : ""}
            step={currency ? Math.pow(10, -(currency.decimalPlaces || 2)) : 0.01}
          />
        </div>
        <CurrencySelector
          value={value?.currencyId || defaultCurrencyId}
          onValueChange={handleCurrencyChange}
          disabled={disabled || currencyDisabled}
          showFullName={showCurrencyFullName}
          className="w-32"
        />
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";
