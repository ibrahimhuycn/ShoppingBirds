import { useState, useMemo, useCallback } from 'react';
import type { 
  ItemWithPrices, 
  SearchFilters, 
  PaginationInfo 
} from '@/types/items';

export interface UseItemsSearchReturn {
  filteredItems: ItemWithPrices[];
  searchFilters: SearchFilters;
  pagination: PaginationInfo;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  changePage: (page: number) => void;
  changeItemsPerPage: (itemsPerPage: number) => void;
  resetSearch: () => void;
}

export function useItemsSearch(items: ItemWithPrices[]): UseItemsSearchReturn {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    storeId: undefined,
    categoryId: undefined,
    hasPrice: undefined,
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5,
  });

  // Filter items based on search criteria
  const filteredItems = useMemo((): ItemWithPrices[] => {
    let filtered = items;

    // Apply text search
    if (searchFilters.query.trim()) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(item => 
        item.description.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.price_lists.some(price => 
          price.barcode.toLowerCase().includes(query) ||
          price.stores.name.toLowerCase().includes(query)
        )
      );
    }

    // Apply store filter
    if (searchFilters.storeId) {
      filtered = filtered.filter(item =>
        item.price_lists.some(price => price.store_id === searchFilters.storeId)
      );
    }

    // Apply price availability filter
    if (searchFilters.hasPrice !== undefined) {
      filtered = filtered.filter(item =>
        searchFilters.hasPrice ? item.price_lists.length > 0 : item.price_lists.length === 0
      );
    }

    return filtered;
  }, [items, searchFilters]);

  // Calculate pagination
  const paginatedItems = useMemo((): ItemWithPrices[] => {
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage) || 1;
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;

    // Update pagination info
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
    }));

    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, pagination.currentPage, pagination.itemsPerPage]);

  const updateSearchFilters = useCallback((filters: Partial<SearchFilters>): void => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const changePage = useCallback((page: number): void => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  }, [pagination.totalPages]);

  const changeItemsPerPage = useCallback((itemsPerPage: number): void => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1, // Reset to first page
    }));
  }, []);

  const resetSearch = useCallback((): void => {
    setSearchFilters({
      query: '',
      storeId: undefined,
      categoryId: undefined,
      hasPrice: undefined,
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  return {
    filteredItems: paginatedItems,
    searchFilters,
    pagination,
    updateSearchFilters,
    changePage,
    changeItemsPerPage,
    resetSearch,
  };
}
