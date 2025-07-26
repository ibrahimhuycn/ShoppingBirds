import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SafeHtml } from '@/components/ui/safe-html';
import { Package, Tag, ExternalLink, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ItemWithPrices } from '@/types/items';

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemWithPrices;
}

export function ItemDetailsDialog({ 
  open, 
  onOpenChange, 
  item 
}: ItemDetailsDialogProps): JSX.Element {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            {item.title || item.description}
          </DialogTitle>
          <DialogDescription>
            Detailed product information and specifications
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Product Images */}
          {item.images && item.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Images</h3>
              <div className="grid gap-4">
                {/* Main Image */}
                <div className="flex justify-center">
                  <img
                    src={item.images[selectedImageIndex]}
                    alt={item.title || item.description}
                    className="max-w-full max-h-64 object-contain rounded border"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Image Thumbnails */}
                {item.images.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {item.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-16 h-16 border-2 rounded overflow-hidden ${
                          selectedImageIndex === index 
                            ? 'border-primary' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p><strong>Description:</strong> {item.description}</p>
                {item.title && <p><strong>Title:</strong> {item.title}</p>}
                {item.brand && <p><strong>Brand:</strong> {item.brand}</p>}
                {item.model && <p><strong>Model:</strong> {item.model}</p>}
                {item.category && <p><strong>Category:</strong> {item.category}</p>}
              </div>
              <div className="space-y-2">
                {item.dimension && <p><strong>Dimensions:</strong> {item.dimension}</p>}
                {item.weight && <p><strong>Weight:</strong> {item.weight}</p>}
                {item.asin && <p><strong>ASIN:</strong> {item.asin}</p>}
                <p><strong>Item ID:</strong> {item.id}</p>
              </div>
            </div>
          </div>

          {/* Product Codes */}
          {(item.ean || item.upc || item.gtin) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Codes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {item.ean && (
                  <div className="flex items-center gap-2">
                    <strong>EAN:</strong>
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {item.ean}
                    </code>
                  </div>
                )}
                {item.upc && (
                  <div className="flex items-center gap-2">
                    <strong>UPC:</strong>
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {item.upc}
                    </code>
                  </div>
                )}
                {item.gtin && (
                  <div className="flex items-center gap-2">
                    <strong>GTIN:</strong>
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {item.gtin}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Description */}
          {item.full_description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Description</h3>
              <div className="p-4 bg-muted/30 rounded-lg">
                <SafeHtml 
                  content={item.full_description}
                  className="text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {item.item_tags && item.item_tags.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="size-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.item_tags.map((itemTag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm"
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

          {/* Price Information */}
          {(item.lowest_recorded_price || item.highest_recorded_price) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historical Price Range</h3>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  {item.lowest_recorded_price && (
                    <div>
                      <span className="text-sm text-muted-foreground">Lowest:</span>
                      <span className="ml-2 text-lg font-semibold text-green-600">
                        {formatCurrency(item.lowest_recorded_price)}
                      </span>
                    </div>
                  )}
                  {item.highest_recorded_price && (
                    <div>
                      <span className="text-sm text-muted-foreground">Highest:</span>
                      <span className="ml-2 text-lg font-semibold text-red-600">
                        {formatCurrency(item.highest_recorded_price)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <Info className="size-3 inline mr-1" />
                  Historical price range from market data
                </p>
              </div>
            </div>
          )}

          {/* Current Prices */}
          {item.price_lists.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Store Prices</h3>
              <div className="space-y-3">
                {item.price_lists.map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{price.stores.name}</span>
                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                          {price.barcode}
                        </code>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per {price.units.unit}
                        {price.units.description !== price.units.unit && (
                          <span className="ml-1">({price.units.description})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xl font-semibold">
                        {formatCurrency(price.retail_price)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated: {formatDate(price.updated_at || price.created_at || '')}
                      </div>
                      {price.price_effective_date && (
                        <div className="text-xs text-muted-foreground">
                          Effective: {new Date(price.price_effective_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Created:</strong> {formatDate(item.created_at || '')}
              </div>
              {item.updated_at && (
                <div>
                  <strong>Last Updated:</strong> {formatDate(item.updated_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ItemDetailsDialog;
