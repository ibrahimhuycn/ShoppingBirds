"use client"

import { CurrencySelector } from "@/components/currency"
import { getActiveCurrencies, getBaseCurrency, type Currency } from "@/lib/currency"
import { SettingsService, type AppSettings } from "@/lib/settings"
import { useI18n } from "@/contexts/translation-context"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Globe, 
  Coins, 
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

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const [settings, setSettings] = useState<AppSettings>(SettingsService.loadSettings());
  
  const [stores, setStores] = useState<Store[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backupData, setBackupData] = useState<string>("")

  const loadBaseCurrency = useCallback(async (): Promise<void> => {
    try {
      const currency = await getBaseCurrency();
      setBaseCurrency(currency);
      // Set default currency to base currency if not set
      if (!settings.defaultCurrencyId) {
        setSettings(prev => ({ ...prev, defaultCurrencyId: currency.id }));
      }
    } catch (error) {
      console.error("Error loading base currency:", error);
    }
  }, [settings.defaultCurrencyId]);

  useEffect(() => {
    loadStores();
    loadSettings();
    loadBaseCurrency();
  }, [loadBaseCurrency]);

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
    const loadedSettings = SettingsService.loadSettings();
    setSettings(loadedSettings);
  };

  const saveSettings = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Save settings using the service
      SettingsService.saveSettings(settings);
      
      // Apply theme changes
      SettingsService.applyTheme(settings.theme);
      
      alert(t('common.success'));
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: string): void => {
    setSettings({ ...settings, language: newLanguage });
    setLocale(newLanguage as any);
  };

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

      alert(t('common.success'))
    } catch (error) {
      console.error("Error exporting data:", error)
      alert(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = async (): Promise<void> => {
    if (!confirm(t('common.confirm') + '?')) {
      return
    }

    if (!confirm(t('common.confirm') + '?')) {
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

      alert(t('common.success'))
      window.location.reload()
    } catch (error) {
      console.error("Error clearing data:", error)
      alert(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = async (): Promise<void> => {
    if (!confirm(t('common.confirm') + '?')) {
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

      alert(t('common.success'))
      window.location.reload()
    } catch (error) {
      console.error("Error resetting data:", error)
      alert(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <Button onClick={saveSettings} disabled={isLoading}>
          {t('settings.saveSettings')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Currency Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="size-5" />
              {t('settings.currencyManagement')}
            </CardTitle>
            <CardDescription>{t('settings.currencyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>{t('settings.currencyDescription')}</p>
            </div>
            
            <div className="space-y-2">
              <Link href="/settings/currencies">
                <Button variant="outline" className="w-full">
                  <Coins className="size-4 mr-2" />
                  {t('settings.manageCurrencies')}
                </Button>
              </Link>
              
              <Link href="/settings/currency-test">
                <Button variant="outline" className="w-full">
                  <Settings className="size-4 mr-2" />
                  {t('settings.testCurrencySystem')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              {t('settings.general')}
            </CardTitle>
            <CardDescription>{t('settings.generalDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('settings.defaultCurrency')}</label>
              <CurrencySelector
                value={settings.defaultCurrencyId}
                onValueChange={(currencyId) => setSettings({ ...settings, defaultCurrencyId: currencyId })}
                placeholder={t('settings.selectDefaultCurrency')}
                showFullName={true}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('settings.defaultStore')}</label>
              <Select
                value={settings.defaultStore}
                onValueChange={(value) => setSettings({ ...settings, defaultStore: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.selectDefaultStore')} />
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
              <label className="text-sm font-medium">{t('settings.lowStockAlert')}</label>
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
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('settings.language')}</label>
              <Select
                value={settings.language}
                onValueChange={handleLanguageChange}
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
              <label className="text-sm font-medium">{t('settings.theme')}</label>
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
                      {t('settings.lightTheme')}
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="size-4" />
                      {t('settings.darkTheme')}
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-4" />
                      {t('settings.systemTheme')}
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
              {t('settings.printing')}
            </CardTitle>
            <CardDescription>{t('settings.printingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('settings.receiptPrinter')}</label>
              <Select
                value={settings.receiptPrinter}
                onValueChange={(value) => setSettings({ ...settings, receiptPrinter: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('settings.defaultPrinter')}</SelectItem>
                  <SelectItem value="thermal">{t('settings.thermalPrinter')}</SelectItem>
                  <SelectItem value="none">{t('settings.noPrinter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Printer className="size-4 mr-2" />
                {t('settings.testPrint')}
              </Button>
              <Button variant="outline" className="w-full">
                {t('settings.configurePrinter')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              {t('settings.dataManagement')}
            </CardTitle>
            <CardDescription>{t('settings.dataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('settings.automaticBackup')}</label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t('settings.never')}</SelectItem>
                  <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('settings.monthly')}</SelectItem>
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
                {t('settings.exportData')}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Upload className="size-4 mr-2" />
                {t('settings.importData')}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                <RefreshCw className="size-4 mr-2" />
                {t('settings.resetToDefaults')}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={clearAllData}
                disabled={isLoading}
              >
                <Trash2 className="size-4 mr-2" />
                {t('settings.clearAllData')}
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
            {t('settings.systemInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.appVersion')}</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.databaseStatus')}</span>
                <span className="text-sm text-green-600">{t('settings.connected')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.lastBackup')}</span>
                <span className="text-sm text-muted-foreground">{t('settings.never')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.totalStores')}</span>
                <span className="text-sm text-muted-foreground">{stores.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.storageUsed')}</span>
                <span className="text-sm text-muted-foreground">2.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">{t('settings.lastUpdated')}</span>
                <span className="text-sm text-muted-foreground">{t('settings.today')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
