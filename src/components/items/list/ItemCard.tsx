import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, DollarSign, Scan, AlertCircle, Info } from 'lucide-react';
import { MoneyDisplay } from '@/components/currency';
import { formatCurrency } from '@/lib/utils';
import type { ItemCardProps } from '@/types/items';

export function ItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onManagePrices, 
  isLoading 
}: ItemCardProps) {
  const handleDelete = (): void => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              onClick={() => onEdit(item)}
              disabled={isLoading}
            >
              <Edit className="size-4 mr-1" />
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
                  <span className="ml-1 text-xs opacity-75">(Historical)</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price Lists */}
        {item.price_lists.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              Current Prices
              <Badge variant="outline" className="text-xs">
                {item.price_lists.length} {item.price_lists.length === 1 ? 'store' : 'stores'}
              </Badge>
            </h4>
            <div className="grid gap-2">
              {item.price_lists.map((price) => {
                const currencyId = price.currency_id || price.currencies?.id;
                const hasValidCurrency = currencyId && price.currencies;
                
                return (
                  <div key={price.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{price.barcode}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{price.stores.name}</span>
                        <span className="text-xs text-muted-foreground">
                          per {price.units.unit}
                          {price.units.description !== price.units.unit && (
                            <span className="ml-1">({price.units.description})</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {hasValidCurrency ? (
                          <MoneyDisplay 
                            amount={price.retail_price} 
                            currencyId={currencyId}
                          />
                        ) : (
                          <span className="flex items-center gap-1" title="Currency not configured">
                            {formatCurrency(price.retail_price, price.currency || 'USD')}
                            <AlertCircle className="size-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="size-3" />
                        <span>Base price (before tax)</span>
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
                );
              })}
            </div>
            
            {/* Price Summary */}
            <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Info className="size-3" />
                <span>
                  Prices shown are base amounts before tax. Final prices may include store-specific taxes.
                  Click "Manage Prices" to configure taxes and view final pricing.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <DollarSign className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              No prices set for this item
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManagePrices(item.id)}
              disabled={isLoading}
            >
              <DollarSign className="size-4 mr-1" />
              Add First Price
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
