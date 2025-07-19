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
  addPrice: (itemId: number, priceData: PriceFormData) => Promise<void>;
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
      const { data, error } = await supabase
        .from('items')
        .update({ description: item.description.trim() })
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

  const addPrice = useCallback(async (itemId: number, priceData: PriceFormData): Promise<void> => {
    if (!priceData.barcode || !priceData.store_id || !priceData.retail_price || !priceData.unit_id) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .insert({
          item_id: itemId,
          barcode: priceData.barcode,
          store_id: parseInt(priceData.store_id),
          retail_price: parseFloat(priceData.retail_price),
          unit_id: parseInt(priceData.unit_id),
        })
        .select(`
          *,
          stores (name),
          units (unit, description)
        `)
        .single();

      if (error) throw error;

      // Update the item with the new price
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, price_lists: [...item.price_lists, data] }
            : item
        )
      );
      toast.success('Price added successfully');
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error('Failed to add price');
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
    addPrice,
  };
}
