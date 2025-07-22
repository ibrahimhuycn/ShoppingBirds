import type { Database } from '../database';
import type { Currency } from '../currency';
import type { TaxBreakdownItem } from '../tax';

// Database table types
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceDetail = Database['public']['Tables']['invoice_details']['Row'];
export type InvoiceDetailTax = Database['public']['Tables']['invoice_detail_taxes']['Row'];
export type Store = Database['public']['Tables']['stores']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

// Enhanced transaction types with relationships
export interface TransactionItem {
  id: number;
  itemId: number;
  description: string;
  barcode: string | null;
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  quantity: number;
  unit: string;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  taxBreakdown: TaxBreakdownItem[];
}

export interface Transaction {
  id: number;
  number: string;
  date: string;
  adjustAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string | null;
  store: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    fullName: string;
    username: string;
  };
  items: TransactionItem[];
  currency?: Currency;
  // Calculated fields
  subtotal: number;
  totalTax: number;
  itemCount: number;
}

// Extended invoice detail with item and tax information
export interface InvoiceDetailWithItem extends InvoiceDetail {
  items: {
    description: string;
    brand?: string | null;
    model?: string | null;
    category?: string | null;
  };
  invoice_detail_taxes: Array<InvoiceDetailTax & {
    tax_types: {
      name: string;
      percentage: number;
    };
  }>;
}

// Extended invoice with all relationships
export interface InvoiceWithDetails extends Invoice {
  stores: Store;
  users: User;
  invoice_details: InvoiceDetailWithItem[];
}

// Transaction filter and search options
export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: number;
  userId?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string; // Search by invoice number or item description
}

// Transaction summary statistics
export interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageTransactionValue: number;
  topSellingItems: Array<{
    itemId: number;
    description: string;
    quantitySold: number;
    revenue: number;
  }>;
  salesByStore: Array<{
    storeId: number;
    storeName: string;
    transactionCount: number;
    revenue: number;
  }>;
}

// Transaction status types
export type TransactionStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';

// Transaction search and sort options
export interface TransactionSearchOptions {
  sortBy: 'date' | 'total' | 'number' | 'store';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  filters: TransactionFilters;
}
