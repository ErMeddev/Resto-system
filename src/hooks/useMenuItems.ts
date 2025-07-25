import { useState, useEffect } from 'react';
import { supabase, MenuItem } from '../lib/supabase';

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('menu_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { menuItems, loading, error, refetch: fetchMenuItems };
}