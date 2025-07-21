import type { Database } from '@/types/database';

// Base types from database
export type Item = Database['public']['Tables']['items']['Row'];
export type Store = Database['public']['Tables']['stores']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type PriceListRow = Database['public']['Tables']['price_lists']['Row'];

// Extended types with relationships
export interface PriceList extends PriceListRow {
  stores: { name: string };
  units: { unit: string; description: string };
  currencies?: { id: number; code: string; symbol: string; name: string } | null;
}

export interface ItemTag {
  tags: {
    id: number;
    name: string;
    tag_type: string;
    color: string | null;
  };
}

export interface ItemWithPrices extends Item {
  price_lists: PriceList[];
  item_tags?: ItemTag[];
}

// Form types
export interface PriceFormData {
  barcode: string;
  store_id: string;
  retail_price: string;
  unit_id: string;
  selectedTaxIds?: number[];
}

export interface AddItemFormData {
  description: string;
}

// Search and pagination types
export interface SearchFilters {
  query: string;
  storeId?: number;
  categoryId?: number;
  hasPrice?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ItemListState {
  items: ItemWithPrices[];
  filteredItems: ItemWithPrices[];
  pagination: PaginationInfo;
  isLoading: boolean;
  searchFilters: SearchFilters;
}

// Action types
export interface ItemActions {
  loadItems: () => Promise<void>;
  addItem: (data: AddItemFormData) => Promise<void>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  addPrice: (itemId: number, priceData: PriceFormData) => Promise<void>;
  searchItems: (filters: SearchFilters) => void;
  changePage: (page: number) => void;
  changeItemsPerPage: (itemsPerPage: number) => void;
}

// Component prop types
export interface ItemCardProps {
  item: ItemWithPrices;
  onEdit: (item: Item) => void;
  onDelete: (itemId: number) => void;
  onManagePrices: (itemId: number) => void;
  isLoading: boolean;
}

export interface ItemListProps {
  items: ItemWithPrices[];
  onItemEdit: (item: Item) => void;
  onItemDelete: (itemId: number) => void;
  onManagePrices: (itemId: number) => void;
  isLoading: boolean;
}

export interface SearchBarProps {
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  totalItems: number;
  filteredItems: number;
}

export interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export interface AddItemFormProps {
  onSubmit: (data: AddItemFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export interface AddPriceFormProps {
  itemId: number;
  itemDescription: string;
  stores: Store[];
  units: Unit[];
  onSubmit: (itemId: number, data: PriceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  showTaxSelector?: boolean;
}

// UPC related types
export interface UPCLookupProps {
  onProductFound: (data: any) => Promise<void>;
  onProductNotFound: (upc: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}
