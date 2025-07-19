import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { AddItemFormData } from '@/types/items';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddItemFormData) => Promise<void>;
  isLoading: boolean;
}

export function AddItemDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: AddItemDialogProps) {
  const [formData, setFormData] = useState<AddItemFormData>({
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.description.trim()) return;
    
    try {
      await onSubmit(formData);
      setFormData({ description: '' });
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = (): void => {
    setFormData({ description: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Manually add an item by entering its description. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="description">Item Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ description: e.target.value })}
                placeholder="Enter item description"
                disabled={isLoading}
                required
              />
            </div>
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
            <Button
              type="submit"
              disabled={!formData.description.trim() || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
