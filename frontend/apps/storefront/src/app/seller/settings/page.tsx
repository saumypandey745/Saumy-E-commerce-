// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/SellerDashboardLayout';
import { api } from '@/lib/api';
import { useAppStore } from '@/app/store';
import { 
  Settings as SettingsIcon,
  Store,
  UploadCloud,
  CheckCircle,
  Loader2,
  Save,
  ShieldAlert
} from 'lucide-react';

export default function SettingsPage() {
  const { user, storeProfile, setStoreProfile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    return_policy: '',
    shipping_policy: ''
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/api/sellers/store');
        if (res.data.success && res.data.store) {
          setStoreProfile(res.data.store);
          setFormData({
            store_name: res.data.store.store_name || '',
            description: res.data.store.description || '',
            contact_email: res.data.store.contact_email || '',
            contact_phone: res.data.store.contact_phone || '',
            return_policy: res.data.store.return_policy || '',
            shipping_policy: res.data.store.shipping_policy || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch store profile', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStore();
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await api.put('/api/sellers/store', formData);
      if (res.data.success) {
        setStoreProfile(res.data.store);
        setMessage('Store profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Failed to update store profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your store profile and verifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-500" /> Store Information
              </h2>
              <button 
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-medium transition-colors gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                {message}
              </div>
            )}

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={formData.store_name}
                    onChange={e => setFormData({...formData, store_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Store Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => setFormData({...formData, contact_email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Return Policy</label>
                  <textarea
                    rows={2}
                    value={formData.return_policy}
                    onChange={e => setFormData({...formData, return_policy: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    placeholder="e.g. 30 days return window..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shipping Policy</label>
                  <textarea
                    rows={2}
                    value={formData.shipping_policy}
                    onChange={e => setFormData({...formData, shipping_policy: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    placeholder="e.g. Ships within 2 business days..."
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> Verification Status
            </h2>
            
            {loading ? (
              <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full animate-pulse"></div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                  storeProfile?.kyc_status === 'VERIFIED' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-800/30 text-green-700 dark:text-green-400' 
                    : storeProfile?.kyc_status === 'PENDING'
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-800/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-800/30 text-red-700 dark:text-red-400'
                }`}>
                  {storeProfile?.kyc_status === 'VERIFIED' ? <CheckCircle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  <div>
                    <p className="font-semibold text-sm">KYC Status</p>
                    <p className="text-xs mt-0.5">{storeProfile?.kyc_status || 'NOT SUBMITTED'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Upload Additional Documents</p>
                  <label className="flex flex-col items-center px-4 py-6 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <UploadCloud className="w-8 h-8 mb-2 text-indigo-500" />
                    <span className="text-sm font-medium text-center">Click to upload documents</span>
                    <input type="file" className="hidden" accept=".jpg,.png,.pdf" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
