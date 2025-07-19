// Enhanced barcode search utilities for POS system
// Handles UPC, EAN, GTIN, and store-specific barcodes

import { supabase } from './supabase'
import type { Database } from '@/types/database'

type PriceListItem = Database['public']['Tables']['price_lists']['Row'] & {
  items: { description: string; ean: string | null; upc: string | null; gtin: string | null }
  units: { unit: string }
}

export interface BarcodeSearchResult {
  found: boolean
  item?: PriceListItem
  searchMethod?: 'price_list' | 'ean' | 'upc' | 'gtin'
  message?: string
}

/**
 * Enhanced barcode search that looks in multiple places:
 * 1. price_lists.barcode (store-specific)
 * 2. items.ean, items.upc, items.gtin (product codes)
 * 3. Optionally filter by currency
 */
export async function searchItemByBarcode(
  barcode: string, 
  storeId: number,
  preferredCurrency?: string
): Promise<BarcodeSearchResult> {
  const cleanBarcode = barcode.trim()
  
  if (!cleanBarcode) {
    return { found: false, message: 'Barcode is required' }
  }

  try {
    // Method 1: Search price_lists.barcode (store-specific barcodes)
    let priceListQuery = supabase
      .from('price_lists')
      .select(`
        *,
        items!inner (description, ean, upc, gtin),
        units!inner (unit)
      `)
      .eq('barcode', cleanBarcode)
      .eq('store_id', storeId)
      .eq('is_active', true)
    
    // If currency preference is specified, try to find matching currency first
    if (preferredCurrency) {
      priceListQuery = priceListQuery.eq('currency', preferredCurrency)
    }
    
    const { data: priceListData, error: priceListError } = await priceListQuery.maybeSingle()

    if (!priceListError && priceListData) {
      return {
        found: true,
        item: priceListData as PriceListItem,
        searchMethod: 'price_list'
      }
    }
    
    // If no match with preferred currency, try without currency filter
    if (preferredCurrency && priceListError?.code === 'PGRST116') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('price_lists')
        .select(`
          *,
          items!inner (description, ean, upc, gtin),
          units!inner (unit)
        `)
        .eq('barcode', cleanBarcode)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .maybeSingle()
        
      if (!fallbackError && fallbackData) {
        return {
          found: true,
          item: fallbackData as PriceListItem,
          searchMethod: 'price_list'
        }
      }
    }

    // Method 2: Search items by EAN/UPC/GTIN, then find price for store
    let itemsQuery = supabase
      .from('items')
      .select(`
        id,
        description,
        ean,
        upc,
        gtin,
        price_lists!inner (
          *,
          units!inner (unit)
        )
      `)
      .or(`ean.eq.${cleanBarcode},upc.eq.${cleanBarcode},gtin.eq.${cleanBarcode}`)
      .eq('price_lists.store_id', storeId)
      .eq('price_lists.is_active', true)
    
    // Prefer items with matching currency
    if (preferredCurrency) {
      itemsQuery = itemsQuery.eq('price_lists.currency', preferredCurrency)
    }
    
    const { data: itemsData, error: itemsError } = await itemsQuery.maybeSingle()

    if (!itemsError && itemsData && itemsData.price_lists.length > 0) {
      const priceListItem = itemsData.price_lists[0]
      
      // Determine which field matched
      let searchMethod: 'ean' | 'upc' | 'gtin' = 'ean'
      if (itemsData.upc === cleanBarcode) searchMethod = 'upc'
      else if (itemsData.gtin === cleanBarcode) searchMethod = 'gtin'

      return {
        found: true,
        item: {
          ...priceListItem,
          items: {
            description: itemsData.description,
            ean: itemsData.ean,
            upc: itemsData.upc,
            gtin: itemsData.gtin
          },
          units: priceListItem.units
        } as PriceListItem,
        searchMethod
      }
    }
    
    // If no match with preferred currency, try without currency filter
    if (preferredCurrency && (itemsError?.code === 'PGRST116' || !itemsData?.price_lists.length)) {
      const { data: fallbackItemsData, error: fallbackItemsError } = await supabase
        .from('items')
        .select(`
          id,
          description,
          ean,
          upc,
          gtin,
          price_lists!inner (
            *,
            units!inner (unit)
          )
        `)
        .or(`ean.eq.${cleanBarcode},upc.eq.${cleanBarcode},gtin.eq.${cleanBarcode}`)
        .eq('price_lists.store_id', storeId)
        .eq('price_lists.is_active', true)
        .maybeSingle()

      if (!fallbackItemsError && fallbackItemsData && fallbackItemsData.price_lists.length > 0) {
        const priceListItem = fallbackItemsData.price_lists[0]
        
        // Determine which field matched
        let searchMethod: 'ean' | 'upc' | 'gtin' = 'ean'
        if (fallbackItemsData.upc === cleanBarcode) searchMethod = 'upc'
        else if (fallbackItemsData.gtin === cleanBarcode) searchMethod = 'gtin'

        return {
          found: true,
          item: {
            ...priceListItem,
            items: {
              description: fallbackItemsData.description,
              ean: fallbackItemsData.ean,
              upc: fallbackItemsData.upc,
              gtin: fallbackItemsData.gtin
            },
            units: priceListItem.units
          } as PriceListItem,
          searchMethod
        }
      }
    }

    // Method 3: Found item but no price for this store
    const { data: itemOnlyData, error: itemOnlyError } = await supabase
      .from('items')
      .select('id, description, ean, upc, gtin')
      .or(`ean.eq.${cleanBarcode},upc.eq.${cleanBarcode},gtin.eq.${cleanBarcode}`)
      .maybeSingle()

    if (!itemOnlyError && itemOnlyData) {
      return {
        found: false,
        message: `Item "${itemOnlyData.description}" found but no price set for this store`
      }
    }

    // Nothing found
    return {
      found: false,
      message: `No item found with barcode "${cleanBarcode}"`
    }

  } catch (error) {
    console.error('Barcode search error:', error)
    return {
      found: false,
      message: 'Search error occurred'
    }
  }
}

/**
 * Utility to normalize barcode formats
 * UPC-A (12 digits) can be converted to EAN-13 by prepending 0
 * EAN-8 should be handled as-is
 */
export function normalizeBarcodes(code: string): string[] {
  const cleaned = code.replace(/\D/g, '') // Remove non-digits
  const variants: string[] = [cleaned]
  
  // UPC-A to EAN-13 conversion
  if (cleaned.length === 12) {
    variants.push('0' + cleaned)
  }
  
  // EAN-13 to UPC-A conversion (remove leading 0)
  if (cleaned.length === 13 && cleaned.startsWith('0')) {
    variants.push(cleaned.substring(1))
  }
  
  return [...new Set(variants)] // Remove duplicates
}

/**
 * Enhanced search that tries multiple barcode variants
 */
export async function searchItemByBarcodeWithVariants(
  barcode: string,
  storeId: number,
  preferredCurrency?: string
): Promise<BarcodeSearchResult> {
  const variants = normalizeBarcodes(barcode)
  
  for (const variant of variants) {
    const result = await searchItemByBarcode(variant, storeId, preferredCurrency)
    if (result.found) {
      return result
    }
  }
  
  // If no variants found, return the result from the original search
  return await searchItemByBarcode(barcode, storeId, preferredCurrency)
}
