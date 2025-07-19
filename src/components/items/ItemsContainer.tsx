import { useState, useEffect } from 'react';
import { useItems } from '@/hooks/items/useItems';
import { useItemsSearch } from '@/hooks/items/useItemsSearch';
import { ItemsPageHeader } from './ItemsPageHeader';
import { SearchBar } from './search/SearchBar';
import { Pagination } from './search/Pagination';
import { ItemList } from './list/ItemList';
import { EmptyState } from './list/EmptyState';
import { 
  AddItemDialog,
  AddPriceDialog,
  UPCLookupDialog,
  EnhancedItemDialog,
  TagsManagerDialog,
  PriceManagerDialog,
  ItemEditDialog,
} from './forms';
import { productEnhancementService, type EnhancedProductData } from '@/lib/product-enhancement';
import { toast } from 'sonner';
import type { Item } from '@/types/items';

export function ItemsContainer() {
  // Dialog state management
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState<boolean>(false);
  const [isUPCDialogOpen, setIsUPCDialogOpen] = useState<boolean>(false);
  const [isEnhancedDialogOpen, setIsEnhancedDialogOpen] = useState<boolean>(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState<boolean>(false);
  const [addPriceDialog, setAddPriceDialog] = useState<{
    open: boolean;
    itemId: number | null;
  }>({ open: false, itemId: null });
  const [priceManagerDialog, setPriceManagerDialog] = useState<{
    open: boolean;
    itemId: number | null;
  }>({ open: false, itemId: null });
  const [itemEditDialog, setItemEditDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });

  // Enhanced dialog state
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Custom hooks
  const {
    items,
    stores,
    units,
    isLoading,
    loadItems,
    loadStores,
    loadUnits,
    addItem,
    updateItem,
    deleteItem,
    addPrice,
  } = useItems();

  const {
    filteredItems,
    searchFilters,
    pagination,
    updateSearchFilters,
    changePage,
    changeItemsPerPage,
    resetSearch,
  } = useItemsSearch(items);

  // Initialize data
  useEffect(() => {
    const initializeData = async (): Promise<void> => {
      await Promise.all([loadItems(), loadStores(), loadUnits()]);
    };
    initializeData();
  }, [loadItems, loadStores, loadUnits]);

  // Event handlers
  const handleAddItem = async (data: { description: string }): Promise<void> => {
    await addItem(data);
  };

  const handleEditItem = (item: Item): void => {
    setItemEditDialog({ open: true, item });
  };

  const handleUpdateItem = async (data: Partial<Item>): Promise<void> => {
    if (!itemEditDialog.item) return;
    
    const updatedItem: Item = { ...itemEditDialog.item, ...data };
    await updateItem(updatedItem);
  };

  const handleDeleteItem = async (itemId: number): Promise<void> => {
    await deleteItem(itemId);
  };

  const handleAddPrice = async (itemId: number, priceData: any): Promise<void> => {
    await addPrice(itemId, priceData);
  };

  const handleOpenAddPriceDialog = (itemId: number): void => {
    setAddPriceDialog({ open: true, itemId });
  };

  const handleCloseAddPriceDialog = (): void => {
    setAddPriceDialog({ open: false, itemId: null });
  };

  const handleOpenPriceManagerDialog = (itemId: number): void => {
    setPriceManagerDialog({ open: true, itemId });
  };

  const handleClosePriceManagerDialog = (): void => {
    setPriceManagerDialog({ open: false, itemId: null });
  };

  const handleCloseItemEditDialog = (): void => {
    setItemEditDialog({ open: false, item: null });
  };

  const handleUPCProductFound = async (enhancedData: EnhancedProductData): Promise<void> => {
    const newItem = await productEnhancementService.createEnhancedItem(enhancedData);
    await loadItems(); // Refresh items list
    toast.success(`Item created: ${newItem.title || newItem.description}`);
  };

  const handleUPCProductNotFound = (upc: string): void => {
    toast.warning(`Product not found for UPC: ${upc}. You can add it manually instead.`);
    setIsAddItemDialogOpen(true);
  };

  const handleEnhancedSave = async (data: any): Promise<void> => {
    if (editingItem) {
      // Update existing item
      const updatedItem: Item = { ...editingItem, ...data };
      await updateItem(updatedItem);
      setEditingItem(null);
    } else {
      // Create new item
      await productEnhancementService.createEnhancedItem(data);
      await loadItems(); // Refresh items list
      toast.success('Enhanced item created successfully');
    }
  };

  const handleEnhancedDialogClose = (): void => {
    setIsEnhancedDialogOpen(false);
    setEditingItem(null);
  };

  const handlePricesUpdated = (): void => {
    loadItems(); // Refresh items list
  };

  // Get item description for forms
  const getItemDescription = (itemId: number): string => {
    const item = items.find(i => i.id === itemId);
    return item?.description || 'Item';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ItemsPageHeader
        onAddItem={() => setIsAddItemDialogOpen(true)}
        onAddWithUPC={() => setIsUPCDialogOpen(true)}
        onAddEnhanced={() => setIsEnhancedDialogOpen(true)}
        onToggleTagsManager={() => setIsTagsDialogOpen(true)}
        showTagsManager={isTagsDialogOpen}
        isLoading={isLoading}
      />

      {/* Search and Filters */}
      <SearchBar
        searchFilters={searchFilters}
        onFiltersChange={updateSearchFilters}
        itemsPerPage={pagination.itemsPerPage}
        onItemsPerPageChange={changeItemsPerPage}
        totalItems={pagination.totalItems}
        filteredItems={filteredItems.length}
      />

      {/* Items List */}
      {filteredItems.length > 0 ? (
        <ItemList
          items={filteredItems}
          onItemEdit={handleEditItem}
          onItemDelete={handleDeleteItem}
          onAddPrice={handleOpenAddPriceDialog}
          onManagePrices={handleOpenPriceManagerDialog}
          isLoading={isLoading}
        />
      ) : (
        <EmptyState
          searchQuery={searchFilters.query}
          onClearSearch={resetSearch}
        />
      )}

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={changePage}
      />

      {/* Dialog Components */}
      <AddItemDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onSubmit={handleAddItem}
        isLoading={isLoading}
      />

      <UPCLookupDialog
        open={isUPCDialogOpen}
        onOpenChange={setIsUPCDialogOpen}
        onProductFound={handleUPCProductFound}
        onProductNotFound={handleUPCProductNotFound}
        isLoading={isLoading}
      />

      <EnhancedItemDialog
        open={isEnhancedDialogOpen}
        onOpenChange={handleEnhancedDialogClose}
        mode={editingItem ? 'edit' : 'create'}
        item={editingItem || undefined}
        onSave={handleEnhancedSave}
        isLoading={isLoading}
      />

      <TagsManagerDialog
        open={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
      />

      {/* Item Edit Dialog */}
      {itemEditDialog.item && (
        <ItemEditDialog
          open={itemEditDialog.open}
          onOpenChange={handleCloseItemEditDialog}
          item={itemEditDialog.item}
          onSave={handleUpdateItem}
          isLoading={isLoading}
        />
      )}

      {/* Add Price Dialog */}
      {addPriceDialog.itemId && (
        <AddPriceDialog
          open={addPriceDialog.open}
          onOpenChange={handleCloseAddPriceDialog}
          itemId={addPriceDialog.itemId}
          itemDescription={getItemDescription(addPriceDialog.itemId)}
          stores={stores}
          units={units}
          onSubmit={handleAddPrice}
          isLoading={isLoading}
        />
      )}

      {/* Price Manager Dialog */}
      {priceManagerDialog.itemId && (
        <PriceManagerDialog
          open={priceManagerDialog.open}
          onOpenChange={handleClosePriceManagerDialog}
          itemId={priceManagerDialog.itemId}
          itemDescription={getItemDescription(priceManagerDialog.itemId)}
          onPricesUpdated={handlePricesUpdated}
        />
      )}
    </div>
  );
}
