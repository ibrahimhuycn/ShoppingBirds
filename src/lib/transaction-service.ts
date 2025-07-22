import { supabase } from "@/lib/supabase";
import type { 
  Transaction, 
  TransactionFilters, 
  TransactionSearchOptions,
  InvoiceWithDetails,
  TransactionSummary 
} from "@/types/transactions";
import type { Currency } from "@/types/currency";
import type { TaxBreakdownItem } from "@/types/tax";

export class TransactionService {
  /**
   * Fetch transactions with filters and pagination
   */
  static async getTransactions(options: TransactionSearchOptions): Promise<{
    transactions: Transaction[];
    totalCount: number;
  }> {
    const { sortBy, sortOrder, page, limit, filters } = options;
    
    // Build query with relationships including currencies
    let query = supabase
      .from("invoices")
      .select(`
        *,
        stores (id, name),
        users (id, full_name, username),
        invoice_details (
          *,
          items (description, brand, model, category),
          invoice_detail_taxes (
            *,
            tax_types (name, percentage)
          )
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters.storeId) {
      query = query.eq('store_id', filters.storeId);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.minAmount) {
      query = query.gte('total', filters.minAmount);
    }
    if (filters.maxAmount) {
      query = query.lte('total', filters.maxAmount);
    }
    if (filters.search) {
      query = query.or(`number.ilike.%${filters.search}%`);
    }
    
    // Apply sorting
    const sortColumn = sortBy === 'store' ? 'stores.name' : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
    
    const transactions = await Promise.all(
      (data as InvoiceWithDetails[])?.map(invoice => this.transformInvoiceToTransaction(invoice)) || []
    );
    
    return {
      transactions,
      totalCount: count || 0
    };
  }
  
  /**
   * Get a single transaction by ID with full details
   */
  static async getTransactionById(id: number): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        stores (id, name),
        users (id, full_name, username),
        invoice_details (
          *,
          items (description, brand, model, category),
          invoice_detail_taxes (
            *,
            tax_types (name, percentage)
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
    
    return await this.transformInvoiceToTransaction(data as InvoiceWithDetails);
  }
  
  /**
   * Get transaction summary statistics
   */
  static async getTransactionSummary(filters?: TransactionFilters): Promise<TransactionSummary> {
    // Build base query
    let query = supabase
      .from("invoices")
      .select(`
        id,
        total,
        date,
        store_id,
        stores (name),
        invoice_details (
          quantity,
          total_price,
          item_id,
          items (description)
        )
      `);
    
    // Apply filters if provided
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch transaction summary: ${error.message}`);
    }
    
    // Calculate summary statistics
    const transactions = data || [];
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalItemsSold = transactions.reduce((sum, t) => 
      sum + (t.invoice_details?.reduce((itemSum, detail) => itemSum + detail.quantity, 0) || 0), 0
    );
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Calculate top selling items
    const itemSales = new Map<number, { description: string; quantity: number; revenue: number }>();
    transactions.forEach(transaction => {
      transaction.invoice_details?.forEach(detail => {
        const existing = itemSales.get(detail.item_id) || { 
          description: detail.items?.description || 'Unknown', 
          quantity: 0, 
          revenue: 0 
        };
        existing.quantity += detail.quantity;
        existing.revenue += detail.total_price;
        itemSales.set(detail.item_id, existing);
      });
    });
    
    const topSellingItems = Array.from(itemSales.entries())
      .map(([itemId, data]) => ({
        itemId,
        description: data.description,
        quantitySold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
    
    // Calculate sales by store
    const storeSales = new Map<number, { name: string; transactionCount: number; revenue: number }>();
    transactions.forEach(transaction => {
      const existing = storeSales.get(transaction.store_id) || {
        name: transaction.stores?.name || 'Unknown',
        transactionCount: 0,
        revenue: 0
      };
      existing.transactionCount += 1;
      existing.revenue += transaction.total;
      storeSales.set(transaction.store_id, existing);
    });
    
    const salesByStore = Array.from(storeSales.entries())
      .map(([storeId, data]) => ({
        storeId,
        storeName: data.name,
        transactionCount: data.transactionCount,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    return {
      totalTransactions,
      totalRevenue,
      totalItemsSold,
      averageTransactionValue,
      topSellingItems,
      salesByStore
    };
  }
  
  /**
   * Transform invoice database record to Transaction object
   */
  private static async transformInvoiceToTransaction(invoice: InvoiceWithDetails): Promise<Transaction> {
    const items = await Promise.all(invoice.invoice_details?.map(async (detail) => {
      // Transform tax details to tax breakdown
      const taxBreakdown: TaxBreakdownItem[] = detail.invoice_detail_taxes?.map(tax => ({
        taxId: tax.tax_type_id,
        taxName: tax.tax_types?.name || 'Unknown Tax',
        percentage: tax.tax_percentage,
        amount: tax.tax_amount,
        effectiveDate: new Date().toISOString().split('T')[0] // Use current date as placeholder
      })) || [];
      
      return {
        id: detail.id,
        itemId: detail.item_id,
        description: detail.items?.description || 'Unknown Item',
        barcode: null, // Not available in invoice details, would need to join with price_lists
        basePrice: detail.base_price,
        taxAmount: detail.tax_amount || 0,
        totalPrice: detail.total_price,
        quantity: detail.quantity,
        unit: 'each', // Default unit, would need to join with units table
        brand: detail.items?.brand,
        model: detail.items?.model,
        category: detail.items?.category,
        taxBreakdown
      };
    }) || []);
    
    // Get currency information from price_lists for the first item (transactions should have consistent currency)
    let transactionCurrency: Currency | undefined;
    if (items.length > 0) {
      const { data: priceListData } = await supabase
        .from('price_lists')
        .select(`
          currency_id,
          currencies (id, code, name, symbol, factor, is_base_currency, decimal_places, is_active, update_source)
        `)
        .eq('item_id', items[0].itemId)
        .eq('store_id', invoice.store_id)
        .eq('is_active', true)
        .single();
        
      if (priceListData?.currencies) {
        const curr = priceListData.currencies;
        transactionCurrency = {
          id: curr.id,
          code: curr.code,
          name: curr.name,
          symbol: curr.symbol,
          factor: curr.factor,
          isBaseCurrency: curr.is_base_currency,
          decimalPlaces: curr.decimal_places,
          isActive: curr.is_active,
          updateSource: curr.update_source || 'manual',
          createdAt: '', // Not needed for display
          updatedAt: '' // Not needed for display
        };
      }
    }
    
    const subtotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      id: invoice.id,
      number: invoice.number,
      date: invoice.date,
      adjustAmount: invoice.adjust_amount,
      total: invoice.total,
      createdAt: invoice.created_at || '',
      updatedAt: invoice.updated_at,
      store: {
        id: invoice.stores.id,
        name: invoice.stores.name
      },
      user: {
        id: invoice.users.id,
        fullName: invoice.users.full_name,
        username: invoice.users.username
      },
      items,
      currency: transactionCurrency, // Include the actual currency
      subtotal,
      totalTax,
      itemCount
    };
  }
}
