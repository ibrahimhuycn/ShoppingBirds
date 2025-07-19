import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scan } from 'lucide-react';
import { UPCLookupComponent } from '@/components/ui/upc-lookup';
import type { UPCLookupProps } from '@/types/items';

export function UPCLookupForm({ 
  onProductFound, 
  onProductNotFound, 
  onCancel, 
  isLoading 
}: UPCLookupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="size-5" />
          Add Item with UPC/EAN Barcode
        </CardTitle>
        <CardDescription>
          Scan or enter a UPC/EAN barcode to automatically fetch product information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UPCLookupComponent
          onProductFound={onProductFound}
          onProductNotFound={onProductNotFound}
          disabled={isLoading}
        />
        <div className="mt-4 flex justify-end">
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
