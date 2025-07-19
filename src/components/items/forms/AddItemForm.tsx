import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AddItemFormProps, AddItemFormData } from '@/types/items';

export function AddItemForm({ onSubmit, onCancel, isLoading }: AddItemFormProps) {
  const [formData, setFormData] = useState<AddItemFormData>({
    description: '',
  });

  const handleSubmit = async (): Promise<void> => {
    if (!formData.description.trim()) return;
    
    try {
      await onSubmit(formData);
      setFormData({ description: '' });
    } catch (error) {
      // Error is handled in the hook
      console.error('Form submission error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Item</CardTitle>
        <CardDescription>
          Manually add an item by entering its description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ description: e.target.value })}
            onKeyDown={handleKeyPress}
            placeholder="Enter item description"
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!formData.description.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
