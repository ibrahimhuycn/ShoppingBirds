import { supabase } from "@/lib/supabase";
import { generateInvoiceNumber } from "@/lib/utils";
import type { 
  SuspendTransactionRequest,
  SuspendedTransaction,
  ResumeTransactionData,
  Transaction,
  InvoiceWithDetails
} from "@/types/transactions";
import type { TaxBreakdownItem } from "@/types/tax";

export class SuspendedTransactionService {
  /**
   * Suspend a transaction (save temporarily without payment)
   */
  static async suspendTransaction(request: SuspendTransactionRequest): Promise<number> {
    const invoiceNumber = generateInvoiceNumber();
    const total = request.cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + request.adjustAmount;

    try {
      // Create invoice with 'suspended' status
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          store_id: request.storeId,
          number: invoiceNumber,
          adjust_amount: request.adjustAmount,
          total: total,
          user_id: request.userId,
          date: new Date().toISOString().split("T")[0],
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          session_name: request.sessionName,
          notes: request.notes || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice details
      const invoiceDetails = request.cart.map((item) => ({
        invoice_id: invoiceData.id,
        item_id: item.id,
        price: item.finalPrice, // Final price including tax
        base_price: item.basePrice, // Base price before tax
        tax_amount: item.taxAmount, // Total tax amount
        total_price: item.finalPrice, // Same as final price
        quantity: item.quantity,
      }));

      const { data: detailsData, error: detailsError } = await supabase
        .from("invoice_details")
        .insert(invoiceDetails)
        .select();

      if (detailsError) throw detailsError;

      // Create invoice detail taxes for audit trail
      const invoiceDetailTaxes: any[] = [];
      
      request.cart.forEach((item, index) => {
        if (item.hasCustomTaxes && item.taxBreakdown.length > 0) {
          item.taxBreakdown.forEach((tax) => {
            invoiceDetailTaxes.push({
              invoice_detail_id: detailsData[index].id,
              tax_type_id: tax.taxId,
              tax_percentage: tax.percentage,
              tax_amount: tax.amount * item.quantity
            });
          });
        }
      });

      // Insert tax details if any exist
      if (invoiceDetailTaxes.length > 0) {
        const { error: taxDetailsError } = await supabase
          .from("invoice_detail_taxes")
          .insert(invoiceDetailTaxes);
        
        if (taxDetailsError) {
          console.error('Tax details insertion error:', taxDetailsError);
          // Don't fail the transaction for tax detail errors
        }
      }

      return invoiceData.id;
    } catch (error) {
      console.error("Error suspending transaction:", error);
      throw new Error(`Failed to suspend transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all suspended transactions with pagination
   */
  static async getSuspendedTransactions(options: {
    storeId?: number;
    userId?: number;
    page?: number;
    limit?: number;
    sortBy?: 'suspended_at' | 'session_name' | 'total';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    suspendedTransactions: SuspendedTransaction[];
    totalCount: number;
  }> {
    const { 
      storeId, 
      userId, 
      page = 1, 
      limit = 20, 
      sortBy = 'suspended_at', 
      sortOrder = 'desc' 
    } = options;

    let query = supabase
      .from("invoices")
      .select(`
        id,
        number,
        session_name,
        notes,
        total,
        adjust_amount,
        suspended_at,
        stores (id, name),
        users (id, full_name, username),
        invoice_details (quantity)
      `, { count: 'exact' })
      .eq('status', 'suspended');

    // Apply filters
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch suspended transactions: ${error.message}`);
    }

    const suspendedTransactions: SuspendedTransaction[] = (data || []).map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      sessionName: invoice.session_name,
      notes: invoice.notes,
      total: invoice.total,
      adjustAmount: invoice.adjust_amount,
      suspendedAt: invoice.suspended_at!,
      store: {
        id: invoice.stores.id,
        name: invoice.stores.name
      },
      user: {
        id: invoice.users.id,
        fullName: invoice.users.full_name,
        username: invoice.users.username
      },
      itemCount: invoice.invoice_details?.reduce((sum: number, detail: any) => sum + detail.quantity, 0) || 0
    }));

    return {
      suspendedTransactions,
      totalCount: count || 0
    };
  }

  /**
   * Resume a suspended transaction (get transaction data for editing)
   */
  static async resumeTransaction(transactionId: number): Promise<ResumeTransactionData> {
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
      .eq('id', transactionId)
      .eq('status', 'suspended')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Suspended transaction not found');
      }
      throw new Error(`Failed to resume transaction: ${error.message}`);
    }

    const invoice = data as InvoiceWithDetails;

    // Transform invoice data back to cart items
    const cartItems = await Promise.all(invoice.invoice_details?.map(async (detail) => {
      // Get price list information for this item
      const { data: priceListData } = await supabase
        .from('price_lists')
        .select('barcode, unit_id, units!inner(unit)')
        .eq('item_id', detail.item_id)
        .eq('store_id', invoice.store_id)
        .eq('is_active', true)
        .single();


      // Transform tax details to tax breakdown
      const taxBreakdown: TaxBreakdownItem[] = detail.invoice_detail_taxes?.map(tax => ({
        taxId: tax.tax_type_id,
        taxName: tax.tax_types?.name || 'Unknown Tax',
        percentage: tax.tax_percentage,
        amount: tax.tax_amount / detail.quantity, // Per unit amount
        effectiveDate: new Date().toISOString().split('T')[0]
      })) || [];

      return {
        id: detail.item_id,
        priceListId: 0, // Will be resolved when adding back to cart
        description: detail.items?.description || 'Unknown Item',
        barcode: priceListData?.barcode || '',
        basePrice: detail.base_price,
        taxAmount: (detail.tax_amount || 0) / detail.quantity, // Per unit
        finalPrice: detail.price, // Final price per unit
        quantity: detail.quantity,
        unit: priceListData?.units?.unit || 'each',
        taxBreakdown,
        hasCustomTaxes: taxBreakdown.length > 0
      };
    }) || []);

    // Transform invoice to transaction
    const transaction: Transaction = {
      id: invoice.id,
      number: invoice.number,
      date: invoice.date,
      adjustAmount: invoice.adjust_amount,
      total: invoice.total,
      createdAt: invoice.created_at || '',
      updatedAt: invoice.updated_at,
      status: 'suspended',
      suspendedAt: invoice.suspended_at,
      sessionName: invoice.session_name,
      notes: invoice.notes,
      store: {
        id: invoice.stores.id,
        name: invoice.stores.name
      },
      user: {
        id: invoice.users.id,
        fullName: invoice.users.full_name,
        username: invoice.users.username
      },
      items: [], // Items will be populated from cartItems
      subtotal: cartItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0),
      totalTax: cartItems.reduce((sum, item) => sum + (item.taxAmount * item.quantity), 0),
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };

    return {
      transaction,
      cartItems
    };
  }

  /**
   * Update a suspended transaction
   */
  static async updateSuspendedTransaction(
    transactionId: number, 
    request: SuspendTransactionRequest
  ): Promise<void> {
    const total = request.cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + request.adjustAmount;

    try {
      // Update invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          adjust_amount: request.adjustAmount,
          total: total,
          session_name: request.sessionName,
          notes: request.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('status', 'suspended');

      if (invoiceError) throw invoiceError;

      // Delete existing invoice details and taxes
      const { error: deleteDetailsError } = await supabase
        .from("invoice_details")
        .delete()
        .eq('invoice_id', transactionId);

      if (deleteDetailsError) throw deleteDetailsError;

      // Create new invoice details
      const invoiceDetails = request.cart.map((item) => ({
        invoice_id: transactionId,
        item_id: item.id,
        price: item.finalPrice,
        base_price: item.basePrice,
        tax_amount: item.taxAmount,
        total_price: item.finalPrice,
        quantity: item.quantity,
      }));

      const { data: detailsData, error: detailsError } = await supabase
        .from("invoice_details")
        .insert(invoiceDetails)
        .select();

      if (detailsError) throw detailsError;

      // Create invoice detail taxes
      const invoiceDetailTaxes: any[] = [];
      
      request.cart.forEach((item, index) => {
        if (item.hasCustomTaxes && item.taxBreakdown.length > 0) {
          item.taxBreakdown.forEach((tax) => {
            invoiceDetailTaxes.push({
              invoice_detail_id: detailsData[index].id,
              tax_type_id: tax.taxId,
              tax_percentage: tax.percentage,
              tax_amount: tax.amount * item.quantity
            });
          });
        }
      });

      if (invoiceDetailTaxes.length > 0) {
        const { error: taxDetailsError } = await supabase
          .from("invoice_detail_taxes")
          .insert(invoiceDetailTaxes);
        
        if (taxDetailsError) {
          console.error('Tax details insertion error:', taxDetailsError);
        }
      }
    } catch (error) {
      console.error("Error updating suspended transaction:", error);
      throw new Error(`Failed to update suspended transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete a suspended transaction (convert to completed)
   */
  static async completeSuspendedTransaction(transactionId: number): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .update({
        status: 'completed',
        suspended_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('status', 'suspended');

    if (error) {
      throw new Error(`Failed to complete suspended transaction: ${error.message}`);
    }
  }

  /**
   * Delete a suspended transaction
   */
  static async deleteSuspendedTransaction(transactionId: number): Promise<void> {
    // First get invoice detail IDs
    const { data: invoiceDetails, error: getDetailsError } = await supabase
      .from('invoice_details')
      .select('id')
      .eq('invoice_id', transactionId);

    if (getDetailsError) {
      throw new Error(`Failed to get transaction details: ${getDetailsError.message}`);
    }

    // Delete invoice detail taxes if any exist
    if (invoiceDetails && invoiceDetails.length > 0) {
      const detailIds = invoiceDetails.map(detail => detail.id);
      const { error: deleteTaxError } = await supabase
        .from("invoice_detail_taxes")
        .delete()
        .in('invoice_detail_id', detailIds);

      if (deleteTaxError) {
        console.error('Error deleting tax details:', deleteTaxError);
      }
    }

    // Delete invoice details
    const { error: deleteDetailsError } = await supabase
      .from("invoice_details")
      .delete()
      .eq('invoice_id', transactionId);

    if (deleteDetailsError) {
      throw new Error(`Failed to delete transaction details: ${deleteDetailsError.message}`);
    }

    // Delete invoice
    const { error: deleteInvoiceError } = await supabase
      .from("invoices")
      .delete()
      .eq('id', transactionId)
      .eq('status', 'suspended');

    if (deleteInvoiceError) {
      throw new Error(`Failed to delete suspended transaction: ${deleteInvoiceError.message}`);
    }
  }
}
