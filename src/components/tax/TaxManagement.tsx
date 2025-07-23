import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Percent, 
  Star, 
  AlertCircle,
  Save,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getAllTaxTypes } from '@/lib/tax-service';
import type { TaxType, TaxFormData, TaxManagementProps } from '@/types/tax';

export function TaxManagement({ onTaxesUpdated }: TaxManagementProps) {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingTax, setEditingTax] = useState<TaxType | null>(null);
  const [deletingTax, setDeletingTax] = useState<TaxType | null>(null);
  const [formData, setFormData] = useState<TaxFormData>({
    name: '',
    description: '',
    percentage: '',
    isActive: true,
    isDefault: false
  });

  const loadTaxTypes = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await getAllTaxTypes();
      setTaxTypes(data);
    } catch (error) {
      console.error('Error loading tax types:', error);
      toast.error('Failed to load tax types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxTypes();
  }, [loadTaxTypes]);

  const resetForm = (): void => {
    setFormData({
      name: '',
      description: '',
      percentage: '',
      isActive: true,
      isDefault: false
    });
    setEditingTax(null);
    setIsDialogOpen(false);
  };

  const handleAddTax = (): void => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditTax = (tax: TaxType): void => {
    setFormData({
      name: tax.name,
      description: tax.description || '',
      percentage: tax.percentage.toString(),
      isActive: tax.is_active,
      isDefault: tax.is_default
    });
    setEditingTax(tax);
    setIsDialogOpen(true);
  };

  const handleDeleteTax = (tax: TaxType): void => {
    setDeletingTax(tax);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deletingTax) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tax_types')
        .delete()
        .eq('id', deletingTax.id);

      if (error) throw error;

      await loadTaxTypes();
      onTaxesUpdated();
      toast.success('Tax type deleted successfully');
    } catch (error) {
      console.error('Error deleting tax type:', error);
      toast.error('Failed to delete tax type');
    } finally {
      setIsLoading(false);
      setDeletingTax(null);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name || !formData.percentage) {
      toast.error('Please fill in all required fields');
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }

    setIsLoading(true);
    try {
      const taxData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        percentage: percentage,
        is_active: formData.isActive,
        is_default: formData.isDefault
      };

      if (editingTax) {
        // Update existing tax type
        const { error } = await supabase
          .from('tax_types')
          .update(taxData)
          .eq('id', editingTax.id);

        if (error) throw error;
        toast.success('Tax type updated successfully');
      } else {
        // Create new tax type
        const { error } = await supabase
          .from('tax_types')
          .insert(taxData);

        if (error) throw error;
        toast.success('Tax type created successfully');
      }

      await loadTaxTypes();
      onTaxesUpdated();
      resetForm();
    } catch (error) {
      console.error('Error saving tax type:', error);
      toast.error('Failed to save tax type');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaxStatus = async (tax: TaxType): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tax_types')
        .update({ is_active: !tax.is_active })
        .eq('id', tax.id);

      if (error) throw error;

      await loadTaxTypes();
      onTaxesUpdated();
      toast.success(`Tax type ${!tax.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling tax status:', error);
      toast.error('Failed to update tax status');
    } finally {
      setIsLoading(false);
    }
  };

  const setAsDefault = async (tax: TaxType): Promise<void> => {
    if (tax.is_default) return;

    setIsLoading(true);
    try {
      // First, remove default status from all other tax types
      const { error: clearError } = await supabase
        .from('tax_types')
        .update({ is_default: false })
        .neq('id', tax.id);

      if (clearError) throw clearError;

      // Then set the selected tax as default
      const { error: setError } = await supabase
        .from('tax_types')
        .update({ is_default: true })
        .eq('id', tax.id);

      if (setError) throw setError;

      await loadTaxTypes();
      onTaxesUpdated();
      toast.success(`"${tax.name}" set as default tax type`);
    } catch (error) {
      console.error('Error setting default tax:', error);
      toast.error('Failed to set default tax type');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof TaxFormData, value: string | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = (): boolean => {
    return !!(formData.name.trim() && formData.percentage.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="size-6" />
            Tax Management
          </h2>
          <p className="text-muted-foreground">
            Manage tax types and their configurations
          </p>
        </div>
        <Button onClick={handleAddTax} disabled={isLoading}>
          <Plus className="size-4 mr-2" />
          Add Tax Type
        </Button>
      </div>

      {/* Tax Types List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="size-5" />
            Tax Types ({taxTypes.length})
          </CardTitle>
          <CardDescription>
            Configure and manage all tax types in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxTypes.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No tax types found</p>
              <Button onClick={handleAddTax} disabled={isLoading}>
                <Plus className="size-4 mr-2" />
                Create First Tax Type
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {taxTypes.map((tax) => (
                <div
                  key={tax.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{tax.name}</span>
                        <Badge 
                          variant={tax.is_active ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {tax.percentage}%
                        </Badge>
                        {tax.is_default && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="size-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!tax.is_active && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {tax.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {tax.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!tax.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(tax)}
                        disabled={isLoading}
                        title="Set as default"
                      >
                        <Star className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTaxStatus(tax)}
                      disabled={isLoading}
                      title={tax.is_active ? "Deactivate" : "Activate"}
                    >
                      {tax.is_active ? (
                        <CheckCircle className="size-4" />
                      ) : (
                        <AlertCircle className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTax(tax)}
                      disabled={isLoading}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTax(tax)}
                      disabled={isLoading || tax.is_default}
                      title={tax.is_default ? "Cannot delete default tax type" : "Delete tax type"}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Tax Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="size-5" />
              {editingTax ? 'Edit Tax Type' : 'Add Tax Type'}
            </DialogTitle>
            <DialogDescription>
              {editingTax ? 'Update the tax type information' : 'Create a new tax type configuration'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., GST 10%"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Optional description of this tax type"
                disabled={isLoading}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="percentage">Percentage *</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percentage}
                onChange={(e) => updateFormData('percentage', e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Whether this tax type is available for use
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateFormData('isActive', checked)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Tax</Label>
                  <p className="text-sm text-muted-foreground">
                    Use this tax when no specific taxes are assigned
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => updateFormData('isDefault', checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isLoading}
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              <Save className="size-4 mr-2" />
              {isLoading ? 'Saving...' : editingTax ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTax} onOpenChange={() => setDeletingTax(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTax?.name}"? 
              This action cannot be undone and may affect existing price configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
