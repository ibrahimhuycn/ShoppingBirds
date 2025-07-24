// Product enhancement service for integrating UPC API data with our database
import { supabase } from './supabase'
import { upcApiClient, UPCItem, UPCApiClient } from './upc-api'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['items']['Row']
type ItemInsert = Database['public']['Tables']['items']['Insert']
type ItemUpdate = Database['public']['Tables']['items']['Update']
type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']

export interface EnhancedProductData {
  item: ItemInsert
  tags: string[]
  images: string[]
}

export class ProductEnhancementService {
  /**
   * Look up product by UPC and return enhanced data for database insertion
   */
  async enhanceProductByUPC(upc: string, existingDescription?: string): Promise<EnhancedProductData | null> {
    try {
      // Validate UPC format
      if (!UPCApiClient.isValidUPC(upc)) {
        throw new Error('Invalid UPC/EAN format')
      }

      const cleanUpc = UPCApiClient.formatUPC(upc)
      
      // Call UPC API
      const response = await upcApiClient.lookupProduct(cleanUpc)
      
      if (!response.items || response.items.length === 0) {
        return null // No product found
      }

      const upcItem = response.items[0] // Take the first result
      
      // Transform UPC API data to our database format
      const enhancedData = this.transformUPCItemToEnhancedData(upcItem, existingDescription)
      
      return enhancedData
    } catch (error) {
      console.error('Error enhancing product:', error)
      throw error
    }
  }

  /**
   * Transform UPC API item to our enhanced data format
   */
  private transformUPCItemToEnhancedData(upcItem: UPCItem, existingDescription?: string): EnhancedProductData {
    // Use existing description if provided, otherwise use title from UPC API
    const description = existingDescription?.trim() || upcItem.title || 'Unknown Product'
    
    const item: ItemInsert = {
      description,
      title: upcItem.title || null,
      brand: upcItem.brand || null,
      model: upcItem.model || null,
      ean: upcItem.ean || null,
      upc: upcItem.upc || null,
      gtin: upcItem.gtin || null,
      asin: upcItem.asin || null,
      full_description: upcItem.description || null,
      dimension: upcItem.dimension || null,
      weight: upcItem.weight || null,
      category: upcItem.category || null,
      images: upcItem.images || null,
      lowest_recorded_price: upcItem.lowest_recorded_price || null,
      highest_recorded_price: upcItem.highest_recorded_price || null
    }

    // Extract tags from category and brand
    const tags: string[] = []
    
    // Add brand as tag
    if (upcItem.brand) {
      tags.push(upcItem.brand)
    }
    
    // Add category hierarchy as tags
    if (upcItem.category) {
      const categoryTags = UPCApiClient.parseCategoryTags(upcItem.category)
      tags.push(...categoryTags)
    }
    
    // Add model as tag if different from brand
    if (upcItem.model && upcItem.model !== upcItem.brand) {
      tags.push(upcItem.model)
    }

    return {
      item,
      tags: Array.from(new Set(tags)), // Remove duplicates
      images: upcItem.images || []
    }
  }

  /**
   * Create or update an item with UPC enhancement data
   */
  async createEnhancedItem(enhancedData: EnhancedProductData): Promise<Item> {
    try {
      // Insert the item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert(enhancedData.item)
        .select()
        .single()

      if (itemError) throw itemError

      // Process tags if any
      if (enhancedData.tags.length > 0) {
        await this.addTagsToItem(item.id, enhancedData.tags)
      }

      return item
    } catch (error) {
      console.error('Error creating enhanced item:', error)
      throw error
    }
  }

  /**
   * Update existing item with UPC enhancement data
   */
  async updateItemWithEnhancement(itemId: number, enhancedData: EnhancedProductData): Promise<Item> {
    try {
      // Update the item (exclude description to preserve existing)
      const updateData: ItemUpdate = {
        title: enhancedData.item.title,
        brand: enhancedData.item.brand,
        model: enhancedData.item.model,
        ean: enhancedData.item.ean,
        upc: enhancedData.item.upc,
        gtin: enhancedData.item.gtin,
        asin: enhancedData.item.asin,
        full_description: enhancedData.item.full_description,
        dimension: enhancedData.item.dimension,
        weight: enhancedData.item.weight,
        category: enhancedData.item.category,
        images: enhancedData.item.images,
        lowest_recorded_price: enhancedData.item.lowest_recorded_price,
        highest_recorded_price: enhancedData.item.highest_recorded_price,
        updated_at: new Date().toISOString()
      }

      const { data: item, error: itemError } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single()

      if (itemError) throw itemError

      // Process tags if any
      if (enhancedData.tags.length > 0) {
        await this.addTagsToItem(item.id, enhancedData.tags)
      }

      return item
    } catch (error) {
      console.error('Error updating item with enhancement:', error)
      throw error
    }
  }

  /**
   * Add tags to an item, creating tags if they don't exist
   */
  private async addTagsToItem(itemId: number, tagNames: string[]): Promise<void> {
    try {
      for (const tagName of tagNames) {
        // Get or create tag
        const tag = await this.getOrCreateTag(tagName)
        
        // Link tag to item (ignore if already exists)
        await supabase
          .from('item_tags')
          .upsert({
            item_id: itemId,
            tag_id: tag.id
          }, {
            onConflict: 'item_id,tag_id',
            ignoreDuplicates: true
          })
      }
    } catch (error) {
      console.error('Error adding tags to item:', error)
      // Don't throw - tags are optional
    }
  }

  /**
   * Get existing tag or create new one
   */
  private async getOrCreateTag(tagName: string): Promise<Tag> {
    const trimmedName = tagName.trim()
    
    // Try to find existing tag
    const { data: existingTag } = await supabase
      .from('tags')
      .select('*')
      .eq('name', trimmedName)
      .single()

    if (existingTag) {
      return existingTag
    }

    // Create new tag
    const tagType = this.determineTagType(trimmedName)
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        name: trimmedName,
        tag_type: tagType
      })
      .select()
      .single()

    if (error) throw error
    return newTag
  }

  /**
   * Determine tag type based on tag name context
   */
  private determineTagType(tagName: string): string {
    const lowerName = tagName.toLowerCase()
    
    // Common brand indicators
    const brandKeywords = ['apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'nike', 'adidas']
    if (brandKeywords.some(brand => lowerName.includes(brand))) {
      return 'brand'
    }
    
    // Electronics categories
    if (lowerName.includes('electronics') || lowerName.includes('computer') || lowerName.includes('phone')) {
      return 'category'
    }
    
    // Default to category for hierarchical tags
    return 'category'
  }

  /**
   * Check if item has UPC/EAN data
   */
  static hasUPCData(item: Item): boolean {
    return !!(item.ean || item.upc || item.gtin)
  }

  /**
   * Get primary barcode from item (prefer EAN, then UPC, then GTIN)
   */
  static getPrimaryBarcode(item: Item): string | null {
    return item.ean || item.upc || item.gtin || null
  }
}

// Create singleton instance
export const productEnhancementService = new ProductEnhancementService()
