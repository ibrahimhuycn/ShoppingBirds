import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { Database } from "@/types/database"

type Item = Database['public']['Tables']['items']['Row']
type ItemInsert = Database['public']['Tables']['items']['Insert']
type ItemUpdate = Database['public']['Tables']['items']['Update']

interface ItemFormData {
  description: string
  title: string
  brand: string
  model: string
  ean: string
  upc: string
  gtin: string
  asin: string
  full_description: string
  dimension: string
  weight: string
  category: string
  currency: string
  lowest_recorded_price: string
  highest_recorded_price: string
  images: string[]
}

interface EnhancedItemFormProps {
  item?: Item | null
  onSave: (data: ItemInsert | ItemUpdate) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function EnhancedItemForm({
  item,
  onSave,
  onCancel,
  isLoading = false,
  mode
}: EnhancedItemFormProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    description: '',
    title: '',
    brand: '',
    model: '',
    ean: '',
    upc: '',
    gtin: '',
    asin: '',
    full_description: '',
    dimension: '',
    weight: '',
    category: '',
    currency: 'USD',
    lowest_recorded_price: '',
    highest_recorded_price: '',
    images: []
  })
  
  const [newImage, setNewImage] = useState('')

  useEffect(() => {
    if (item) {
      setFormData({
        description: item.description || '',
        title: item.title || '',
        brand: item.brand || '',
        model: item.model || '',
        ean: item.ean || '',
        upc: item.upc || '',
        gtin: item.gtin || '',
        asin: item.asin || '',
        full_description: item.full_description || '',
        dimension: item.dimension || '',
        weight: item.weight || '',
        category: item.category || '',
        currency: item.currency || 'USD',
        lowest_recorded_price: item.lowest_recorded_price?.toString() || '',
        highest_recorded_price: item.highest_recorded_price?.toString() || '',
        images: item.images || []
      })
    }
  }, [item])

  const handleInputChange = (field: keyof ItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }))
      setNewImage('')
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('Description is required')
      return
    }

    const submitData: ItemInsert | ItemUpdate = {
      description: formData.description.trim(),
      title: formData.title.trim() || null,
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      ean: formData.ean.trim() || null,
      upc: formData.upc.trim() || null,
      gtin: formData.gtin.trim() || null,
      asin: formData.asin.trim() || null,
      full_description: formData.full_description.trim() || null,
      dimension: formData.dimension.trim() || null,
      weight: formData.weight.trim() || null,
      category: formData.category.trim() || null,
      currency: formData.currency || 'USD',
      lowest_recorded_price: formData.lowest_recorded_price ? parseFloat(formData.lowest_recorded_price) : null,
      highest_recorded_price: formData.highest_recorded_price ? parseFloat(formData.highest_recorded_price) : null,
      images: formData.images.length > 0 ? formData.images : null
    }

    if (mode === 'edit') {
      submitData.updated_at = new Date().toISOString()
    }

    await onSave(submitData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Add New Item' : 'Edit Item'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new item with detailed product information'
            : 'Update item details and product information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter item description"
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Product title"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Brand name"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Model number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="full_description">Full Description</Label>
            <Textarea
              id="full_description"
              value={formData.full_description}
              onChange={(e) => handleInputChange('full_description', e.target.value)}
              placeholder="Detailed product description"
              rows={3}
            />
          </div>
        </div>

        {/* Barcode Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Barcode Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ean">EAN</Label>
              <Input
                id="ean"
                value={formData.ean}
                onChange={(e) => handleInputChange('ean', e.target.value)}
                placeholder="13-digit EAN code"
                maxLength={13}
              />
            </div>
            <div>
              <Label htmlFor="upc">UPC</Label>
              <Input
                id="upc"
                value={formData.upc}
                onChange={(e) => handleInputChange('upc', e.target.value)}
                placeholder="12-digit UPC code"
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="gtin">GTIN</Label>
              <Input
                id="gtin"
                value={formData.gtin}
                onChange={(e) => handleInputChange('gtin', e.target.value)}
                placeholder="14-digit GTIN code"
                maxLength={14}
              />
            </div>
            <div>
              <Label htmlFor="asin">ASIN</Label>
              <Input
                id="asin"
                value={formData.asin}
                onChange={(e) => handleInputChange('asin', e.target.value)}
                placeholder="Amazon ASIN"
                maxLength={32}
              />
            </div>
          </div>
        </div>

        {/* Physical Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Physical Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dimension">Dimensions</Label>
              <Input
                id="dimension"
                value={formData.dimension}
                onChange={(e) => handleInputChange('dimension', e.target.value)}
                placeholder="e.g., 10x5x2 cm"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="e.g., 250g"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Product category"
              />
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Price Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="USD"
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="lowest_recorded_price">Lowest Recorded Price</Label>
              <Input
                id="lowest_recorded_price"
                type="number"
                step="0.01"
                value={formData.lowest_recorded_price}
                onChange={(e) => handleInputChange('lowest_recorded_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="highest_recorded_price">Highest Recorded Price</Label>
              <Input
                id="highest_recorded_price"
                type="number"
                step="0.01"
                value={formData.highest_recorded_price}
                onChange={(e) => handleInputChange('highest_recorded_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Product Images
          </h4>
          <div className="flex gap-2">
            <Input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addImage}
              disabled={!newImage.trim()}
              size="sm"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {formData.images.length > 0 && (
            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.src = '/placeholder-image.png'
                    }}
                  />
                  <span className="flex-1 text-sm truncate">{image}</span>
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!formData.description.trim() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Item'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
