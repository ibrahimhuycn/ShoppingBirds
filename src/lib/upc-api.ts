// UPC Item Database API types and client
// Using Supabase Edge Function to bypass CORS restrictions

import { supabase } from './supabase'

export interface UPCApiResponse {
  code: string
  total: number
  offset: number
  items: UPCItem[]
}

export interface UPCItem {
  ean: string
  title: string
  upc?: string
  gtin?: string
  asin?: string
  description: string
  brand: string
  model: string
  color?: string
  size?: string
  dimension?: string
  weight?: string
  category: string
  currency?: string
  lowest_recorded_price?: number
  highest_recorded_price?: number
  images: string[]
  offers: UPCOffer[]
}

export interface UPCOffer {
  merchant: string
  domain: string
  title: string
  currency?: string
  list_price: number | string
  price: number
  shipping: string
  condition: string
  availability: string
  link: string
  updated_t: number
}

export interface UPCErrorResponse {
  code: string
  message: string
}

export interface UPCLookupRequest {
  upc: string
}

interface EdgeFunctionResponse {
  success: boolean
  data?: UPCApiResponse
  error?: string
  upc: string
}

// UPC API Client Class
export class UPCApiClient {
  /**
   * Look up product information by UPC/EAN code
   * Using Supabase Edge Function to bypass CORS
   */
  async lookupProduct(upc: string): Promise<UPCApiResponse> {
    try {
      console.log('Calling UPC lookup edge function with:', upc.trim())
      
      const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>('upc-lookup', {
        body: { upc: upc.trim() }
      })

      console.log('Edge function response:', { data, error })

      if (error) {
        console.error('Supabase function error:', error)
        throw new Error(`Function error: ${error.message || 'Unknown function error'}`)
      }

      if (!data) {
        throw new Error('No data returned from UPC lookup function')
      }

      if (!data.success) {
        throw new Error(data.error || 'UPC lookup failed')
      }

      if (!data.data) {
        throw new Error('No UPC data in response')
      }

      console.log('UPC lookup successful:', data.data)
      return data.data
    } catch (error) {
      console.error('UPC API client error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to lookup product information')
    }
  }

  /**
   * Check if a UPC/EAN code is valid format
   */
  static isValidUPC(code: string): boolean {
    const cleaned = code.replace(/\D/g, '') // Remove non-digits
    
    // UPC-A: 12 digits
    // EAN-13: 13 digits
    // EAN-8: 8 digits
    return [8, 12, 13].includes(cleaned.length)
  }

  /**
   * Clean and format UPC/EAN code
   */
  static formatUPC(code: string): string {
    return code.replace(/\D/g, '') // Remove non-digits
  }

  /**
   * Extract the most useful image URL from the images array
   */
  static getBestImage(images: string[]): string | null {
    if (!images || images.length === 0) return null
    
    // Prefer images with better quality indicators
    const priorityImages = images.filter(img => 
      img.includes('250') || img.includes('large') || img.includes('high')
    )
    
    return priorityImages.length > 0 ? priorityImages[0] : images[0]
  }

  /**
   * Parse category string into hierarchical tags
   */
  static parseCategoryTags(category: string): string[] {
    if (!category) return []
    
    return category
      .split(' > ')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }
}

// Create singleton instance
export const upcApiClient = new UPCApiClient()
