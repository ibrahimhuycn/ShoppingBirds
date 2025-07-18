"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getTranslations, useTranslation } from "@/lib/i18n"
import { defaultLocale } from "@/lib/i18n/config"

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
  const [translations, setTranslations] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async (): Promise<void> => {
    try {
      // Load translations
      const trans = await getTranslations(defaultLocale)
      setTranslations(trans)

      // Load all transactions
      await loadTransactions()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const loadTransactions = async (start?: string, end?: string): Promise<void> => {
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
          stores (name),
          invoice_details (
            id,
            quantity,
            price,
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
          transformedData.push({
            invoice_id: invoice.id,
            invoice_number: invoice.number,
            item_id: detail.items.id,
            item_name: detail.items.description,
            store_id: 0, // From invoice
            store: invoice.stores.name,
            invoice_details_id: detail.id,
            quantity: detail.quantity,
            rate: detail.price,
            adjust_amount: invoice.adjust_amount,
            total: invoice.total,
            invoice_date: invoice.date,
          })
        })
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
  }

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

  if (!translations) {
    return <div>Loading...</div>
  }

  const { t } = useTranslation(defaultLocale, translations)

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
                <CardTitle className="text-2xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
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
                <CardTitle className="text-2xl">{formatCurrency(stats.averageTransaction)}</CardTitle>
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
              }, [] as any[]).map((invoice) => (
                <div key={invoice.invoice_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{invoice.invoice_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {invoice.store} • {formatDate(invoice.invoice_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                      {invoice.adjust_amount !== 0 && (
                        <p className="text-sm text-muted-foreground">
                          Adjust: {formatCurrency(invoice.adjust_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {invoice.items.map((item: TransactionRecord) => (
                      <div key={item.invoice_details_id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.item_name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.rate)}
                          </span>
                          <span className="font-medium min-w-20 text-right">
                            {formatCurrency(item.quantity * item.rate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
