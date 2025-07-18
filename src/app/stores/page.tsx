"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Store, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getTranslations, useTranslation } from "@/lib/i18n"
import { defaultLocale } from "@/lib/i18n/config"

interface Store {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 6
  })
  const [translations, setTranslations] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    filterAndPaginateStores()
  }, [stores, searchQuery, pagination.currentPage, pagination.itemsPerPage])

  const filterAndPaginateStores = (): void => {
    let filtered = stores

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = stores.filter(store => 
        store.name.toLowerCase().includes(query) ||
        store.id.toString().includes(query)
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

    // Set paginated stores
    setFilteredStores(filtered.slice(startIndex, endIndex))
  }

  const loadInitialData = async (): Promise<void> => {
    try {
      // Load translations
      const trans = await getTranslations(defaultLocale)
      setTranslations(trans)

      // Load stores
      await loadStores()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const loadStores = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name")

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error("Error loading stores:", error)
      alert("Error loading stores")
    } finally {
      setIsLoading(false)
    }
  }

  const addStore = async (): Promise<void> => {
    if (!newStoreName.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("stores")
        .insert({ name: newStoreName.trim() })
        .select()
        .single()

      if (error) throw error

      setStores([...stores, data])
      setNewStoreName("")
      setIsAdding(false)
    } catch (error) {
      console.error("Error adding store:", error)
      alert("Error adding store")
    } finally {
      setIsLoading(false)
    }
  }

  const updateStore = async (store: Store): Promise<void> => {
    if (!store.name.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("stores")
        .update({ name: store.name.trim() })
        .eq("id", store.id)
        .select()
        .single()

      if (error) throw error

      setStores(stores.map((s) => (s.id === store.id ? data : s)))
      setEditingStore(null)
    } catch (error) {
      console.error("Error updating store:", error)
      alert("Error updating store")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteStore = async (storeId: number): Promise<void> => {
    if (!confirm("Are you sure you want to delete this store?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId)

      if (error) throw error

      setStores(stores.filter((s) => s.id !== storeId))
    } catch (error) {
      console.error("Error deleting store:", error)
      alert("Error deleting store")
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

  if (!translations) {
    return <div>Loading...</div>
  }

  const { t } = useTranslation(defaultLocale, translations)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("stores.title")}</h1>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="size-4 mr-2" />
          {t("stores.addStore")}
        </Button>
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
              <label className="text-sm font-medium">Search Stores</label>
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by store name or ID..."
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stores per page</label>
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => changeItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 stores</SelectItem>
                  <SelectItem value="12">12 stores</SelectItem>
                  <SelectItem value="24">24 stores</SelectItem>
                  <SelectItem value="48">48 stores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredStores.length} of {pagination.totalItems} stores
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{t("stores.addStore")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addStore)}
                placeholder={t("stores.storeName")}
                className="flex-1"
              />
              <Button
                onClick={addStore}
                disabled={!newStoreName.trim() || isLoading}
              >
                {t("pos.save")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewStoreName("")
                }}
              >
                {t("pos.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store) => (
          <Card key={store.id} className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-lg bg-blue-500">
                  <Store className="size-5 text-white" />
                </div>
                <div className="flex-1">
                  {editingStore?.id === store.id ? (
                    <Input
                      value={editingStore.name}
                      onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                      onKeyPress={(e) => handleKeyPress(e, () => updateStore(editingStore))}
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  ID: {store.id}
                </div>
                <div className="flex gap-2">
                  {editingStore?.id === store.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStore(editingStore)}
                        disabled={!editingStore.name.trim() || isLoading}
                      >
                        {t("pos.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingStore(null)}
                      >
                        {t("pos.cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingStore(store)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStore(store.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
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

      {filteredStores.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Store className="size-12 text-muted-foreground mx-auto mb-4" />
            {searchQuery ? (
              <div>
                <p className="text-muted-foreground mb-2">
                  No stores found matching "{searchQuery}"
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
                No stores found. Click the "Add Store" button to create your first store.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
