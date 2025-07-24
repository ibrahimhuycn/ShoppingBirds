import { supabase } from '@/lib/supabase';
import type { 
  TaxCalculation, 
  AppliedTax, 
  PriceWithTaxes 
} from '@/types/database';

/**
 * Tax calculation service for handling all tax-related operations
 * Uses additive tax calculation method (all taxes applied to base price separately)
 */

export interface TaxType {
  id: number;
  name: string;
  description: string | null;
  percentage: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PriceListTax {
  id: number;
  price_list_id: number;
  tax_type_id: number;
  is_active: boolean;
  effective_date: string;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Calculate taxes for a given base price and tax IDs
 */
export async function calculateTaxesForPrice(
  basePrice: number,
  taxIds: number[]
): Promise<TaxCalculation> {
  try {
    if (taxIds.length === 0) {
      // No taxes applied - use default "No Tax"
      return {
        basePrice,
        appliedTaxes: [],
        totalTaxAmount: 0,
        totalTaxPercentage: 0,
        finalPrice: basePrice,
        usesDefaultNoTax: true
      };
    }

    // Get tax details for the provided tax IDs
    const { data: taxes, error } = await supabase
      .from('tax_types')
      .select('*')
      .in('id', taxIds)
      .eq('is_active', true);

    if (error) throw error;

    if (!taxes || taxes.length === 0) {
      throw new Error('No valid taxes found for provided IDs');
    }

    // Calculate taxes using additive method
    const appliedTaxes: AppliedTax[] = taxes.map(tax => {
      const taxAmount = (basePrice * tax.percentage) / 100;
      return {
        taxId: tax.id,
        taxName: tax.name,
        percentage: tax.percentage,
        amount: taxAmount,
        effectiveDate: new Date().toISOString(),
        isDefault: tax.is_default
      };
    });

    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const totalTaxPercentage = appliedTaxes.reduce((sum, tax) => sum + tax.percentage, 0);

    return {
      basePrice,
      appliedTaxes,
      totalTaxAmount,
      totalTaxPercentage,
      finalPrice: basePrice + totalTaxAmount,
      usesDefaultNoTax: false
    };

  } catch (error) {
    console.error('Error calculating taxes:', error);
    throw new Error('Failed to calculate taxes');
  }
}

/**
 * Get applicable taxes for a price list entry
 */
export async function getApplicableTaxes(priceListId: number): Promise<TaxType[]> {
  try {
    const { data, error } = await supabase
      .from('price_list_taxes')
      .select(`
        tax_types (*)
      `)
      .eq('price_list_id', priceListId)
      .eq('is_active', true)
      .lte('effective_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    return data?.map(item => item.tax_types).filter(Boolean) || [];
  } catch (error) {
    console.error('Error getting applicable taxes:', error);
    throw new Error('Failed to get applicable taxes');
  }
}

/**
 * Get all available tax types
 */
export async function getAllTaxTypes(): Promise<TaxType[]> {
  try {
    const { data, error } = await supabase
      .from('tax_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading tax types:', error);
    throw new Error('Failed to load tax types');
  }
}

/**
 * Update tax associations for a price list entry
 */
export async function updateTaxAssociations(
  priceListId: number, 
  taxIds: number[]
): Promise<void> {
  try {
    // Start a transaction by removing existing associations
    const { error: deleteError } = await supabase
      .from('price_list_taxes')
      .delete()
      .eq('price_list_id', priceListId);

    if (deleteError) throw deleteError;

    // Add new associations if any tax IDs provided
    if (taxIds.length > 0) {
      const associations = taxIds.map(taxId => ({
        price_list_id: priceListId,
        tax_type_id: taxId,
        is_active: true,
        effective_date: new Date().toISOString().split('T')[0]
      }));

      const { error: insertError } = await supabase
        .from('price_list_taxes')
        .insert(associations);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating tax associations:', error);
    throw new Error('Failed to update tax associations');
  }
}

/**
 * Transform database snake_case response to camelCase TypeScript interface
 */
function transformPriceWithTaxes(dbRow: any): PriceWithTaxes {
  return {
    priceListId: dbRow.price_list_id,
    itemId: dbRow.item_id,
    storeId: dbRow.store_id,
    barcode: dbRow.barcode,
    basePrice: parseFloat(dbRow.base_price || '0'),
    unitId: dbRow.unit_id,
    priceActive: dbRow.price_active,
    priceEffectiveDate: dbRow.price_effective_date,
    totalTaxPercentage: parseFloat(dbRow.total_tax_percentage || '0'),
    totalTaxAmount: parseFloat(dbRow.total_tax_amount || '0'),
    priceWithTaxes: parseFloat(dbRow.price_with_taxes || '0'),
    appliedTaxes: dbRow.applied_taxes || [],
    taxCount: dbRow.tax_count || 0,
    usesDefaultNoTax: dbRow.uses_default_no_tax || false
  };
}

/**
 * Get price with taxes using the database view
 */
export async function getPriceWithTaxes(priceListId: number): Promise<PriceWithTaxes | null> {
  try {
    const { data, error } = await supabase
      .from('price_with_taxes')
      .select('*')
      .eq('price_list_id', priceListId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return transformPriceWithTaxes(data);
  } catch (error) {
    console.error('Error getting price with taxes:', error);
    throw new Error('Failed to get price with taxes');
  }
}

/**
 * Get prices with taxes for an item across all stores
 */
export async function getItemPricesWithTaxes(itemId: number): Promise<PriceWithTaxes[]> {
  try {
    const { data, error } = await supabase
      .from('price_with_taxes')
      .select('*')
      .eq('item_id', itemId)
      .eq('price_active', true)
      .order('price_with_taxes', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformPriceWithTaxes);
  } catch (error) {
    console.error('Error getting item prices with taxes:', error);
    throw new Error('Failed to get item prices with taxes');
  }
}

/**
 * Bulk update tax associations for multiple price list entries
 */
export async function bulkUpdateTaxAssociations(
  updates: Array<{ priceListId: number; taxIds: number[] }>
): Promise<void> {
  try {
    // Process updates in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await Promise.all(
        batch.map(update => 
          updateTaxAssociations(update.priceListId, update.taxIds)
        )
      );
    }
  } catch (error) {
    console.error('Error in bulk tax associations update:', error);
    throw new Error('Failed to update tax associations in bulk');
  }
}

/**
 * Get default tax type (No Tax)
 */
export async function getDefaultTaxType(): Promise<TaxType | null> {
  try {
    const { data, error } = await supabase
      .from('tax_types')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default tax found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting default tax type:', error);
    throw new Error('Failed to get default tax type');
  }
}
