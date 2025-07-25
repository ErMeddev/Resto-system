import { useState, useEffect } from 'react';
import { supabase, Order, OrderItem } from '../lib/supabase';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderItems: { menuItemId: string; quantity: number; price: number }[]) => {
    try {
      const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ total })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      await fetchTodayOrders();
      return order;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'حدث خطأ في إنشاء الطلب');
    }
  };

  useEffect(() => {
    fetchTodayOrders();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          fetchTodayOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { orders, loading, error, createOrder, refetch: fetchTodayOrders };
}