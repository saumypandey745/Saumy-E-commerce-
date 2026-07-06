// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { useAppStore } from '@/app/store';
import { 
  ShoppingCart, 
  Search, 
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  Package,
  Truck
} from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/api/v1/orders/seller');
        if (res.data.success && res.data.items) {
          // Flatten or format the items as needed
          setOrders(res.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const res = await api.put(`/api/v1/orders/seller/${itemId}/status`, { status: newStatus });
      if (res.data.success) {
        setOrders(orders.map(o => o.id === itemId ? { ...o, fulfillment_status: newStatus } : o));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock className="w-3 h-3 mr-1" />;
      case 'PROCESSING': return <Package className="w-3 h-3 mr-1" />;
      case 'SHIPPED': return <Truck className="w-3 h-3 mr-1" />;
      case 'DELIVERED': return <CheckCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and fulfill your customer orders</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or SKU..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Order Item</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{item.sku}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Order #{item.order_id.substring(0,8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      x{item.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.fulfillment_status)}`}>
                        {getStatusIcon(item.fulfillment_status)}
                        {item.fulfillment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={item.fulfillment_status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">When customers buy your products, the orders will appear here.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
