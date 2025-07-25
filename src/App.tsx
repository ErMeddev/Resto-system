import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, TrendingUp, DollarSign, Users, Loader2, AlertCircle } from 'lucide-react';
import { useMenuItems } from './hooks/useMenuItems';
import { useOrders } from './hooks/useOrders';
import { MenuItem } from './lib/supabase';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

function App() {
  const { menuItems, loading: menuLoading, error: menuError } = useMenuItems();
  const { orders, createOrder, loading: ordersLoading } = useOrders();
  const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addToOrder = (menuItem: MenuItem) => {
    setCurrentOrder(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromOrder = (menuItemId: string) => {
    setCurrentOrder(prev => {
      return prev.map(item =>
        item.menuItem.id === menuItemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0);
    });
  };

  const getTotalPrice = () => {
    return currentOrder.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const confirmOrder = async () => {
    if (currentOrder.length === 0) return;

    try {
      setSubmitting(true);
      const orderItems = currentOrder.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price
      }));

      await createOrder(orderItems);
      setCurrentOrder([]);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('حدث خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTodayStats = () => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const totalItemsSold = menuItems.reduce((sum, item) => sum + item.sold_today, 0);
    
    return { totalRevenue, totalOrders, totalItemsSold };
  };

  if (menuLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (menuError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطأ في الاتصال</h2>
          <p className="text-gray-600 mb-4">{menuError}</p>
          <p className="text-sm text-gray-500">تأكد من الاتصال بقاعدة البيانات</p>
        </div>
      </div>
    );
  }

  const { totalRevenue, totalOrders, totalItemsSold } = getTodayStats();
  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-red-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              نظام إدارة المطعم
            </h1>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              الإحصائيات
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">إجمالي المبيعات</p>
                  <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} درهم</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </div>
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">عدد الطلبات</p>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
                <ShoppingCart className="h-12 w-12 text-blue-200" />
              </div>
            </div>
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">المواد المباعة</p>
                  <p className="text-3xl font-bold">{totalItemsSold}</p>
                </div>
                <Users className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">قائمة الطعام</h2>
            
            {categories.map(category => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold text-red-600 mb-4 pb-2 border-b-2 border-red-200">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow border border-gray-100"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-lg">{item.name}</h4>
                            <p className="text-red-600 font-bold text-xl">{item.price} درهم</p>
                            <p className="text-sm text-gray-500">مباع اليوم: {item.sold_today}</p>
                          </div>
                          <button
                            onClick={() => addToOrder(item)}
                            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Current Order */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">الطلب الحالي</h3>
              
              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد عناصر في الطلب</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {currentOrder.map(item => (
                      <div key={item.menuItem.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.menuItem.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.menuItem.price} × {item.quantity} = {(item.menuItem.price * item.quantity).toFixed(2)} درهم
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromOrder(item.menuItem.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToOrder(item.menuItem)}
                            className="bg-green-100 hover:bg-green-200 text-green-600 p-1 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-gray-800">المجموع:</span>
                      <span className="text-2xl font-bold text-red-600">{getTotalPrice().toFixed(2)} درهم</span>
                    </div>
                    
                    <button
                      onClick={confirmOrder}
                      disabled={submitting}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        'تأكيد الطلب'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;