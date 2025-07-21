"use client"

import { CurrencySelector, MoneyDisplay } from "@/components/currency";
import { getBaseCurrency, getCurrencyById } from "@/lib/currency";
import { SettingsService } from "@/lib/settings";
import { getPriceWithTaxes } from "@/lib/tax-service";
import { TaxBreakdown } from "@/components/tax";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ShoppingCart, Scan } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, generateInvoiceNumber } from "@/lib/utils"
import { searchItemByBarcodeWithVariants } from "@/lib/barcode-search"
import { useI18n } from "@/contexts/translation-context"
import { toast } from "sonner"
import type { Database, PriceWithTaxes } from "@/types/database";
import type { Currency } from "@/types/currency";
import type { TaxBreakdownItem } from "@/types/tax";

// Use proper Supabase types
type Store = Database['public']['Tables']['stores']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Item = Database['public']['Tables']['items']['Row']
type PriceListRow = Database['public']['Tables']['price_lists']['Row']

interface CartItem {
  id: number;
  priceListId: number;
  description: string;
  barcode: string;
  basePrice: number;
  taxAmount: number;
  finalPrice: number;
  quantity: number;
  unit: string;
  currencyId: number;
  currency?: Currency;
  taxBreakdown: TaxBreakdownItem[];
  hasCustomTaxes: boolean;
}

interface PriceListItem extends PriceListRow {
  items: { description: string }
  units: { unit: string }
}

