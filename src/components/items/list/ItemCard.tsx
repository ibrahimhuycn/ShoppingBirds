import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, DollarSign, Scan } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { ItemCardProps, Item } from '@/types/items';

export function ItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onAddPrice, 
  onManagePrices, 
  isLoading 
}: ItemCardProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<string>(item.description);

  const handleEdit = (): void => {
    if (isEditing) {
      const updatedItem: Item = { ...item, description: editingDescription };
      onEdit(updatedItem);
      setIsEditing(false);
    } else {
      setEditingDescription(item.description);
      setIsEditing(true);
    }
  };

  const handleCancel = (): void => {
    setEditingDescription(item.description);
    setIsEditing(false);
  };

  const handleDelete = (): void => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-purple-500">
              <Package className="size-5 text-white" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="text-lg font-semibold"
                  disabled={isLoading}
                />
              ) : (
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {item.title || item.description}
                    {(item.ean || item.upc || item.gtin) && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                        <Scan className="size-3 mr-1" />
                        UPC
                      </span>
                    )}
                  </CardTitle>
                  <div className="space-y-1">
                    <CardDescription>
                      ID: {item.id}
                      {item.brand && ` • Brand: ${item.brand}`}
                      {item.model && ` • Model: ${item.model}`}
                    </CardDescription>
                    {(item.ean || item.upc || item.gtin) && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.ean && `EAN: ${item.ean}`}
                        {item.upc && (item.ean ? ` • UPC: ${item.upc}` : `UPC: ${item.upc}`)}
                        {item.gtin && (item.ean || item.upc ? ` • GTIN: ${item.gtin}` : `GTIN: ${item.gtin}`)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Product Image */}
            {item.images && item.images.length > 0 && (
              <div className="ml-3">
                <img
                  src={item.images[0]}
                  alt={item.title || item.description}
                  className="w-16 h-16 object-cover rounded border"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editingDescription.trim() || isLoading}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onManagePrices(item.id)}
                  disabled={isLoading}
                >
                  <DollarSign className="size-4 mr-1" />
                  Manage Prices
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddPrice(item.id)}
                  disabled={isLoading}
                >
                  <DollarSign className="size-4 mr-1" />
                  Add Price
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Edit className="size-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Product Information */}
        {(item.full_description || item.category || item.dimension || item.weight || (item.item_tags && item.item_tags.length > 0)) && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            {item.full_description && (
              <div className="mb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.full_description}
                </p>
              </div>
            )}
            
            {/* Tags */}
            {item.item_tags && item.item_tags.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-muted-foreground mb-2">TAGS</h5>
                <div className="flex flex-wrap gap-1">
                  {item.item_tags.map((itemTag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs"
                      style={itemTag.tags.color ? {
                        backgroundColor: itemTag.tags.color + '20',
                        borderColor: itemTag.tags.color
                      } : {}}
                    >
                      {itemTag.tags.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {item.category && (
                <span>Category: {item.category}</span>
              )}
              {item.dimension && (
                <span>Dimensions: {item.dimension}</span>
              )}
              {item.weight && (
                <span>Weight: {item.weight}</span>
              )}
              {item.currency && (item.lowest_recorded_price || item.highest_recorded_price) && (
                <span>
                  Price Range: 
                  {item.lowest_recorded_price && formatCurrency(item.lowest_recorded_price, item.currency)}
                  {item.lowest_recorded_price && item.highest_recorded_price && ' - '}
                  {item.highest_recorded_price && formatCurrency(item.highest_recorded_price, item.currency)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price Lists */}
        {item.price_lists.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-3">Price List</h4>
            <div className="grid gap-2">
              {item.price_lists.map((price) => (
                <div key={price.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm">{price.barcode}</span>
                    <span className="text-sm">{price.stores.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {price.units.unit} - {price.units.description}
                    </span>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(price.retail_price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No prices set for this item. Click "Add Price" to add pricing information.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
