import { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, X, Plus, Tag as TagIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Item } from '@/types/items';

interface Tag {
  id: number;
  name: string;
  tag_type: string;
  color: string | null;
}

interface ItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  onSave: (data: Partial<Item>) => Promise<void>;
  isLoading: boolean;
}

export function ItemEditDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSave, 
  isLoading 
}: ItemEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);

  const loadAvailableTags = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    }
  };

  const loadItemTags = useCallback(async (): Promise<void> => {
    if (!item?.id) return;

    setIsLoadingTags(true);
    try {
      const { data, error } = await supabase
        .from('item_tags')
        .select(`
          tags (
            id,
            name,
            tag_type,
            color
          )
        `)
        .eq('item_id', item.id);

      if (error) throw error;
      
      const tags = data?.map(item => item.tags).filter(Boolean) as Tag[] || [];
      setItemTags(tags);
    } catch (error) {
      console.error('Error loading item tags:', error);
      toast.error('Failed to load item tags');
    } finally {
      setIsLoadingTags(false);
    }
  }, [item?.id]);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        description: item.description || '',
        title: item.title || '',
        brand: item.brand || '',
        model: item.model || '',
        ean: item.ean || '',
        upc: item.upc || '',
        gtin: item.gtin || '',
        full_description: item.full_description || '',
        category: item.category || '',
        dimension: item.dimension || '',
        weight: item.weight || '',
        lowest_recorded_price: item.lowest_recorded_price || null,
        highest_recorded_price: item.highest_recorded_price || null,
        images: item.images || [],
      });
      loadItemTags();
    }
  }, [item, loadItemTags]);

  // Load available tags and current item tags
  useEffect(() => {
    if (open) {
      loadAvailableTags();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.description?.trim()) return;

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = (): void => {
    setFormData({});
    onOpenChange(false);
  };

  const updateFormData = (field: keyof Item, value: any): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = async (tagId: number): Promise<void> => {
    if (!item?.id) return;

    try {
      const { error } = await supabase
        .from('item_tags')
        .insert({
          item_id: item.id,
          tag_id: tagId,
        });

      if (error) throw error;
      
      await loadItemTags();
      toast.success('Tag added successfully');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const removeTag = async (tagId: number): Promise<void> => {
    if (!item?.id) return;

    try {
      const { error } = await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', item.id)
        .eq('tag_id', tagId);

      if (error) throw error;
      
      await loadItemTags();
      toast.success('Tag removed successfully');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  const getAvailableTagsToAdd = (): Tag[] => {
    return availableTags.filter(tag => 
      !itemTags.some(itemTag => itemTag.id === tag.id)
    );
  };

  const addImageUrl = (): void => {
    const images = formData.images || [];
    updateFormData('images', [...images, '']);
  };

  const updateImageUrl = (index: number, url: string): void => {
    const images = [...(formData.images || [])];
    images[index] = url;
    updateFormData('images', images);
  };

  const removeImageUrl = (index: number): void => {
    const images = [...(formData.images || [])];
    images.splice(index, 1);
    updateFormData('images', images);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5" />
              Edit Item Details
            </DialogTitle>
            <DialogDescription>
              Edit all product information, manage tags, and update item details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Item description"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder="Product title"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => updateFormData('brand', e.target.value)}
                    placeholder="Brand name"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    placeholder="Model number"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description || ''}
                  onChange={(e) => updateFormData('full_description', e.target.value)}
                  placeholder="Detailed product description"
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>

            {/* Product Codes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Codes</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ean">EAN</Label>
                  <Input
                    id="ean"
                    value={formData.ean || ''}
                    onChange={(e) => updateFormData('ean', e.target.value)}
                    placeholder="EAN code"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="upc">UPC</Label>
                  <Input
                    id="upc"
                    value={formData.upc || ''}
                    onChange={(e) => updateFormData('upc', e.target.value)}
                    placeholder="UPC code"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gtin">GTIN</Label>
                  <Input
                    id="gtin"
                    value={formData.gtin || ''}
                    onChange={(e) => updateFormData('gtin', e.target.value)}
                    placeholder="GTIN code"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Physical Properties</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => updateFormData('category', e.target.value)}
                    placeholder="Product category"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dimension">Dimensions</Label>
                  <Input
                    id="dimension"
                    value={formData.dimension || ''}
                    onChange={(e) => updateFormData('dimension', e.target.value)}
                    placeholder="L x W x H"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight || ''}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                    placeholder="Weight with unit"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lowest_price">Lowest Recorded Price</Label>
                  <Input
                    id="lowest_price"
                    type="number"
                    step="0.01"
                    value={formData.lowest_recorded_price || ''}
                    onChange={(e) => updateFormData('lowest_recorded_price', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="highest_price">Highest Recorded Price</Label>
                  <Input
                    id="highest_price"
                    type="number"
                    step="0.01"
                    value={formData.highest_recorded_price || ''}
                    onChange={(e) => updateFormData('highest_recorded_price', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Tags Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TagIcon className="size-5" />
                Tags
              </h3>
              
              {/* Current Tags */}
              <div>
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 min-h-[2.5rem] p-2 border rounded-md">
                  {isLoadingTags ? (
                    <span className="text-sm text-muted-foreground">Loading tags...</span>
                  ) : itemTags.length > 0 ? (
                    itemTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        style={tag.color ? {
                          backgroundColor: tag.color + '20',
                          borderColor: tag.color
                        } : {}}
                      >
                        {tag.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => removeTag(tag.id)}
                          disabled={isLoading}
                        >
                          <X className="size-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags assigned</span>
                  )}
                </div>
              </div>

              {/* Add Tags */}
              {getAvailableTagsToAdd().length > 0 && (
                <div>
                  <Label>Add Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getAvailableTagsToAdd().map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-muted flex items-center gap-1"
                        onClick={() => addTag(tag.id)}
                        style={tag.color ? {
                          backgroundColor: tag.color + '10',
                          borderColor: tag.color
                        } : {}}
                      >
                        <Plus className="size-3" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Images</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageUrl}
                  disabled={isLoading}
                >
                  <Plus className="size-4 mr-2" />
                  Add Image
                </Button>
              </div>
              
              <div className="space-y-2">
                {(formData.images || []).map((imageUrl, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder="Image URL"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImageUrl(index)}
                      disabled={isLoading}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                {(!formData.images || formData.images.length === 0) && (
                  <p className="text-sm text-muted-foreground">No images added</p>
                )}
              </div>
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
              disabled={!formData.description?.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
