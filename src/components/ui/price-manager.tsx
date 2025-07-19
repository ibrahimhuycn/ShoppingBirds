import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, DollarSign, History, Save, X, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type Store = Database['public']['Tables']['stores']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type PriceListRow = Database['public']['Tables']['price_lists']['Row']
type PriceChangeHistory = Database['public']['Views']['price_trend_analysis']['Row']

interface PriceListWithDetails extends PriceListRow {
  stores: { name: string }
  units: { unit: string; description: string }
}

interface PriceManagerProps {
  itemId: number
  itemDescription: string
  onPricesUpdated: () => void
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' }
]

export function PriceManager({ itemId, itemDescription, onPricesUpdated }: PriceManagerProps) {
  const [prices, setPrices] = useState<PriceListWithDetails[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceChangeHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [isAddingPrice, setIsAddingPrice] = useState(false)

  const [newPrice, setNewPrice] = useState({
    barcode: '',
    store_id: '',
    retail_price: '',
    currency: 'USD',
    unit_id: '',
    change_reason: ''
  })

  const [editingPrice, setEditingPrice] = useState({
    retail_price: '',
    currency: 'USD',
    change_reason: ''
  })

  const loadPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .select(`
          *,
          stores (name),
          units (unit, description)
        `)
        .eq('item_id', itemId)
        .eq('is_active', true)
        .order('store_id')

      if (error) throw error
      setPrices(data as PriceListWithDetails[] || [])
    } catch (error) {
      console.error('Error loading prices:', error)
      toast.error('Failed to load prices')
    }
  }, [itemId])

  const loadStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }, [])

  const loadUnits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('unit')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error loading units:', error)
    }
  }, [])

  const loadPriceHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('price_trend_analysis')
        .select('*')
        .eq('item_id', itemId)
        .order('change_timestamp', { ascending: false })
        .limit(20)

      if (error) throw error
      setPriceHistory(data as PriceChangeHistory[] || [])
    } catch (error) {
      console.error('Error loading price history:', error)
    }
  }, [itemId])

  const loadData = useCallback(async () => {
    await Promise.all([
      loadPrices(),
      loadStores(),
      loadUnits(),
      loadPriceHistory()
    ])
  }, [loadPrices, loadStores, loadUnits, loadPriceHistory])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addPrice = async () => {
    if (!newPrice.barcode || !newPrice.store_id || !newPrice.retail_price || !newPrice.unit_id) {
      toast.error('Please fill in all required fields')
      return
    }

    const existingPrice = prices.find(p => p.store_id === parseInt(newPrice.store_id))
    if (existingPrice) {
      toast.error('Price already exists for this store. Use edit to update.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .insert({
          item_id: itemId,
          barcode: newPrice.barcode,
          store_id: parseInt(newPrice.store_id),
          retail_price: parseFloat(newPrice.retail_price),
          currency: newPrice.currency,
          unit_id: parseInt(newPrice.unit_id),
          is_active: true
        })
        .select(`
          *,
          stores (name),
          units (unit, description)
        `)
        .single()

      if (error) throw error

      if (newPrice.change_reason.trim()) {
        await supabase
          .from('price_change_history')
          .update({ change_reason: newPrice.change_reason.trim() })
          .eq('item_id', itemId)
          .eq('store_id', parseInt(newPrice.store_id))
          .eq('change_type', 'CREATE')
          .order('created_at', { ascending: false })
          .limit(1)
      }

      setPrices([...prices, data as PriceListWithDetails])
      setNewPrice({
        barcode: '',
        store_id: '',
        retail_price: '',
        currency: 'USD',
        unit_id: '',
        change_reason: ''
      })
      setIsAddingPrice(false)
      onPricesUpdated()
      await loadPriceHistory()
      
      toast.success('Price added successfully')
    } catch (error) {
      console.error('Error adding price:', error)
      toast.error('Failed to add price')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePrice = async (priceId: number) => {
    if (!editingPrice.retail_price) {
      toast.error('Please enter a valid price')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .update({
          retail_price: parseFloat(editingPrice.retail_price),
          currency: editingPrice.currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', priceId)
        .select(`
          *,
          stores (name),
          units (unit, description)
        `)
        .single()

      if (error) throw error

      if (editingPrice.change_reason.trim()) {
        await supabase
          .from('price_change_history')
          .update({ change_reason: editingPrice.change_reason.trim() })
          .eq('price_list_id', priceId)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      setPrices(prices.map(p => p.id === priceId ? data as PriceListWithDetails : p))
      setEditingPriceId(null)
      setEditingPrice({ retail_price: '', currency: 'USD', change_reason: '' })
      onPricesUpdated()
      await loadPriceHistory()
      
      toast.success('Price updated successfully')
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Failed to update price')
    } finally {
      setIsLoading(false)
    }
  }

  const deletePrice = async (priceId: number, storeName: string) => {
    if (!confirm(`Are you sure you want to delete the price for ${storeName}? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', priceId)

      if (error) throw error

      setPrices(prices.filter(p => p.id !== priceId))
      onPricesUpdated()
      await loadPriceHistory()
      
      toast.success(`Price for ${storeName} deleted successfully`)
    } catch (error) {
      console.error('Error deleting price:', error)
      toast.error('Failed to delete price')
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (price: PriceListWithDetails) => {
    setEditingPriceId(price.id)
    setEditingPrice({
      retail_price: price.retail_price.toString(),
      currency: price.currency || 'USD',
      change_reason: ''
    })
  }

  const cancelEditing = () => {
    setEditingPriceId(null)
    setEditingPrice({ retail_price: '', currency: 'USD', change_reason: '' })
  }

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
    return currency?.symbol || currencyCode
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'CURRENCY_CHANGE': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5" />
                Price Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage prices for "{itemDescription}" across different stores and currencies
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                size="sm"
              >
                <History className="size-4 mr-2" />
                {showHistory ? 'Hide History' : 'Price History'}
              </Button>
              <Button
                onClick={() => setIsAddingPrice(true)}
                disabled={isAddingPrice || isLoading}
                size="sm"
              >
                <Plus className="size-4 mr-2" />
                Add Price
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingPrice && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-3">Add New Price</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-barcode">Barcode *</Label>
                  <Input
                    id="new-barcode"
                    value={newPrice.barcode}
                    onChange={(e) => setNewPrice({ ...newPrice, barcode: e.target.value })}
                    placeholder="Enter barcode"
                  />
                </div>
                <div>
                  <Label htmlFor="new-store">Store *</Label>
                  <Select
                    value={newPrice.store_id}
                    onValueChange={(value) => setNewPrice({ ...newPrice, store_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.filter(store => !prices.some(p => p.store_id === store.id)).map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-unit">Unit *</Label>
                  <Select
                    value={newPrice.unit_id}
                    onValueChange={(value) => setNewPrice({ ...newPrice, unit_id: value })}
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
                <div>
                  <Label htmlFor="new-currency">Currency *</Label>
                  <Select
                    value={newPrice.currency}
                    onValueChange={(value) => setNewPrice({ ...newPrice, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-price">Price *</Label>
                  <Input
                    id="new-price"
                    type="number"
                    step="0.01"
                    value={newPrice.retail_price}
                    onChange={(e) => setNewPrice({ ...newPrice, retail_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="new-reason">Change Reason</Label>
                  <Input
                    id="new-reason"
                    value={newPrice.change_reason}
                    onChange={(e) => setNewPrice({ ...newPrice, change_reason: e.target.value })}
                    placeholder="Optional reason"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={addPrice}
                  disabled={isLoading}
                >
                  <Save className="size-4 mr-2" />
                  Add Price
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingPrice(false)
                    setNewPrice({
                      barcode: '',
                      store_id: '',
                      retail_price: '',
                      currency: 'USD',
                      unit_id: '',
                      change_reason: ''
                    })
                  }}
                >
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isLoading && prices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Loading prices...</p>
            ) : prices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No prices set for this item. Add your first price to get started.
              </p>
            ) : (
              <div className="grid gap-4">
                {prices.map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        <p className="font-medium">{price.stores.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Barcode: {price.barcode} • Unit: {price.units.unit}
                        </p>
                      </div>
                      
                      {editingPriceId === price.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={editingPrice.currency}
                            onValueChange={(value) => setEditingPrice({ ...editingPrice, currency: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_CURRENCIES.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.symbol} {currency.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice.retail_price}
                            onChange={(e) => setEditingPrice({ ...editingPrice, retail_price: e.target.value })}
                            className="w-32"
                            placeholder="Price"
                          />
                          <Input
                            value={editingPrice.change_reason}
                            onChange={(e) => setEditingPrice({ ...editingPrice, change_reason: e.target.value })}
                            className="w-48"
                            placeholder="Reason for change"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {getCurrencySymbol(price.currency || 'USD')} {price.currency || 'USD'}
                          </Badge>
                          <div className="text-lg font-semibold">
                            {formatCurrency(price.retail_price, price.currency || 'USD')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingPriceId === price.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updatePrice(price.id)}
                            disabled={isLoading}
                          >
                            <Save className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(price)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePrice(price.id, price.stores.name)}
                            disabled={isLoading}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Price Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priceHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No price history available.
              </p>
            ) : (
              <div className="space-y-3">
                {priceHistory.map((change, index) => (
                  <div key={`${change.item_id}-${change.store_id}-${change.change_timestamp}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getChangeTypeColor(change.change_type || '')}>
                        {change.change_type}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{change.store_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {change.effective_date && new Date(change.effective_date).toLocaleDateString()}
                          {change.change_reason && ` • ${change.change_reason}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        {change.old_price && (
                          <>
                            <span className="text-muted-foreground">
                              {getCurrencySymbol(change.old_currency || 'USD')} {change.old_price}
                            </span>
                            <span>→</span>
                          </>
                        )}
                        {change.new_price && (
                          <span className="font-medium">
                            {getCurrencySymbol(change.new_currency || 'USD')} {change.new_price}
                          </span>
                        )}
                      </div>
                      {change.price_change_percentage !== null && (
                        <div className={`text-xs ${change.price_change_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change.price_change_percentage > 0 ? '+' : ''}
                          {change.price_change_percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}