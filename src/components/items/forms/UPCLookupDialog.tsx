import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
import { UPCLookupComponent } from '@/components/ui/upc-lookup';
import type { EnhancedProductData } from '@/lib/product-enhancement';

interface UPCLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (data: EnhancedProductData) => Promise<void>;
  onProductNotFound: (upc: string) => void;
  isLoading: boolean;
}

export function UPCLookupDialog({ 
  open, 
  onOpenChange, 
  onProductFound, 
  onProductNotFound, 
  isLoading 
}: UPCLookupDialogProps) {
  const handleCancel = (): void => {
    onOpenChange(false);
  };

  const handleProductFound = async (data: EnhancedProductData): Promise<void> => {
    try {
      await onProductFound(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Product creation error:', error);
    }
  };

  const handleProductNotFound = (upc: string): void => {
    onProductNotFound(upc);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="size-5" />
            Add Item with UPC/EAN Barcode
          </DialogTitle>
          <DialogDescription>
            Scan or enter a UPC/EAN barcode to automatically fetch product information and create an item.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <UPCLookupComponent
            onProductFound={handleProductFound}
            onProductNotFound={handleProductNotFound}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
