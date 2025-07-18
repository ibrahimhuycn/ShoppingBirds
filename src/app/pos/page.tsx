"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ShoppingCart, Scan } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, generateInvoiceNumber } from "@/lib/utils"
import { getTranslations, useTranslation } from "@/lib/i18n"
import { defaultLocale } from "@/lib/i18n/config"
import { toast } from "sonner"
import type { Database } from "@/types/database"

// Use proper Supabase types
type Store = Database['public']['Tables']['stores']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Item = Database['public']['Tables']['items']['Row']
type PriceListRow = Database['public']['Tables']['price_lists']['Row']

interface CartItem {
  id: number
  description: string
  barcode: string
  price: number
  quantity: number
  unit: string
}

interface PriceListItem extends PriceListRow {
  items: { description: string }
  units: { unit: string }
}

export default function POSPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [barcode, setBarcode] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [translations, setTranslations] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async (): Promise<void> => {
    try {
      // Load translations
      const trans = await getTranslations(defaultLocale)
      setTranslations(trans)

      // Load stores
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("*")
        .order("name")

      if (storesError) throw storesError
      setStores(storesData || [])

      // Load units
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .order("unit")

      if (unitsError) throw unitsError
      setUnits(unitsData || [])

      // Auto-select first store if available
      if (storesData && storesData.length > 0) {
        setSelectedStore(storesData[0].id.toString())
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const searchItemByBarcode = async (barcode: string): Promise<void> => {
    if (!barcode.trim() || !selectedStore) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("price_lists")
        .select(`
          *,
          items:item_id (description),
          units:unit_id (unit)
        `)
        .eq("barcode", barcode)
        .eq("store_id", parseInt(selectedStore))
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // Item not found - show toast notification
          toast.error(translations ? t("pos.itemNotFound") : "Item not found", {
            description: `No item found with barcode "${barcode}" in the selected store.`,
            action: {
              label: "Add Item",
              onClick: () => {
                // In a real app, this would open an "Add Item" dialog
                toast.info("Add Item feature", {
                  description: "This would open a dialog to add a new item with this barcode."
                })
              }
            }
          })
        } else {
          toast.error("Search Error", {
            description: "An error occurred while searching for the item."
          })
        }
        return
      }

      const priceListItem = data as PriceListItem
      
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(
        (item) => item.id === priceListItem.item_id
      )

      if (existingItemIndex >= 0) {
        // Update quantity
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += 1
        setCart(updatedCart)
        
        toast.success("Item Updated", {
          description: `${priceListItem.items.description} quantity increased to ${updatedCart[existingItemIndex].quantity}`
        })
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: priceListItem.item_id,
          description: priceListItem.items.description,
          barcode: priceListItem.barcode,
          price: priceListItem.retail_price,
          quantity: 1,
          unit: priceListItem.units.unit,
        }
        setCart([...cart, newItem])
        
        toast.success("Item Added", {
          description: `${newItem.description} added to cart`
        })
      }

      setBarcode("")
    } catch (error) {
      console.error("Error searching item:", error)
      toast.error("Search Error", {
        description: "Failed to search for the item. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = (itemId: number, newQuantity: number): void => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    setCart(updatedCart)
  }

  const removeFromCart = (itemId: number): void => {
    const itemToRemove = cart.find(item => item.id === itemId)
    const updatedCart = cart.filter((item) => item.id !== itemId)
    setCart(updatedCart)
    
    if (itemToRemove) {
      toast.info("Item Removed", {
        description: `${itemToRemove.description} removed from cart`
      })
    }
  }

  const calculateSubtotal = (): number => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotal = (): number => {
    return calculateSubtotal() + adjustAmount
  }

  const processPayment = async (): Promise<void> => {
    if (!selectedStore || cart.length === 0) return

    setIsLoading(true)
    try {
      const invoiceNumber = generateInvoiceNumber()
      const total = calculateTotal()

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          store_id: parseInt(selectedStore),
          number: invoiceNumber,
          adjust_amount: adjustAmount,
          total: total,
          user_id: 1, // Default user for now
          date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice details
      const invoiceDetails = cart.map((item) => ({
        invoice_id: invoiceData.id,
        item_id: item.id,
        price: item.price,
        quantity: item.quantity,
      }))

      const { error: detailsError } = await supabase
        .from("invoice_details")
        .insert(invoiceDetails)

      if (detailsError) throw detailsError

      // Clear cart and reset
      setCart([])
      setAdjustAmount(0)
      setBarcode("")
      
      toast.success("Transaction Completed!", {
        description: `Invoice ${invoiceNumber} has been processed successfully.`,
        duration: 5000
      })
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("Payment Error", {
        description: "Failed to process the payment. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      searchItemByBarcode(barcode)
    }
  }

  const { t } = useTranslation(defaultLocale, translations)

  if (!translations) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("pos.title")}</h1>
        <Button
          onClick={() => {
            setCart([])
            setAdjustAmount(0)
            setBarcode("")
          }}
          variant="outline"
        >
          {t("pos.newTransaction")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Scanner and Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="size-5" />
                {t("pos.scanBarcode")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("pos.selectStore")}</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("pos.selectStore")} />
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
                <label className="text-sm font-medium">{t("pos.scanBarcode")}</label>
                <div className="flex gap-2">
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    placeholder="Scan or enter barcode"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => searchItemByBarcode(barcode)}
                    disabled={!barcode.trim() || !selectedStore || isLoading}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pos.adjustAmount")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
                Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Cart is empty. Scan items to add them.
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.barcode} • {formatCurrency(item.price)} per {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                        <div className="text-sm font-medium min-w-20 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pos.total")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>{t("pos.subtotal")}</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("pos.adjustAmount")}</span>
                <span>{formatCurrency(adjustAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>{t("pos.finalTotal")}</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <Button
                onClick={processPayment}
                disabled={cart.length === 0 || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? t("common.loading") : t("pos.processPayment")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
