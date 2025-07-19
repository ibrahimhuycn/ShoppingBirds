"use client";

import { useEffect, useState } from "react";
import { getCurrencyById, formatMoney, type Currency, type MoneyAmount, type CurrencyFormatOptions } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  amount: number;
  currencyId: number;
  className?: string;
  options?: CurrencyFormatOptions;
  showCode?: boolean;
  variant?: "default" | "large" | "small";
}

export function MoneyDisplay({
  amount,
  currencyId,
  className,
  options = {},
  showCode = false,
  variant = "default",
}: MoneyDisplayProps) {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCurrency = async (): Promise<void> => {
      try {
        const currencyData = await getCurrencyById(currencyId);
        setCurrency(currencyData);
      } catch (error) {
        console.error("Failed to load currency:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currencyId) {
      loadCurrency();
    } else {
      setIsLoading(false);
    }
  }, [currencyId]);

  if (isLoading) {
    return (
      <span className={cn("animate-pulse bg-muted rounded h-4 w-16", className)} />
    );
  }

  if (!currency) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {amount.toFixed(2)}
      </span>
    );
  }

  const moneyAmount: MoneyAmount = {
    amount,
    currencyId,
    currency,
  };

  const formatOptions: CurrencyFormatOptions = {
    showCode,
    ...options,
  };

  const formattedAmount = formatMoney(moneyAmount, formatOptions);

  const variantClasses = {
    default: "text-base",
    large: "text-lg font-semibold",
    small: "text-sm text-muted-foreground",
  };

  return (
    <span className={cn(variantClasses[variant], className)}>
      {formattedAmount}
    </span>
  );
}
