"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Receipt, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/contexts/translation-context"
import type { Database } from "@/types/database"

// Use proper Supabase types
type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceDetail = Database['public']['Tables']['invoice_details']['Row']
type Item = Database['public']['Tables']['items']['Row']
type Store = Database['public']['Tables']['stores']['Row']

interface TransactionRecord {
  invoice_id: number
  invoice_number: string
  item_id: number
  item_name: string
  store_id: number
  store: string
  invoice_details_id: number
  quantity: number
  rate: number
  base_price: number
  tax_amount: number
  total_price: number
  adjust_amount: number
  total: number
  invoice_date: string
}

interface ReportStats {
  totalTransactions: number
  totalRevenue: number
  totalItems: number
  averageTransaction: number
}

export default function ReportsPage() {
  const { t } = useI18n()
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [stats, setStats] = useState<ReportStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageTransaction: 0,
  })
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const loadTransactions = useCallback(async (start?: string, end?: string): Promise<void> => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("invoices")
        .select(`
          id,
          number,
          total,
          adjust_amount,
          date,
          store_id,
          stores (name),
          invoice_details (
            id,
            quantity,
            price,
            base_price,
            tax_amount,
            total_price,
            item_id,
            items (id, description)
          )
        `)
        .order("date", { ascending: false })

      if (start) {
        query = query.gte("date", start)
      }
      if (end) {
        query = query.lte("date", end)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data for display
      const transformedData: TransactionRecord[] = []
      let totalRevenue = 0
      let totalItems = 0
      data?.forEach((invoice) => {
        invoice.invoice_details.forEach((detail) => {
          const items = detail.items
          if (!items || (Array.isArray(items) && items.length === 0)) {
            return
          }
          
          const item = Array.isArray(items) ? items[0] : items
          
          transformedData.push({
            invoice_id: invoice.id,
            invoice_number: invoice.number,
            item_id: item.id,
            item_name: item.description,
            store_id: invoice.store_id,
            store: (invoice.stores as any)?.name || 'N/A',
            invoice_details_id: detail.id,
            quantity: detail.quantity,
            rate: detail.price,
            base_price: detail.base_price || detail.price,
            tax_amount: detail.tax_amount || 0,
            total_price: detail.total_price || detail.price,
            adjust_amount: invoice.adjust_amount,
            total: invoice.total,
            invoice_date: invoice.date,
          })
        })
      })

      data?.forEach((invoice) => {
        totalRevenue += invoice.total
        totalItems += invoice.invoice_details.length
      })

      setTransactions(transformedData)
      setStats({
        totalTransactions: data?.length || 0,
        totalRevenue,
        totalItems,
        averageTransaction: data?.length ? totalRevenue / data.length : 0,
      })
    } catch (error) {
      console.error("Error loading transactions:", error)
      alert("Error loading transactions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      // Load all transactions
      await loadTransactions()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }, [loadTransactions])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const filterByDateRange = (): void => {
    if (startDate || endDate) {
      loadTransactions(startDate, endDate)
    } else {
      loadTransactions()
    }
  }

  const clearFilters = (): void => {
    setStartDate("")
    setEndDate("")
    loadTransactions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={filterByDateRange} disabled={isLoading}>
              {t("common.filter")}
            </Button>
            <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
              {t("common.clear")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-blue-500">
                <BarChart3 className="size-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{stats.totalTransactions}</CardTitle>
                <CardDescription>Total Transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-green-500">
                <DollarSign className="size-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {formatCurrency(stats.totalRevenue)}
                </CardTitle>
                <CardDescription>Total Revenue</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-purple-500">
                <Package className="size-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{stats.totalItems}</CardTitle>
                <CardDescription>Total Items Sold</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-orange-500">
                <TrendingUp className="size-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {formatCurrency(stats.averageTransaction)}
                </CardTitle>
                <CardDescription>Average Transaction</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed transaction records {startDate || endDate ? `filtered by date range` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No transactions found for the selected period.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group by invoice */}
              {transactions.reduce((acc, transaction) => {
                const existingInvoice = acc.find(
                  (item) => item.invoice_id === transaction.invoice_id
                )
                if (existingInvoice) {
                  existingInvoice.items.push(transaction)
                } else {
                  acc.push({
                    invoice_id: transaction.invoice_id,
                    invoice_number: transaction.invoice_number,
                    store: transaction.store,
                    total: transaction.total,
                    adjust_amount: transaction.adjust_amount,
                    invoice_date: transaction.invoice_date,
                    items: [transaction],
                  })
                }
                return acc
              }, [] as any[]).map((invoice) => {
                
                return (
                  <div key={invoice.invoice_id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="size-4 text-muted-foreground" />
                          <h4 className="font-semibold">{invoice.invoice_number}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.store} • {formatDate(invoice.invoice_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(invoice.total)}
                        </p>
                        {invoice.adjust_amount !== 0 && (
                          <p className="text-sm text-muted-foreground">
                            Adjust: {formatCurrency(invoice.adjust_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {invoice.items.map((item: TransactionRecord) => (
                        <div key={item.invoice_details_id} className="flex items-center justify-between text-sm bg-muted/20 p-2 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{item.item_name}</span>
                            {item.tax_amount > 0 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                +{formatCurrency(item.tax_amount)} tax
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {item.quantity} × {formatCurrency(item.base_price)}
                            </span>
                            <span className="font-medium min-w-20 text-right">
                              {formatCurrency(item.total_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
