"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Printer, 
  Database, 
  User, 
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Moon,
  Sun,
  Monitor
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database as DatabaseType } from "@/types/database"

// Use proper Supabase types
type Store = DatabaseType['public']['Tables']['stores']['Row']

interface SettingsData {
  defaultCurrency: string
  language: string
  theme: string
  autoSave: boolean
  defaultStore: string
  receiptPrinter: string
  backupFrequency: string
  lowStockAlert: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    defaultCurrency: "USD",
    language: "en",
    theme: "system",
    autoSave: true,
    defaultStore: "",
    receiptPrinter: "default",
    backupFrequency: "daily",
    lowStockAlert: 10,
  })
  
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [backupData, setBackupData] = useState<string>("")

  useEffect(() => {
    loadStores()
    loadSettings()
  }, [])

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

  const loadSettings = (): void => {
    // Load settings from localStorage or default values
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem("shoppingbird_settings")
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error("Error parsing saved settings:", error)
        }
      }
    }
  }

  const saveSettings = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // Save to localStorage (in a real app, you'd save to database)
      if (typeof window !== 'undefined') {
        localStorage.setItem("shoppingbird_settings", JSON.stringify(settings))
      }
      
      // Apply theme changes
      if (typeof window !== 'undefined') {
        if (settings.theme === "dark") {
          document.documentElement.classList.add("dark")
        } else if (settings.theme === "light") {
          document.documentElement.classList.remove("dark")
        } else {
          // System theme
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
          document.documentElement.classList.toggle("dark", prefersDark)
        }
      }
      
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings")
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // Export all data from database
      const { data: invoicesData } = await supabase.from("invoices").select("*")
      const { data: itemsData } = await supabase.from("items").select("*")
      const { data: storesData } = await supabase.from("stores").select("*")
      const { data: priceListsData } = await supabase.from("price_lists").select("*")
      const { data: unitsData } = await supabase.from("units").select("*")

      const exportData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          invoices: invoicesData,
          items: itemsData,
          stores: storesData,
          price_lists: priceListsData,
          units: unitsData,
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shoppingbird-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert("Data exported successfully!")
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Error exporting data")
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = async (): Promise<void> => {
    if (!confirm("Are you sure you want to clear ALL data? This action cannot be undone!")) {
      return
    }

    if (!confirm("This will delete all invoices, items, stores, and price lists. Are you absolutely sure?")) {
      return
    }

    setIsLoading(true)
    try {
      // Delete in order due to foreign key constraints
      await supabase.from("invoice_details").delete().neq("id", 0)
      await supabase.from("invoices").delete().neq("id", 0)
      await supabase.from("price_lists").delete().neq("id", 0)
      await supabase.from("items").delete().neq("id", 0)
      await supabase.from("stores").delete().neq("id", 0)
      await supabase.from("units").delete().neq("id", 0)

      alert("All data cleared successfully!")
      window.location.reload()
    } catch (error) {
      console.error("Error clearing data:", error)
      alert("Error clearing data")
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = async (): Promise<void> => {
    if (!confirm("Reset to default sample data? This will clear existing data.")) {
      return
    }

    setIsLoading(true)
    try {
      // Clear existing data first
      await supabase.from("invoice_details").delete().neq("id", 0)
      await supabase.from("invoices").delete().neq("id", 0)
      await supabase.from("price_lists").delete().neq("id", 0)
      await supabase.from("items").delete().neq("id", 0)
      await supabase.from("stores").delete().neq("id", 0)
      await supabase.from("units").delete().neq("id", 0)

      // Insert default data
      await supabase.from("stores").insert({ name: "TEST STORE" })
      await supabase.from("units").insert([
        { unit: "ea", description: "Each" },
        { unit: "Kg", description: "Kilogram" },
        { unit: "g", description: "gram" }
      ])
      await supabase.from("items").insert({ description: "TEST" })
      
      // Get the inserted IDs and create price list
      const { data: itemData } = await supabase.from("items").select("id").eq("description", "TEST").single()
      const { data: storeData } = await supabase.from("stores").select("id").eq("name", "TEST STORE").single()
      const { data: unitData } = await supabase.from("units").select("id").eq("unit", "ea").single()

      if (itemData && storeData && unitData) {
        await supabase.from("price_lists").insert({
          item_id: itemData.id,
          barcode: "1234",
          store_id: storeData.id,
          retail_price: 23.6000,
          unit_id: unitData.id
        })
      }

      alert("Reset to default data successfully!")
      window.location.reload()
    } catch (error) {
      console.error("Error resetting data:", error)
      alert("Error resetting data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={saveSettings} disabled={isLoading}>
          Save Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              General Settings
            </CardTitle>
            <CardDescription>Configure basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Default Currency</label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="MVR">MVR (Rf)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Default Store</label>
              <Select
                value={settings.defaultStore}
                onValueChange={(value) => setSettings({ ...settings, defaultStore: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default store" />
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
              <label className="text-sm font-medium">Low Stock Alert Threshold</label>
              <Input
                type="number"
                value={settings.lowStockAlert}
                onChange={(e) => setSettings({ ...settings, lowStockAlert: parseInt(e.target.value) || 0 })}
                placeholder="10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              Appearance & Language
            </CardTitle>
            <CardDescription>Customize the look and language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Language</label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="dv">ދިވެހި (Dhivehi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Theme</label>
              <Select
                value={settings.theme}
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="size-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="size-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Receipt & Printing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="size-5" />
              Receipt & Printing
            </CardTitle>
            <CardDescription>Configure receipt and printing options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Receipt Printer</label>
              <Select
                value={settings.receiptPrinter}
                onValueChange={(value) => setSettings({ ...settings, receiptPrinter: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Printer</SelectItem>
                  <SelectItem value="thermal">Thermal Printer</SelectItem>
                  <SelectItem value="none">No Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Printer className="size-4 mr-2" />
                Test Print Receipt
              </Button>
              <Button variant="outline" className="w-full">
                Configure Printer Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Data Management
            </CardTitle>
            <CardDescription>Backup, restore, and manage your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Automatic Backup</label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={exportData}
                disabled={isLoading}
              >
                <Download className="size-4 mr-2" />
                Export All Data
              </Button>
              
              <Button variant="outline" className="w-full">
                <Upload className="size-4 mr-2" />
                Import Data
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                <RefreshCw className="size-4 mr-2" />
                Reset to Sample Data
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={clearAllData}
                disabled={isLoading}
              >
                <Trash2 className="size-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Application Version</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Backup</span>
                <span className="text-sm text-muted-foreground">Never</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Stores</span>
                <span className="text-sm text-muted-foreground">{stores.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm text-muted-foreground">2.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm text-muted-foreground">Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
