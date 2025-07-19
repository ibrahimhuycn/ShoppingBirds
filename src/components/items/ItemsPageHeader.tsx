import { Button } from '@/components/ui/button';
import { Plus, Scan, Package, Tag } from 'lucide-react';

interface ItemsPageHeaderProps {
  onAddItem: () => void;
  onAddWithUPC: () => void;
  onAddEnhanced: () => void;
  onToggleTagsManager: () => void;
  showTagsManager: boolean;
  isLoading: boolean;
}

export function ItemsPageHeader({
  onAddItem,
  onAddWithUPC,
  onAddEnhanced,
  onToggleTagsManager,
  showTagsManager,
  isLoading,
}: ItemsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Items</h1>
      <div className="flex gap-2">
        <Button
          onClick={onToggleTagsManager}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <Tag className="size-4 mr-2" />
          {showTagsManager ? 'Hide Tags' : 'Manage Tags'}
        </Button>
        <Button
          onClick={onAddWithUPC}
          disabled={isLoading}
          variant="outline"
        >
          <Scan className="size-4 mr-2" />
          Scan UPC
        </Button>
        <Button
          onClick={onAddEnhanced}
          disabled={isLoading}
          variant="outline"
        >
          <Package className="size-4 mr-2" />
          Add Enhanced
        </Button>
        <Button
          onClick={onAddItem}
          disabled={isLoading}
        >
          <Plus className="size-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
