import { supabase } from '@/lib/supabase';
import type { Currency, CurrencyInsert, CurrencyUpdate, CurrencyConversion, MoneyAmount, CurrencyFormatOptions } from '@/types/currency';

export class CurrencyService {
  private static baseCurrency: Currency | null = null;
  private static currencies: Currency[] = [];

  /**
   * Get all active currencies
   */
  static async getActiveCurrencies(): Promise<Currency[]> {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (error) {
      throw new Error(`Failed to fetch currencies: ${error.message}`);
    }

    CurrencyService.currencies = data.map(CurrencyService.mapDatabaseToCurrency);
    return CurrencyService.currencies;
  }

  /**
   * Get base currency
   */
  static async getBaseCurrency(): Promise<Currency> {
    if (CurrencyService.baseCurrency) {
      return CurrencyService.baseCurrency;
    }

    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_base_currency', true)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('No base currency found');
    }

    CurrencyService.baseCurrency = CurrencyService.mapDatabaseToCurrency(data);
    return CurrencyService.baseCurrency;
  }

  /**
   * Get currency by ID
   */
  static async getCurrencyById(id: number): Promise<Currency | null> {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return CurrencyService.mapDatabaseToCurrency(data);
  }

  /**
   * Get currency by code
   */
  static async getCurrencyByCode(code: string): Promise<Currency | null> {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return null;
    }

    return CurrencyService.mapDatabaseToCurrency(data);
  }

  /**
   * Create new currency
   */
  static async createCurrency(currency: CurrencyInsert): Promise<Currency> {
    const { data, error } = await supabase
      .from('currencies')
      .insert({
        code: currency.code.toUpperCase(),
        name: currency.name,
        symbol: currency.symbol,
        factor: currency.factor ?? 1.0,
        is_base_currency: currency.isBaseCurrency ?? false,
        decimal_places: currency.decimalPlaces ?? 2,
        is_active: currency.isActive ?? true,
        update_source: currency.updateSource ?? 'manual',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create currency: ${error.message}`);
    }

    return CurrencyService.mapDatabaseToCurrency(data);
  }

  /**
   * Update currency
   */
  static async updateCurrency(id: number, updates: CurrencyUpdate): Promise<Currency> {
    const updateData: any = {};
    
    if (updates.code) updateData.code = updates.code.toUpperCase();
    if (updates.name) updateData.name = updates.name;
    if (updates.symbol) updateData.symbol = updates.symbol;
    if (updates.factor !== undefined) updateData.factor = updates.factor;
    if (updates.isBaseCurrency !== undefined) updateData.is_base_currency = updates.isBaseCurrency;
    if (updates.decimalPlaces !== undefined) updateData.decimal_places = updates.decimalPlaces;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.updateSource) updateData.update_source = updates.updateSource;

    const { data, error } = await supabase
      .from('currencies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update currency: ${error.message}`);
    }

    // Clear cache if base currency was updated
    if (updates.isBaseCurrency) {
      CurrencyService.baseCurrency = null;
    }

    return CurrencyService.mapDatabaseToCurrency(data);
  }

  /**
   * Convert amount between currencies
   */
  static async convertCurrency(
    amount: number,
    fromCurrencyId: number,
    toCurrencyId: number
  ): Promise<CurrencyConversion> {
    const [fromCurrency, toCurrency] = await Promise.all([
      CurrencyService.getCurrencyById(fromCurrencyId),
      CurrencyService.getCurrencyById(toCurrencyId),
    ]);

    if (!fromCurrency || !toCurrency) {
      throw new Error('Currency not found');
    }

    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromCurrency.factor;
    const convertedAmount = baseAmount * toCurrency.factor;
    const conversionRate = toCurrency.factor / fromCurrency.factor;

    return {
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount,
      conversionRate,
      timestamp: new Date(),
    };
  }

  /**
   * Convert amount to base currency
   */
  static async convertToBaseCurrency(amount: number, fromCurrencyId: number): Promise<number> {
    const fromCurrency = await CurrencyService.getCurrencyById(fromCurrencyId);
    if (!fromCurrency) {
      throw new Error('Currency not found');
    }

    return amount / fromCurrency.factor;
  }

  /**
   * Format money amount with currency
   */
  static formatMoney(
    moneyAmount: MoneyAmount,
    options: CurrencyFormatOptions = {}
  ): string {
    const {
      showSymbol = true,
      showCode = false,
      decimalPlaces,
      locale = 'en-US',
    } = options;

    if (!moneyAmount.currency) {
      return moneyAmount.amount.toString();
    }

    const currency = moneyAmount.currency;
    const decimals = decimalPlaces ?? currency.decimalPlaces;

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(moneyAmount.amount);

    let result = formatted;

    if (showSymbol) {
      result = `${currency.symbol}${result}`;
    }

    if (showCode) {
      result = `${result} ${currency.code}`;
    }

    return result;
  }

  /**
   * Update exchange rates (for future API integration)
   */
  static async updateExchangeRates(rates: Record<string, number>, source = 'api'): Promise<void> {
    const currencies = await CurrencyService.getActiveCurrencies();
    const baseCurrency = await CurrencyService.getBaseCurrency();

    for (const [code, rate] of Object.entries(rates)) {
      const currency = currencies.find(c => c.code === code.toUpperCase());
      if (currency && !currency.isBaseCurrency) {
        await CurrencyService.updateCurrency(currency.id, {
          factor: rate,
          updateSource: source,
        });
      }
    }

    // Clear cache
    CurrencyService.baseCurrency = null;
    CurrencyService.currencies = [];
  }

  /**
   * Map database row to Currency interface
   */
  private static mapDatabaseToCurrency(data: any): Currency {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      factor: parseFloat(data.factor),
      isBaseCurrency: data.is_base_currency,
      decimalPlaces: data.decimal_places,
      isActive: data.is_active,
      updateSource: data.update_source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export convenience functions
export const {
  getActiveCurrencies,
  getBaseCurrency,
  getCurrencyById,
  getCurrencyByCode,
  createCurrency,
  updateCurrency,
  convertCurrency,
  convertToBaseCurrency,
  formatMoney,
  updateExchangeRates,
} = CurrencyService;
