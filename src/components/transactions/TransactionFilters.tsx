import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, X, Calendar } from "lucide-react";
import { useI18n } from "@/contexts/translation-context";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { TransactionFilters, TransactionSearchOptions } from "@/types/transactions";
import type { Store } from "@/types/transactions";

type SimpleStore = Pick<Store, 'id' | 'name'>;

interface TransactionFiltersProps {
  searchOptions: TransactionSearchOptions;
  onOptionsChange: (options: Partial<TransactionSearchOptions>) => void;
  isLoading?: boolean;
}

export function TransactionFiltersComponent({ 
  searchOptions, 
  onOptionsChange,
  isLoading = false 
}: TransactionFiltersProps): JSX.Element {
  const { t } = useI18n();
  const [stores, setStores] = useState<SimpleStore[]>([]);
  const [localSearch, setLocalSearch] = useState<string>(searchOptions.filters.search || '');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const handleSearchChange = (value: string): void => {
    setLocalSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onOptionsChange({
      filters: { ...searchOptions.filters, search: localSearch || undefined }
    });
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any): void => {
    onOptionsChange({
      filters: { ...searchOptions.filters, [key]: value || undefined }
    });
  };

  const handleSortChange = (sortBy: TransactionSearchOptions['sortBy']): void => {
    onOptionsChange({ sortBy });
  };

  const handleSortOrderChange = (sortOrder: TransactionSearchOptions['sortOrder']): void => {
    onOptionsChange({ sortOrder });
  };

  const clearFilters = (): void => {
    setLocalSearch('');
    onOptionsChange({
      filters: {},
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1
    });
  };

  const hasActiveFilters = (): boolean => {
    const filters = searchOptions.filters;
    return !!(filters.search || filters.storeId || filters.dateFrom || filters.dateTo || 
              filters.minAmount || filters.maxAmount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5" />
          {t('transactions.searchTransactions')}
        </CardTitle>
        <CardDescription>
          Filter and search through your transaction history
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <Label htmlFor="search">{t('common.search')}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="search"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('transactions.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {t('common.search')}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Store Filter */}
          <div className="space-y-2">
            <Label>{t('transactions.filterByStore')}</Label>
            <Select
              value={searchOptions.filters.storeId?.toString() || 'all'}
              onValueChange={(value) => handleFilterChange('storeId', value === 'all' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.allStores')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allStores')}</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">{t('transactions.dateFrom')}</Label>
            <Input
              id="dateFrom"
              type="date"
              value={searchOptions.filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo">{t('transactions.dateTo')}</Label>
            <Input
              id="dateTo"
              type="date"
              value={searchOptions.filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>{t('transactions.sortBy')}</Label>
            <Select
              value={searchOptions.sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t('transactions.sortByDate')}</SelectItem>
                <SelectItem value="total">{t('transactions.sortByTotal')}</SelectItem>
                <SelectItem value="number">{t('transactions.sortByInvoice')}</SelectItem>
                <SelectItem value="store">{t('transactions.sortByStore')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Min Amount */}
          <div className="space-y-2">
            <Label htmlFor="minAmount">Min Amount</Label>
            <Input
              id="minAmount"
              type="number"
              step="0.01"
              value={searchOptions.filters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-2">
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
              id="maxAmount"
              type="number"
              step="0.01"
              value={searchOptions.filters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select
              value={searchOptions.sortOrder}
              onValueChange={handleSortOrderChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('transactions.descending')}</SelectItem>
                <SelectItem value="asc">{t('transactions.ascending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <div className="flex justify-end">
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="size-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
