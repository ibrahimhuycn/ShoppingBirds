import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tag } from 'lucide-react';
import { TagsManager } from '@/components/ui/tags-manager';

interface TagsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagsManagerDialog({ 
  open, 
  onOpenChange,
}: TagsManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-5" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            Create, edit, and organize tags for categorizing your items. Tags help you filter and organize your inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TagsManager />
        </div>
      </DialogContent>
    </Dialog>
  );
}
