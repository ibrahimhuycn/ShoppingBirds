import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  ItemWithPrices, 
  Store, 
  Unit,
  AddItemFormData,
  PriceFormData,
  Item
} from '@/types/items';

export interface UseItemsReturn {
  items: ItemWithPrices[];
  stores: Store[];
  units: Unit[];
  isLoading: boolean;
  loadItems: () => Promise<void>;
  loadStores: () => Promise<void>;
  loadUnits: () => Promise<void>;
  addItem: (data: AddItemFormData) => Promise<void>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
}

export function useItems(): UseItemsReturn {
  const [items, setItems] = useState<ItemWithPrices[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadItems = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          price_lists (
            *,
            stores (name),
            units (unit, description)
          ),
          item_tags (
            tags (
              id,
              name,
              tag_type,
              color
            )
          )
        `)
        .order('description');

      if (error) throw error;
      setItems((data || []) as ItemWithPrices[]);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStores = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Failed to load stores');
    }
  }, []);

  const loadUnits = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('unit');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error loading units:', error);
      toast.error('Failed to load units');
    }
  }, []);

  const addItem = useCallback(async (data: AddItemFormData): Promise<void> => {
    if (!data.description.trim()) return;

    setIsLoading(true);
    try {
      const { data: newItemData, error } = await supabase
        .from('items')
        .insert({ description: data.description.trim() })
        .select()
        .single();

      if (error) throw error;

      const newItem: ItemWithPrices = {
        ...newItemData,
        price_lists: [],
      };

      setItems(prevItems => [...prevItems, newItem]);
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (item: Item): Promise<void> => {
    if (!item.description.trim()) return;

    setIsLoading(true);
    try {
      // Prepare update data, excluding read-only fields like id, created_at, updated_at
      const updateData = {
        description: item.description.trim(),
        title: item.title || null,
        brand: item.brand || null,
        model: item.model || null,
        ean: item.ean || null,
        upc: item.upc || null,
        gtin: item.gtin || null,
        asin: item.asin || null,
        full_description: item.full_description || null,
        category: item.category || null,
        dimension: item.dimension || null,
        weight: item.weight || null,
        lowest_recorded_price: item.lowest_recorded_price,
        highest_recorded_price: item.highest_recorded_price,
        images: item.images || null,
      };

      const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      setItems(prevItems => 
        prevItems.map(i => i.id === item.id ? { ...i, ...data } : i)
      );
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (itemId: number): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prevItems => prevItems.filter(i => i.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    items,
    stores,
    units,
    isLoading,
    loadItems,
    loadStores,
    loadUnits,
    addItem,
    updateItem,
    deleteItem,
  };
}
