"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ModerationQueue() {
  const [products, setProducts] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/v1/products/moderation/pending');
      setProducts(res.data.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/api/v1/products/moderation/${id}/${action}`, action === 'reject' ? { notes: 'Does not meet community guidelines' } : {});
      fetchPending();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold text-gray-800">Moderation Queue</h1>
         <Link href="/" className="text-indigo-600 font-medium hover:underline">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Product Title</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Price</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{p.title}</td>
                <td className="p-4 text-gray-600">${p.base_price.toFixed(2)}</td>
                <td className="p-4 space-x-2">
                  <button 
                    onClick={() => handleAction(p._id, 'approve')} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(p._id, 'reject')} 
                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={3} className="p-12 text-center text-gray-500">No pending products require moderation. Good job!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