export default function POSPage() {
  const { t } = useI18n()
  const [stores, setStores] = useState<Store[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | undefined>();
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [barcode, setBarcode] = useState<string>("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [adjustAmount, setAdjustAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    loadInitialData();
    loadBaseCurrency();
  }, []);

  const loadBaseCurrency = async (): Promise<void> => {
    try {
      // First try to get default currency from settings
      const defaultCurrencyId = SettingsService.getDefaultCurrencyId();
      
      if (defaultCurrencyId) {
        const defaultCurrency = await getCurrencyById(defaultCurrencyId);
        if (defaultCurrency) {
          setBaseCurrency(defaultCurrency);
          setSelectedCurrencyId(defaultCurrency.id);
          return;
        }
      }
      
      // Fallback to base currency if no default set or default not found
      const currency = await getBaseCurrency();
      setBaseCurrency(currency);
      setSelectedCurrencyId(currency.id);
    } catch (error) {
      console.error("Error loading currency:", error);
    }
  };

  const loadInitialData = async (): Promise<void> => {
    try {
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
    if (!barcode.trim() || !selectedStore || !selectedCurrencyId) return

    setIsLoading(true)
    try {
      // First, search for the basic price list item
      const { data: priceListData, error } = await supabase
        .from("price_lists")
        .select(`
          *,
          items!inner(description),
          units!inner(unit)
        `)
        .eq("barcode", barcode)
        .eq("store_id", parseInt(selectedStore))
        .eq("is_active", true)
        .single();

      if (error || !priceListData) {
        toast.error("Item not found", {
          description: `No item found with barcode "${barcode}".`,
        });
        return;
      }

      // Get price with taxes calculated
      const priceWithTaxes = await getPriceWithTaxes(priceListData.id);
      
      if (!priceWithTaxes) {
        toast.error("Price calculation error", {
          description: "Unable to calculate taxes for this item.",
        });
        return;
      }

      // Transform applied taxes to TaxBreakdownItem format
      const taxBreakdown: TaxBreakdownItem[] = priceWithTaxes.appliedTaxes.map(tax => ({
        taxId: tax.taxId,
        taxName: tax.taxName,
        percentage: tax.percentage,
        amount: tax.amount,
        effectiveDate: tax.effectiveDate
      }));

      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(
        (item) => item.id === priceListData.item_id
      )

      if (existingItemIndex >= 0) {
        // Update quantity
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += 1
        setCart(updatedCart)
        
        toast.success("Item Updated", {
          description: `${priceListData.items.description} quantity increased to ${updatedCart[existingItemIndex].quantity}`
        })
      } else {
        // Add new item to cart with full tax information
        const newItem: CartItem = {
          id: priceListData.item_id,
          priceListId: priceListData.id,
          description: priceListData.items.description,
          barcode: barcode,
          basePrice: priceWithTaxes.basePrice,
          taxAmount: priceWithTaxes.totalTaxAmount,
          finalPrice: priceWithTaxes.priceWithTaxes,
          quantity: 1,
          unit: priceListData.units.unit,
          currencyId: selectedCurrencyId,
          currency: baseCurrency || undefined,
          taxBreakdown: taxBreakdown,
          hasCustomTaxes: !priceWithTaxes.usesDefaultNoTax
        }
        setCart([...cart, newItem])
        
        const taxInfo = priceWithTaxes.usesDefaultNoTax 
          ? "(No tax)"
          : `(+${formatCurrency(priceWithTaxes.totalTaxAmount, baseCurrency?.code || 'USD')} tax)`;
        
        toast.success("Item Added", {
          description: `${newItem.description} added to cart ${taxInfo}`
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
    return cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
  }

  const calculateTotalTax = (): number => {
    return cart.reduce((sum, item) => sum + item.taxAmount * item.quantity, 0)
  }

  const calculateTotal = (): number => {
    return cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + adjustAmount
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

      // Create invoice details with proper tax support
      const invoiceDetails = cart.map((item) => ({
        invoice_id: invoiceData.id,
        item_id: item.id,
        price: item.finalPrice, // Final price including tax
        base_price: item.basePrice, // Base price before tax
        tax_amount: item.taxAmount, // Total tax amount
        total_price: item.finalPrice, // Same as final price
        quantity: item.quantity,
      }))

      const { data: detailsData, error: detailsError } = await supabase
        .from("invoice_details")
        .insert(invoiceDetails)
        .select()

      if (detailsError) throw detailsError

      // Create invoice detail taxes for audit trail
      const invoiceDetailTaxes: any[] = []
      
      cart.forEach((item, index) => {
        if (item.hasCustomTaxes && item.taxBreakdown.length > 0) {
          item.taxBreakdown.forEach((tax) => {
            invoiceDetailTaxes.push({
              invoice_detail_id: detailsData[index].id,
              tax_type_id: tax.taxId,
              tax_percentage: tax.percentage,
              tax_amount: tax.amount * item.quantity
            })
          })
        }
      })

      // Insert tax details if any exist
      if (invoiceDetailTaxes.length > 0) {
        const { error: taxDetailsError } = await supabase
          .from("invoice_detail_taxes")
          .insert(invoiceDetailTaxes)
        
        if (taxDetailsError) {
          console.error('Tax details insertion error:', taxDetailsError)
          // Don't fail the transaction for tax detail errors
        }
      }

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
              <CardDescription>
                Supports UPC, EAN, GTIN codes and store-specific barcodes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium">Preferred Currency</label>
                  <CurrencySelector
                    value={selectedCurrencyId}
                    onValueChange={setSelectedCurrencyId}
                    placeholder="Select currency"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t("pos.scanBarcode")}</label>
                <div className="flex gap-2">
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    placeholder="Scan or enter UPC/EAN/GTIN barcode"
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  Cart ({cart.length} items)
                </div>
                <div className="text-sm text-muted-foreground">
                  Currency: {baseCurrency?.symbol} {baseCurrency?.code}
                </div>
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
                          {item.barcode} • <MoneyDisplay amount={item.basePrice} currencyId={item.currencyId} /> per {item.unit}
                          {item.hasCustomTaxes && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-1 rounded">
                              +{formatCurrency(item.taxAmount, baseCurrency?.code || 'USD')} tax
                            </span>
                          )}
                        </p>
                        {item.hasCustomTaxes && (
                          <p className="text-xs text-muted-foreground">
                            Final: <MoneyDisplay amount={item.finalPrice} currencyId={item.currencyId} /> per {item.unit}
                          </p>
                        )}
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
                          <MoneyDisplay amount={item.finalPrice * item.quantity} currencyId={item.currencyId} />
                          {item.hasCustomTaxes && (
                            <div className="text-xs text-muted-foreground">
                              Base: <MoneyDisplay amount={item.basePrice * item.quantity} currencyId={item.currencyId} />
                            </div>
                          )}
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
                <span>{t("pos.subtotal")} (Base)</span>
                <MoneyDisplay 
                  amount={calculateSubtotal()} 
                  currencyId={selectedCurrencyId || (baseCurrency?.id ?? 1)} 
                />
              </div>
              <div className="flex justify-between">
                <span>Total Tax</span>
                <MoneyDisplay 
                  amount={calculateTotalTax()} 
                  currencyId={selectedCurrencyId || (baseCurrency?.id ?? 1)} 
                />
              </div>
              <div className="flex justify-between">
                <span>{t("pos.adjustAmount")}</span>
                <MoneyDisplay 
                  amount={adjustAmount} 
                  currencyId={selectedCurrencyId || (baseCurrency?.id ?? 1)} 
                />
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>{t("pos.finalTotal")}</span>
                <MoneyDisplay 
                  amount={calculateTotal()} 
                  currencyId={selectedCurrencyId || (baseCurrency?.id ?? 1)}
                  variant="large" 
                />
              </div>
              
              {/* Tax Details Expansion */}
              {calculateTotalTax() > 0 && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tax Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-sm">
                      {cart.filter(item => item.hasCustomTaxes).map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="font-medium text-xs text-muted-foreground">{item.description}:</div>
                          {item.taxBreakdown.map((tax) => (
                            <div key={tax.taxId} className="flex justify-between text-xs ml-2">
                              <span>{tax.taxName} ({tax.percentage}%) × {item.quantity}</span>
                              <span>
                                <MoneyDisplay 
                                  amount={tax.amount * item.quantity} 
                                  currencyId={selectedCurrencyId || (baseCurrency?.id ?? 1)} 
                                />
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
