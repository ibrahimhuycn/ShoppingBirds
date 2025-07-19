import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { EnhancedPriceManager } from './EnhancedPriceManager';

interface PriceManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemDescription: string;
  onPricesUpdated: () => void;
}

export function PriceManagerDialog({ 
  open, 
  onOpenChange, 
  itemId, 
  itemDescription, 
  onPricesUpdated 
}: PriceManagerDialogProps) {
  const handlePricesUpdated = (): void => {
    onPricesUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Manage Prices
          </DialogTitle>
          <DialogDescription>
            Add, edit, remove prices and view price trends for this item across all stores.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EnhancedPriceManager
            itemId={itemId}
            itemDescription={itemDescription}
            onPricesUpdated={handlePricesUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
