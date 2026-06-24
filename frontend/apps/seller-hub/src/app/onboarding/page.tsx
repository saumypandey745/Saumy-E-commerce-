// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/store';
import { api } from '@/lib/api';
import { Store, Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const { user, isLoggedIn, updateUser } = useAppStore();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    contact_email: user?.email || '',
    business_registration_number: '',
    tax_id: ''
  });

  const [kycFile, setKycFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
    // If they are already a seller and onboarded, maybe redirect them
    if (user?.role === 'SELLER' && step === 1) {
      router.push('/');
    }
  }, [isLoggedIn, user, router]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/sellers/onboard', formData);
      if (res.data.success) {
        updateUser({ role: 'SELLER' });
        setStep(2); // Move to KYC
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create store. Name might be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) return;

    setLoading(true);
    setError('');
    
    const fd = new FormData();
    fd.append('document', kycFile);
    fd.append('doc_type', 'IDENTITY');

    try {
      const res = await api.post('/api/sellers/kyc', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStep(3); // Success
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/30 mb-6">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Welcome to Seller Hub
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Let's get your store set up in just a few minutes.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Progress Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
                  step >= num ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-slate-400'
                }`}
              >
                Step {num}
              </div>
            ))}
          </div>

          <div className="p-8 sm:p-12">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {step === 1 && (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleCreateStore} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Store Name</label>
                  <input
                    required
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                    className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    placeholder="e.g. Acme Electronics"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Store Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    placeholder="Tell customers what you sell..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                    <input
                      required
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Business Registration No.</label>
                    <input
                      required
                      type="text"
                      value={formData.business_registration_number}
                      onChange={(e) => setFormData({...formData, business_registration_number: e.target.value})}
                      className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                      placeholder="e.g. BRN-123456"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Store'}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleKYCUpload} 
                className="space-y-8 text-center"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Identity Verification</h3>
                  <p className="text-slate-600 dark:text-slate-400">Please upload a valid government-issued ID (Passport, Driver's License, or National ID) to verify your business.</p>
                </div>

                <div className="flex justify-center">
                  <label className="w-full max-w-md flex flex-col items-center px-4 py-12 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <UploadCloud className="w-12 h-12 mb-4 text-indigo-500" />
                    <span className="text-sm font-medium">
                      {kycFile ? kycFile.name : 'Select a document to upload'}
                    </span>
                    <input type="file" className="hidden" accept=".jpg,.png,.pdf" onChange={(e) => setKycFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !kycFile}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Upload & Submit KYC'}
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-8">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">You're All Set!</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg mx-auto">
                  Your store has been created and your KYC documents are under review. You can now access your dashboard and start adding products!
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
