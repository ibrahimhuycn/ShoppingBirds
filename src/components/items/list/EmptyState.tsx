import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function EmptyState({ searchQuery, onClearSearch }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <Package className="size-12 text-muted-foreground mx-auto mb-4" />
        {searchQuery ? (
          <div>
            <p className="text-muted-foreground mb-2">
              No items found matching "{searchQuery}"
            </p>
            {onClearSearch && (
              <Button
                variant="outline"
                onClick={onClearSearch}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No items found. Click the "Add Item" button to create your first item.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
