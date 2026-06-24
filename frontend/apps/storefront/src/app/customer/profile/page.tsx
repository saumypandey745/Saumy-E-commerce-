"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../store';
import { api } from '@/lib/api';
import { User, MapPin, CreditCard, Package, Shield, Settings, LogOut, Edit2, Plus, Loader, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { translations, Language } from '../../translations';

interface Address {
  id: string;
  type: string;
  address: string;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: storeUser, isLoggedIn, logout, language } = useAppStore();
  const t = translations[language as Language];

  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit profile states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Address states
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressType, setNewAddressType] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (activeTab === 'orders' && isLoggedIn) {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/profile');
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        setUserProfile(u);
        setFirstName(u.Profile?.first_name || '');
        setLastName(u.Profile?.last_name || '');
        setPhone(u.Profile?.phone_number || u.phone || '');
      } else {
        setError('Failed to load profile details.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/api/orders');
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await api.put('/api/profile', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone
      });
      if (res.data.success) {
        setUserProfile(res.data.user);
        setIsEditingInfo(false);
        alert('Personal information updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    setSavingAddress(true);

    const currentAddresses = userProfile?.Profile?.addresses || [];
    const newAddr = {
      id: 'addr_' + Math.random().toString(36).substr(2, 9),
      type: newAddressType,
      address: newAddressText
    };

    try {
      const res = await api.put('/api/profile', {
        addresses: [...currentAddresses, newAddr]
      });
      if (res.data.success) {
        setUserProfile(res.data.user);
        setNewAddressText('');
        setIsAddingAddress(false);
        alert('Address added successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    const currentAddresses = userProfile?.Profile?.addresses || [];
    const updated = currentAddresses.filter((a: any) => a.id !== id);

    try {
      const res = await api.put('/api/profile', {
        addresses: updated
      });
      if (res.data.success) {
        setUserProfile(res.data.user);
        alert('Address deleted successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleSignOut = () => {
    logout();
    router.push('/auth/login');
  };

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader className="animate-spin text-brand-500 mx-auto mb-4" size={32} />
        <p className="text-gray-400">Loading your profile details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
        <h3 className="text-xl font-bold mb-2">Error Loading Profile</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={fetchProfile} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl">
          Try Again
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
              {!isEditingInfo && (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline text-sm font-semibold"
                >
                  <Edit2 size={16} /> Edit Profile
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm">
              {isEditingInfo ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={savingInfo}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium disabled:opacity-75"
                    >
                      {savingInfo ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingInfo(false);
                        setFirstName(userProfile?.Profile?.first_name || '');
                        setLastName(userProfile?.Profile?.last_name || '');
                        setPhone(userProfile?.Profile?.phone_number || userProfile?.phone || '');
                      }}
                      className="px-4 py-2 border border-slate-300 dark:border-dark-600 hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">First Name</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{userProfile?.Profile?.first_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Last Name</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{userProfile?.Profile?.last_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email Address</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{userProfile?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Phone Number</p>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">{userProfile?.Profile?.phone_number || userProfile?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-400">
                        {userProfile?.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Verification Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {userProfile?.is_verified ? (
                          <>
                            <CheckCircle size={16} className="text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} className="text-amber-500" />
                            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Unverified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'addresses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Address Book</h2>
              {!isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
                >
                  <Plus size={18} /> Add New
                </button>
              )}
            </div>

            {isAddingAddress && (
              <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Add New Address</h3>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Label</label>
                    <select
                      value={newAddressType}
                      onChange={(e) => setNewAddressType(e.target.value)}
                      className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Billing">Billing</option>
                      <option value="Shipping">Shipping</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Address Details</label>
                    <textarea
                      required
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                      rows={3}
                      placeholder="123 Enterprise St, Suite 400, Tech City, TC 90210"
                      className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium disabled:opacity-75"
                    >
                      {savingAddress ? 'Saving...' : 'Add Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-dark-600 hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(userProfile?.Profile?.addresses || []).length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <MapPin className="mx-auto mb-4 text-gray-500" size={36} />
                  <p className="text-gray-400">No addresses saved yet. Click Add New to create one.</p>
                </div>
              ) : (
                (userProfile.Profile.addresses as Address[]).map((addr) => (
                  <div key={addr.id} className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-400 px-2 py-1 rounded">
                          {addr.type}
                        </span>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          title="Delete address"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{addr.address}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Order History</h2>
            {loadingOrders ? (
              <div className="text-center py-12">
                <Loader className="animate-spin text-brand-500 mx-auto" size={24} />
                <p className="text-gray-400 mt-2">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <Package className="mx-auto mb-4 text-gray-500" size={36} />
                <p className="text-gray-400 mb-4">You have not placed any orders yet.</p>
                <Link href="/products" className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 dark:bg-dark-900 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-dark-700">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Order ID</p>
                        <p className="text-sm font-mono font-bold text-slate-955 dark:text-white">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Date</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-300">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total</p>
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">${order.total_amount?.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${order.status === 'CONFIRMED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                            order.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                          {order.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${order.payment_status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            order.payment_status === 'FAILED' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400' :
                            'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400'}`}>
                          Payment: {order.payment_status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-dark-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-dark-700">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Methods</h2>
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm text-center py-12">
              <CreditCard className="mx-auto mb-4 text-gray-500 animate-pulse" size={36} />
              <p className="text-slate-700 dark:text-slate-300 font-semibold mb-2">Secure Credit Card Vault</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Your payment cards are securely tokenized and stored in compliance with PCI-DSS. You can add new cards during checkout.
              </p>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Security Settings</h2>
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Two-Factor Authentication (2FA)</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Add an extra layer of security to your account by enabling verification codes from an authenticator app (like Google Authenticator).
                </p>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-semibold">
                    Disabled
                  </div>
                  <Link href="/security" className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline">
                    Manage 2FA Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Preferences</h2>
            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferred Currency</label>
                <select className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
                <select className="block w-full px-4 py-2 sm:text-sm border border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl">
                  <option value="en">English</option>
                  <option value="pl">Polski</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Section Under Construction</div>;
    }
  };

  const menuItems = [
    { id: 'profile', label: t.myAccount, icon: User },
    { id: 'addresses', label: t.addresses, icon: MapPin },
    { id: 'orders', label: t.orders, icon: Package },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white uppercase shadow-sm">
                {(userProfile?.Profile?.first_name || storeUser?.name || 'C')[0]}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold truncate text-slate-950 dark:text-white">
                  {userProfile?.Profile?.first_name 
                    ? `${userProfile.Profile.first_name} ${userProfile.Profile.last_name || ''}` 
                    : (storeUser?.name || 'Customer')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{userProfile?.role || storeUser?.role || 'Customer'}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
                      ${isActive 
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-6 mt-6 border-t border-slate-200 dark:border-dark-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  <LogOut size={18} />
                  {t.signOut}
                </button>
              </div>
            </nav>
          </div>
          
          {(userProfile?.role || storeUser?.role) === 'CUSTOMER' && (
            <div className="mt-6 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 border border-brand-500/20 rounded-2xl p-6 text-center shadow-sm">
              <h4 className="font-bold mb-2 text-slate-900 dark:text-white">Want to sell on Enterprise?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Reach millions of customers by opening your own store.</p>
              <Link href="/seller" className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm shadow-brand-500/20">
                Become a Seller
              </Link>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>

      </div>
    </div>
  );
}
