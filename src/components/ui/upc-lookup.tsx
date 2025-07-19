import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scan, Search, Loader2, Package, AlertTriangle } from "lucide-react"
import { UPCApiClient } from "@/lib/upc-api"
import { productEnhancementService, EnhancedProductData } from "@/lib/product-enhancement"
import { toast } from "sonner"

interface UPCLookupComponentProps {
  onProductFound: (enhancedData: EnhancedProductData) => void
  onProductNotFound: (upc: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function UPCLookupComponent({
  onProductFound,
  onProductNotFound,
  className = "",
  placeholder = "Enter UPC/EAN barcode...",
  disabled = false
}: UPCLookupComponentProps) {
  const [upc, setUpc] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastLookupResult, setLastLookupResult] = useState<EnhancedProductData | null>(null)

  const handleLookup = async (): Promise<void> => {
    if (!upc.trim()) {
      toast.error("Please enter a UPC/EAN code")
      return
    }

    // Validate UPC format
    if (!UPCApiClient.isValidUPC(upc)) {
      toast.error("Invalid UPC/EAN format. Please enter 8, 12, or 13 digits.")
      return
    }

    setIsLoading(true)
    try {
      const enhancedData = await productEnhancementService.enhanceProductByUPC(upc)
      
      if (enhancedData) {
        setLastLookupResult(enhancedData)
        onProductFound(enhancedData)
        toast.success(`Product found: ${enhancedData.item.title || enhancedData.item.description}`)
      } else {
        setLastLookupResult(null)
        onProductNotFound(upc)
        toast.warning("Product not found in UPC database")
      }
    } catch (error) {
      setLastLookupResult(null)
      console.error('UPC lookup error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to lookup product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      handleLookup()
    }
  }

  const handleUpcChange = (value: string): void => {
    // Only allow digits
    const cleanValue = value.replace(/\D/g, '')
    setUpc(cleanValue)
    
    // Clear previous result when UPC changes
    if (lastLookupResult && cleanValue !== UPCApiClient.formatUPC(lastLookupResult.item.upc || lastLookupResult.item.ean || '')) {
      setLastLookupResult(null)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="size-5" />
            UPC/EAN Lookup
          </CardTitle>
          <CardDescription>
            Enter a UPC or EAN barcode to automatically fetch product information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={upc}
              onChange={(e) => handleUpcChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              maxLength={13}
              className="flex-1 font-mono"
            />
            <Button
              onClick={handleLookup}
              disabled={disabled || isLoading || !upc.trim()}
              className="min-w-24"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="size-4 mr-1" />
                  Lookup
                </>
              )}
            </Button>
          </div>
          
          {/* UPC Format Helper */}
          <div className="mt-2 text-xs text-muted-foreground">
            Format: 8, 12, or 13 digits (UPC-A, EAN-13, EAN-8)
            {upc && (
              <span className={`ml-2 ${
                UPCApiClient.isValidUPC(upc) ? 'text-green-600' : 'text-red-600'
              }`}>
                {UPCApiClient.isValidUPC(upc) ? '✓ Valid format' : '✗ Invalid format'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Preview */}
      {lastLookupResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Package className="size-5" />
              Product Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-green-900">
                  {lastLookupResult.item.title || lastLookupResult.item.description}
                </h4>
                {lastLookupResult.item.brand && (
                  <p className="text-sm text-green-700">Brand: {lastLookupResult.item.brand}</p>
                )}
                {lastLookupResult.item.model && (
                  <p className="text-sm text-green-700">Model: {lastLookupResult.item.model}</p>
                )}
              </div>
              
              {lastLookupResult.item.full_description && (
                <p className="text-sm text-green-700 line-clamp-2">
                  {lastLookupResult.item.full_description}
                </p>
              )}
              
              {lastLookupResult.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lastLookupResult.tags.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {lastLookupResult.tags.length > 5 && (
                    <span className="text-xs text-green-600">
                      +{lastLookupResult.tags.length - 5} more
                    </span>
                  )}
                </div>
              )}
              
              {/* Product Image Preview */}
              {lastLookupResult.images.length > 0 && (
                <div className="flex gap-2">
                  <img
                    src={lastLookupResult.images[0]}
                    alt={lastLookupResult.item.title || 'Product'}
                    className="w-16 h-16 object-cover rounded border"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                    }}
                  />
                  {lastLookupResult.images.length > 1 && (
                    <div className="flex items-center text-xs text-green-600">
                      +{lastLookupResult.images.length - 1} more images
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
