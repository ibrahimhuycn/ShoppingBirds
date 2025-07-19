export interface Currency {
  id: number;
  code: string; // ISO 4217 currency code (USD, EUR, etc.)
  name: string; // Full currency name
  symbol: string; // Currency symbol ($, €, etc.)
  factor: number; // Conversion factor to base currency
  isBaseCurrency: boolean;
  decimalPlaces: number; // Number of decimal places
  isActive: boolean;
  updateSource: string; // How factor was updated
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyInsert {
  code: string;
  name: string;
  symbol: string;
  factor?: number;
  isBaseCurrency?: boolean;
  decimalPlaces?: number;
  isActive?: boolean;
  updateSource?: string;
}

export interface CurrencyUpdate {
  code?: string;
  name?: string;
  symbol?: string;
  factor?: number;
  isBaseCurrency?: boolean;
  decimalPlaces?: number;
  isActive?: boolean;
  updateSource?: string;
}

// Helper types for currency conversion
export interface CurrencyConversion {
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: number;
  convertedAmount: number;
  conversionRate: number;
  timestamp: Date;
}

export interface MoneyAmount {
  amount: number;
  currencyId: number;
  currency?: Currency; // Optional populated currency
}

// Utility type for formatting options
export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimalPlaces?: number;
  locale?: string;
}
