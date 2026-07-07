"use client";
import { useEffect, useState } from 'react';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Seller {
  _id: string;
  seller_id: string;
  store_name: string;
  kyc_status: string;
  is_suspended: boolean;
  createdAt: string;
  contact_email: string;
}

export default function SellersTable() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchSellers = async () => {
    try {
      const endpoint = filter === 'PENDING' 
        ? '/api/v1/admin/sellers/pending'
        : '/api/v1/admin/sellers';
        
      const res = await api.get(endpoint);
      if (res.data && res.data.success) {
        let data = res.data.sellers;
        if (filter !== 'PENDING' && filter !== 'ALL') {
            data = data.filter((s: Seller) => s.kyc_status === filter);
        }
        setSellers(data);
      }
    } catch (e) {
      console.error('Error fetching sellers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSellers();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/v1/admin/sellers/${id}/status`, { status: newStatus });
      fetchSellers();
    } catch (e) {
      alert('Failed to update seller status');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Store size={20}/> Seller KYC Approvals</h2>
        
        <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                        filter === f 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>
      
      {loading ? (
          <div className="text-center p-8 text-gray-500">Loading sellers...</div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {sellers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No sellers found for this filter.</td>
                    </tr>
                ) : sellers.map(seller => (
                <tr key={seller._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="font-bold text-indigo-700">{seller.store_name}</div>
                        <div className="text-xs text-gray-500">{seller.contact_email || 'No email provided'}</div>
                    </td>
                    <td className="px-6 py-4">
                    {seller.kyc_status === 'APPROVED' ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-200">APPROVED</span>
                    ) : seller.kyc_status === 'REJECTED' ? (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">REJECTED</span>
                    ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-200">PENDING</span>
                    )}
                    </td>
                    <td className="px-6 py-4">
                        {new Date(seller.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        {seller.kyc_status === 'PENDING' && (
                            <>
                                <button 
                                    onClick={() => updateStatus(seller._id, 'APPROVED')}
                                    className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button 
                                    onClick={() => updateStatus(seller._id, 'REJECTED')}
                                    className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            </>
                        )}
                        {seller.kyc_status === 'APPROVED' && !seller.is_suspended && (
                             <button 
                             onClick={() => updateStatus(seller._id, 'SUSPENDED')}
                             className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                         >
                             <XCircle size={14} /> Suspend
                         </button>
                        )}
                        {seller.is_suspended && (
                            <button 
                            onClick={() => updateStatus(seller._id, 'APPROVED')}
                            className="text-xs px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        >
                            <CheckCircle size={14} /> Unsuspend
                        </button>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
