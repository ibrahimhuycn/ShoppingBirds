import { ItemCard } from './ItemCard';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { ItemListProps } from '@/types/items';

export function ItemList({ 
  items, 
  onItemEdit, 
  onItemDelete, 
  onManagePrices,
  onViewDetails, 
  isLoading 
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No items found. Click the "Add Item" button to create your first item.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
          onManagePrices={onManagePrices}
          onViewDetails={onViewDetails}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
