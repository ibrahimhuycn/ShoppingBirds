import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { PriceManager } from '@/components/ui/price-manager';

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Manage Prices - {itemDescription}
          </DialogTitle>
          <DialogDescription>
            View, edit, and manage all pricing information for this item across different stores.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PriceManager
            itemId={itemId}
            itemDescription={itemDescription}
            onPricesUpdated={handlePricesUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
