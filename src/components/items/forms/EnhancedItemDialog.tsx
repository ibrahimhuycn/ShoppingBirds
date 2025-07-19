import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { EnhancedItemForm } from '@/components/ui/enhanced-item-form';
import type { Item } from '@/types/items';

interface EnhancedItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  item?: Item;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function EnhancedItemDialog({ 
  open, 
  onOpenChange, 
  mode, 
  item, 
  onSave, 
  isLoading 
}: EnhancedItemDialogProps) {
  const handleSave = async (data: any): Promise<void> => {
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            {mode === 'create' ? 'Add Enhanced Item' : 'Edit Item Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new item with detailed product information, images, and tags.'
              : 'Edit the detailed product information for this item.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EnhancedItemForm
            mode={mode}
            item={item}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
