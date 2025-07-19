import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { SearchBarProps } from '@/types/items';

export function SearchBar({
  searchFilters,
  onFiltersChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  filteredItems,
}: SearchBarProps) {
  const handleQueryChange = (query: string): void => {
    onFiltersChange({ ...searchFilters, query });
  };

  const clearSearch = (): void => {
    onFiltersChange({ 
      query: '',
      storeId: undefined,
      categoryId: undefined,
      hasPrice: undefined,
    });
  };

  const hasActiveFilters = (): boolean => {
    return (
      searchFilters.query.length > 0 ||
      searchFilters.storeId !== undefined ||
      searchFilters.categoryId !== undefined ||
      searchFilters.hasPrice !== undefined
    );
  };

  return (
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
            <label className="text-sm font-medium">Search Items</label>
            <div className="relative">
              <Input
                value={searchFilters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by item name, barcode, brand, or store..."
                className="w-full pr-10"
              />
              {searchFilters.query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQueryChange('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Items per page selector */}
          <div>
            <label className="text-sm font-medium">Items per page</label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 items</SelectItem>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              onClick={clearSearch}
            >
              <X className="size-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Results summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredItems} of {totalItems} items
          {searchFilters.query && ` (filtered by "${searchFilters.query}")`}
        </div>
      </CardContent>
    </Card>
  );
}
