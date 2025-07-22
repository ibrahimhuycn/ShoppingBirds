import type { Transaction, TransactionSummary } from "@/types/transactions";

/**
 * Utility functions for transaction-related operations
 */
export class TransactionUtils {
  /**
   * Calculate transaction statistics for a given period
   */
  static calculateTransactionStats(transactions: Transaction[]): {
    totalRevenue: number;
    totalItemsSold: number;
    averageTransactionValue: number;
    totalTransactions: number;
    revenueByDay: Record<string, number>;
  } {
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalItemsSold = transactions.reduce((sum, t) => sum + t.itemCount, 0);
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Group revenue by day
    const revenueByDay: Record<string, number> = {};
    transactions.forEach(transaction => {
      const date = transaction.date;
      revenueByDay[date] = (revenueByDay[date] || 0) + transaction.total;
    });

    return {
      totalRevenue,
      totalItemsSold,
      averageTransactionValue,
      totalTransactions,
      revenueByDay
    };
  }

  /**
   * Get the most popular items from transactions
   */
  static getTopSellingItems(transactions: Transaction[], limit: number = 10): Array<{
    itemId: number;
    description: string;
    totalQuantity: number;
    totalRevenue: number;
    averagePrice: number;
    transactionCount: number;
  }> {
    const itemStats = new Map<number, {
      description: string;
      totalQuantity: number;
      totalRevenue: number;
      transactionCount: number;
    }>();

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const existing = itemStats.get(item.itemId) || {
          description: item.description,
          totalQuantity: 0,
          totalRevenue: 0,
          transactionCount: 0
        };

        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.totalPrice * item.quantity;
        existing.transactionCount += 1;
        itemStats.set(item.itemId, existing);
      });
    });

    return Array.from(itemStats.entries())
      .map(([itemId, stats]) => ({
        itemId,
        description: stats.description,
        totalQuantity: stats.totalQuantity,
        totalRevenue: stats.totalRevenue,
        averagePrice: stats.totalRevenue / stats.totalQuantity,
        transactionCount: stats.transactionCount
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  /**
   * Get sales performance by store
   */
  static getSalesPerformanceByStore(transactions: Transaction[]): Array<{
    storeId: number;
    storeName: string;
    transactionCount: number;
    totalRevenue: number;
    averageTransactionValue: number;
    totalItemsSold: number;
  }> {
    const storeStats = new Map<number, {
      storeName: string;
      transactionCount: number;
      totalRevenue: number;
      totalItemsSold: number;
    }>();

    transactions.forEach(transaction => {
      const existing = storeStats.get(transaction.store.id) || {
        storeName: transaction.store.name,
        transactionCount: 0,
        totalRevenue: 0,
        totalItemsSold: 0
      };

      existing.transactionCount += 1;
      existing.totalRevenue += transaction.total;
      existing.totalItemsSold += transaction.itemCount;
      storeStats.set(transaction.store.id, existing);
    });

    return Array.from(storeStats.entries())
      .map(([storeId, stats]) => ({
        storeId,
        storeName: stats.storeName,
        transactionCount: stats.transactionCount,
        totalRevenue: stats.totalRevenue,
        averageTransactionValue: stats.totalRevenue / stats.transactionCount,
        totalItemsSold: stats.totalItemsSold
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Get hourly sales distribution
   */
  static getHourlySalesDistribution(transactions: Transaction[]): Array<{
    hour: number;
    transactionCount: number;
    totalRevenue: number;
  }> {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      transactionCount: 0,
      totalRevenue: 0
    }));

    transactions.forEach(transaction => {
      const hour = new Date(transaction.createdAt).getHours();
      hourlyStats[hour].transactionCount += 1;
      hourlyStats[hour].totalRevenue += transaction.total;
    });

    return hourlyStats;
  }

  /**
   * Format transaction for export
   */
  static formatTransactionForExport(transaction: Transaction, currencyCode: string = 'USD'): Record<string, any> {
    return {
      'Invoice Number': transaction.number,
      'Date': transaction.date,
      'Store': transaction.store.name,
      'Cashier': transaction.user.fullName,
      'Items Count': transaction.itemCount,
      'Subtotal': transaction.subtotal,
      'Tax Amount': transaction.totalTax,
      'Adjustment': transaction.adjustAmount,
      'Total': transaction.total,
      'Created At': transaction.createdAt,
      'Items': transaction.items.map(item => 
        `${item.quantity}x ${item.description} @ ${item.totalPrice.toFixed(2)}`
      ).join('; ')
    };
  }

  /**
   * Export transactions to CSV format
   */
  static exportTransactionsToCSV(transactions: Transaction[], currencyCode: string = 'USD'): string {
    if (transactions.length === 0) {
      return '';
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Store',
      'Cashier',
      'Items Count',
      'Subtotal',
      'Tax Amount',
      'Adjustment',
      'Total',
      'Created At',
      'Items'
    ];

    const csvData = transactions.map(transaction => {
      const formatted = this.formatTransactionForExport(transaction, currencyCode);
      return headers.map(header => {
        const value = formatted[header];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [headers.join(','), ...csvData].join('\n');
  }

  /**
   * Generate receipt text for a transaction
   */
  static generateReceiptText(transaction: Transaction, currencyCode: string = 'USD', currencySymbol: string = '$'): string {
    const lines: string[] = [];
    
    const formatMoney = (amount: number): string => {
      return `${currencySymbol}${amount.toFixed(2)}`;
    };
    
    lines.push('='.repeat(40));
    lines.push('RECEIPT');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(`Invoice: ${transaction.number}`);
    lines.push(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`);
    lines.push(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`);
    lines.push(`Store: ${transaction.store.name}`);
    lines.push(`Cashier: ${transaction.user.fullName}`);
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('ITEMS');
    lines.push('-'.repeat(40));
    
    transaction.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.description}`);
      lines.push(`    @ ${formatMoney(item.totalPrice)} ea = ${formatMoney(item.totalPrice * item.quantity)}`);
      if (item.taxBreakdown.length > 0) {
        item.taxBreakdown.forEach(tax => {
          lines.push(`    Tax: ${tax.taxName} (${tax.percentage}%) = ${formatMoney(tax.amount * item.quantity)}`);
        });
      }
      lines.push('');
    });
    
    lines.push('-'.repeat(40));
    lines.push(`Subtotal: ${formatMoney(transaction.subtotal)}`);
    if (transaction.totalTax > 0) {
      lines.push(`Tax: ${formatMoney(transaction.totalTax)}`);
    }
    if (transaction.adjustAmount !== 0) {
      lines.push(`Adjustment: ${formatMoney(transaction.adjustAmount)}`);
    }
    lines.push(`TOTAL: ${formatMoney(transaction.total)}`);
    lines.push('');
    lines.push('='.repeat(40));
    lines.push('Thank you for your business!');
    lines.push('='.repeat(40));
    
    return lines.join('\n');
  }

  /**
   * Validate transaction data
   */
  static validateTransaction(transaction: Partial<Transaction>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!transaction.number) {
      errors.push('Invoice number is required');
    }

    if (!transaction.date) {
      errors.push('Transaction date is required');
    }

    if (!transaction.store?.id) {
      errors.push('Store information is required');
    }

    if (!transaction.user?.id) {
      errors.push('User information is required');
    }

    if (!transaction.items || transaction.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (transaction.items) {
      transaction.items.forEach((item, index) => {
        if (!item.description) {
          errors.push(`Item ${index + 1}: Description is required`);
        }
        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (item.totalPrice < 0) {
          errors.push(`Item ${index + 1}: Price cannot be negative`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get transaction trends over time
   */
  static getTransactionTrends(transactions: Transaction[], days: number = 30): Array<{
    date: string;
    transactionCount: number;
    revenue: number;
    itemCount: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const trends = new Map<string, {
      transactionCount: number;
      revenue: number;
      itemCount: number;
    }>();

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      trends.set(dateStr, {
        transactionCount: 0,
        revenue: 0,
        itemCount: 0
      });
    }

    // Populate with actual data
    transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      })
      .forEach(transaction => {
        const dateStr = transaction.date;
        const existing = trends.get(dateStr);
        if (existing) {
          existing.transactionCount += 1;
          existing.revenue += transaction.total;
          existing.itemCount += transaction.itemCount;
        }
      });

    return Array.from(trends.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
