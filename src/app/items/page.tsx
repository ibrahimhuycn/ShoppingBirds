"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Package, DollarSign, Search, ChevronLeft, ChevronRight, Scan, Tag } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { getTranslations, useTranslation } from "@/lib/i18n"
import { defaultLocale } from "@/lib/i18n/config"
import { UPCLookupComponent } from "@/components/ui/upc-lookup"
import { EnhancedItemForm } from "@/components/ui/enhanced-item-form"
import { TagsManager } from "@/components/ui/tags-manager"
import { PriceManager } from "@/components/ui/price-manager"
import { productEnhancementService, EnhancedProductData } from "@/lib/product-enhancement"
import { toast } from "sonner"
import type { Database } from "@/types/database"

// Use proper Supabase types
type Item = Database['public']['Tables']['items']['Row']
type Store = Database['public']['Tables']['stores']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type PriceListRow = Database['public']['Tables']['price_lists']['Row']

interface PriceList extends PriceListRow {
  stores: { name: string }
  units: { unit: string; description: string }
}

interface ItemWithPrices extends Item {
  price_lists: PriceList[]
  item_tags?: {
    tags: {
      id: number
      name: string
      tag_type: string
      color: string | null
    }
  }[]
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemWithPrices[]>([])
  const [filteredItems, setFilteredItems] = useState<ItemWithPrices[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [isAddingWithUPC, setIsAddingWithUPC] = useState<boolean>(false)
  const [isAddingEnhanced, setIsAddingEnhanced] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showTagsManager, setShowTagsManager] = useState<boolean>(false)
  const [managingPricesFor, setManagingPricesFor] = useState<number | null>(null)
  const [newItemDescription, setNewItemDescription] = useState<string>("")
  const [addingPriceFor, setAddingPriceFor] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  })
  const [priceForm, setPriceForm] = useState({
    barcode: "",
    store_id: "",
    retail_price: "",
    unit_id: "",
  })
  const [translations, setTranslations] = useState<Record<string, any> | null>(null)

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      // Load translations
      const trans = await getTranslations(defaultLocale)
      setTranslations(trans)

      // Load all data
      await Promise.all([loadItems(), loadStores(), loadUnits()])
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }, [])

  const filterAndPaginateItems = useCallback((): void => {
    let filtered = items

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = items.filter(item => 
        item.description.toLowerCase().includes(query) ||
        item.price_lists.some(price => 
          price.barcode.toLowerCase().includes(query) ||
          price.stores.name.toLowerCase().includes(query)
        )
      )
    }

    // Calculate pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    
    // Update pagination info
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages: totalPages || 1
    }))

    // Set paginated items
    setFilteredItems(filtered.slice(startIndex, endIndex))
  }, [items, searchQuery, pagination.currentPage, pagination.itemsPerPage])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    filterAndPaginateItems()
  }, [items, searchQuery, pagination.currentPage, pagination.itemsPerPage, filterAndPaginateItems])

  const loadItems = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          price_lists (
            *,
            stores (name),
            units (unit, description)
          ),
          item_tags (
            tags (
              id,
              name,
              tag_type,
              color
            )
          )
        `)
        .order("description")

      if (error) throw error
      setItems((data || []) as ItemWithPrices[])
    } catch (error) {
      console.error("Error loading items:", error)
      toast.error('Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStores = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name")

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error("Error loading stores:", error)
    }
  }

  const loadUnits = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("unit")

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error("Error loading units:", error)
    }
  }

  const addItem = async (): Promise<void> => {
    if (!newItemDescription.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({ description: newItemDescription.trim() })
        .select()
        .single()

      if (error) throw error

      const newItem: ItemWithPrices = {
        ...data,
        price_lists: [],
      }

      setItems([...items, newItem])
      setNewItemDescription("")
      setIsAdding(false)
      toast.success('Item added successfully')
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error('Failed to add item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhancedSave = async (data: any): Promise<void> => {
    setIsLoading(true)
    try {
      const { data: newItem, error } = await supabase
        .from('items')
        .insert(data)
        .select()
        .single()

      if (error) throw error

      const itemWithPrices: ItemWithPrices = {
        ...newItem,
        price_lists: []
      }

      setItems([...items, itemWithPrices])
      setIsAddingEnhanced(false)
      toast.success('Enhanced item created successfully')
    } catch (error) {
      console.error('Error creating enhanced item:', error)
      toast.error('Failed to create enhanced item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhancedUpdate = async (data: any): Promise<void> => {
    if (!editingItem) return
    
    setIsLoading(true)
    try {
      const { data: updatedItem, error } = await supabase
        .from('items')
        .update(data)
        .eq('id', editingItem.id)
        .select()
        .single()

      if (error) throw error

      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...updatedItem }
          : item
      ))
      setEditingItem(null)
      toast.success('Item updated successfully')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (item: Item): Promise<void> => {
    if (!item.description.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("items")
        .update({ description: item.description.trim() })
        .eq("id", item.id)
        .select()
        .single()

      if (error) throw error

      setItems(items.map((i) => (i.id === item.id ? { ...i, ...data } : i)))
      setEditingItem(null)
    } catch (error) {
      console.error("Error updating item:", error)
      alert("Error updating item")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (itemId: number): Promise<void> => {
    if (!confirm("Are you sure you want to delete this item?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId)

      if (error) throw error

      setItems(items.filter((i) => i.id !== itemId))
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Error deleting item")
    } finally {
      setIsLoading(false)
    }
  }

  const addPrice = async (itemId: number): Promise<void> => {
    if (!priceForm.barcode || !priceForm.store_id || !priceForm.retail_price || !priceForm.unit_id) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("price_lists")
        .insert({
          item_id: itemId,
          barcode: priceForm.barcode,
          store_id: parseInt(priceForm.store_id),
          retail_price: parseFloat(priceForm.retail_price),
          unit_id: parseInt(priceForm.unit_id),
        })
        .select(`
          *,
          stores (name),
          units (unit, description)
        `)
        .single()

      if (error) throw error

      // Update the item with the new price
      setItems(items.map((item) => 
        item.id === itemId 
          ? { ...item, price_lists: [...item.price_lists, data] }
          : item
      ))

      // Reset form
      setPriceForm({
        barcode: "",
        store_id: "",
        retail_price: "",
        unit_id: "",
      })
      setAddingPriceFor(null)
    } catch (error) {
      console.error("Error adding price:", error)
      alert("Error adding price")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void): void => {
    if (e.key === "Enter") {
      action()
    }
  }

  const handleSearchChange = (value: string): void => {
    setSearchQuery(value)
    setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page when searching
  }

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }))
    }
  }

  const changeItemsPerPage = (itemsPerPage: number): void => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1 // Reset to first page
    }))
  }

  // UPC Integration Handlers
  const handleUPCProductFound = async (enhancedData: EnhancedProductData): Promise<void> => {
    try {
      setIsLoading(true)
      const newItem = await productEnhancementService.createEnhancedItem(enhancedData)
      
      const itemWithPrices: ItemWithPrices = {
        ...newItem,
        price_lists: []
      }
      
      setItems([...items, itemWithPrices])
      setIsAddingWithUPC(false)
      toast.success(`Item created: ${newItem.title || newItem.description}`)
    } catch (error) {
      console.error('Error creating enhanced item:', error)
      toast.error('Failed to create item with UPC data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUPCProductNotFound = (upc: string): void => {
    toast.warning(`Product not found for UPC: ${upc}. You can still add it manually.`)
    setNewItemDescription('')
    setIsAddingWithUPC(false)
    setIsAdding(true) // Switch to manual add
  }

  const { t } = useTranslation(defaultLocale, translations)

  if (!translations) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("items.title")}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowTagsManager(!showTagsManager)}
            variant="outline"
            size="sm"
          >
            <Tag className="size-4 mr-2" />
            {showTagsManager ? 'Hide Tags' : 'Manage Tags'}
          </Button>
          <Button
            onClick={() => setIsAddingWithUPC(true)}
            disabled={isAdding || isAddingWithUPC || isAddingEnhanced}
            variant="outline"
          >
            <Scan className="size-4 mr-2" />
            Scan UPC
          </Button>
          <Button
            onClick={() => setIsAddingEnhanced(true)}
            disabled={isAdding || isAddingWithUPC || isAddingEnhanced}
            variant="outline"
          >
            <Package className="size-4 mr-2" />
            Add Enhanced
          </Button>
          <Button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isAddingWithUPC || isAddingEnhanced}
          >
            <Plus className="size-4 mr-2" />
            {t("items.addItem")}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Search Items</label>
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by item name, barcode, or store..."
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Items per page</label>
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => changeItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {pagination.totalItems} items
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </div>
        </CardContent>
      </Card>

      {/* Price Manager */}
      {managingPricesFor && (
        <PriceManager
          itemId={managingPricesFor}
          itemDescription={items.find(i => i.id === managingPricesFor)?.description || 'Item'}
          onPricesUpdated={() => {
            loadItems()
            setManagingPricesFor(null)
          }}
        />
      )}

      {/* Tags Manager */}
      {showTagsManager && (
        <TagsManager />
      )}

      {/* Enhanced Item Form */}
      {isAddingEnhanced && (
        <EnhancedItemForm
          mode="create"
          onSave={handleEnhancedSave}
          onCancel={() => setIsAddingEnhanced(false)}
          isLoading={isLoading}
        />
      )}

      {/* Edit Item Form */}
      {editingItem && (
        <EnhancedItemForm
          mode="edit"
          item={editingItem}
          onSave={handleEnhancedUpdate}
          onCancel={() => setEditingItem(null)}
          isLoading={isLoading}
        />
      )}

      {/* Simple Add Item Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{t("items.addItem")}</CardTitle>
            <CardDescription>
              Manually add an item by entering its description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addItem)}
                placeholder={t("items.itemDescription")}
                className="flex-1"
              />
              <Button
                onClick={addItem}
                disabled={!newItemDescription.trim() || isLoading}
              >
                {t("pos.save")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewItemDescription("")
                }}
              >
                {t("pos.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UPC Lookup Section */}
      {isAddingWithUPC && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="size-5" />
              Add Item with UPC/EAN Barcode
            </CardTitle>
            <CardDescription>
              Scan or enter a UPC/EAN barcode to automatically fetch product information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UPCLookupComponent
              onProductFound={handleUPCProductFound}
              onProductNotFound={handleUPCProductNotFound}
              disabled={isLoading}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddingWithUPC(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-purple-500">
                    <Package className="size-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {editingItem?.id === item.id ? (
                      <Input
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        onKeyPress={(e) => handleKeyPress(e, () => updateItem(editingItem))}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {item.title || item.description}
                          {(item.ean || item.upc || item.gtin) && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                              <Scan className="size-3 mr-1" />
                              UPC
                            </span>
                          )}
                        </CardTitle>
                        <div className="space-y-1">
                          <CardDescription>
                            ID: {item.id}
                            {item.brand && ` • Brand: ${item.brand}`}
                            {item.model && ` • Model: ${item.model}`}
                          </CardDescription>
                          {(item.ean || item.upc || item.gtin) && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {item.ean && `EAN: ${item.ean}`}
                              {item.upc && (item.ean ? ` • UPC: ${item.upc}` : `UPC: ${item.upc}`)}
                              {item.gtin && (item.ean || item.upc ? ` • GTIN: ${item.gtin}` : `GTIN: ${item.gtin}`)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Image */}
                  {item.images && item.images.length > 0 && (
                    <div className="ml-3">
                      <img
                        src={item.images[0]}
                        alt={item.title || item.description}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingItem?.id === item.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateItem(editingItem)}
                        disabled={!editingItem.description.trim() || isLoading}
                      >
                        {t("pos.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(null)}
                      >
                        {t("pos.cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManagingPricesFor(item.id)}
                      >
                        <DollarSign className="size-4 mr-1" />
                        Manage Prices
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddingPriceFor(item.id)}
                      >
                        <DollarSign className="size-4 mr-1" />
                        Add Price
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="size-4" />
                        Edit All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Enhanced Product Information */}
              {(item.full_description || item.category || item.dimension || item.weight || (item.item_tags && item.item_tags.length > 0)) && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  {item.full_description && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.full_description}
                      </p>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {item.item_tags && item.item_tags.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">TAGS</h5>
                      <div className="flex flex-wrap gap-1">
                        {item.item_tags.map((itemTag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                            style={itemTag.tags.color ? {
                              backgroundColor: itemTag.tags.color + '20',
                              borderColor: itemTag.tags.color
                            } : {}}
                          >
                            {itemTag.tags.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {item.category && (
                      <span>Category: {item.category}</span>
                    )}
                    {item.dimension && (
                      <span>Dimensions: {item.dimension}</span>
                    )}
                    {item.weight && (
                      <span>Weight: {item.weight}</span>
                    )}
                    {item.currency && (item.lowest_recorded_price || item.highest_recorded_price) && (
                      <span>
                        Price Range: 
                        {item.lowest_recorded_price && formatCurrency(item.lowest_recorded_price, item.currency)}
                        {item.lowest_recorded_price && item.highest_recorded_price && ' - '}
                        {item.highest_recorded_price && formatCurrency(item.highest_recorded_price, item.currency)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {addingPriceFor === item.id && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-3">Add Price Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t("items.barcode")}</label>
                      <Input
                        value={priceForm.barcode}
                        onChange={(e) => setPriceForm({ ...priceForm, barcode: e.target.value })}
                        placeholder="Enter barcode"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("items.retailPrice")}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={priceForm.retail_price}
                        onChange={(e) => setPriceForm({ ...priceForm, retail_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("items.store")}</label>
                      <Select
                        value={priceForm.store_id}
                        onValueChange={(value) => setPriceForm({ ...priceForm, store_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("items.unit")}</label>
                      <Select
                        value={priceForm.unit_id}
                        onValueChange={(value) => setPriceForm({ ...priceForm, unit_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.unit} - {unit.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => addPrice(item.id)}
                      disabled={isLoading}
                    >
                      {t("pos.save")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddingPriceFor(null)
                        setPriceForm({
                          barcode: "",
                          store_id: "",
                          retail_price: "",
                          unit_id: "",
                        })
                      }}
                    >
                      {t("pos.cancel")}
                    </Button>
                  </div>
                </div>
              )}

              {item.price_lists.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-3">{t("items.priceList")}</h4>
                  <div className="grid gap-2">
                    {item.price_lists.map((price) => (
                      <div key={price.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm">{price.barcode}</span>
                          <span className="text-sm">{price.stores.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {price.units.unit} - {price.units.description}
                          </span>
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(price.retail_price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No prices set for this item. Click "Add Price" to add pricing information.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (pagination.currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i
                    } else {
                      pageNumber = pagination.currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="size-12 text-muted-foreground mx-auto mb-4" />
            {searchQuery ? (
              <div>
                <p className="text-muted-foreground mb-2">
                  No items found matching "{searchQuery}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleSearchChange("")}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No items found. Click the "Add Item" button to create your first item.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
