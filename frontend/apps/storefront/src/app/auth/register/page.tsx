"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../store';
import { translations, Language } from '../../translations';
import { User, Lock, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
// @ts-ignore
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const router = useRouter();
  const { login, language } = useAppStore();
  const t = translations[language as Language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/register', { 
        full_name: name, 
        email, 
        phone, 
        password,
        role
      });
      if (response.data.success) {
        const mockOtp = response.data.otpCode ? ` (Mock OTP code is: ${response.data.otpCode})` : '';
        alert(`Verification code sent to your phone/email. Please enter it below.${mockOtp}`);
        setStep('otp');
      } else {
        alert(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/verify-otp', { 
        emailOrPhone: email, 
        otp 
      });
      if (response.data.success) {
        alert('Verification successful! You can now log in.');
        router.push('/auth/login');
      } else {
        alert(response.data.message || 'OTP verification failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Verification error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/google', {
        credential: credentialResponse.credential,
        role: role // Pass the selected role
      });

      if (response.data.success) {
        const token = response.data.accessToken || response.data.token;
        const assignedRole = response.data.user.role || role;
        login({
          id: response.data.user.id,
          name: response.data.user.name || response.data.user.email.split('@')[0],
          email: response.data.user.email,
          token: token,
          role: assignedRole
        });

        if (assignedRole === 'ADMIN') {
          router.push('/admin');
        } else if (assignedRole === 'SELLER') {
          router.push('/seller/dashboard');
        } else {
          router.push('/');
        }
      } else {
        alert(response.data.message || 'Google registration failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Google authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 transform rotate-3">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          {step === 'register' 
            ? t.registerTitle
            : 'Verify your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {step === 'register' && (
            <>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                {t.signIn}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-dark-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-dark-700">
          {step === 'register' ? (
            <>
              <div className="mb-6 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">Step 1: Select Role</span>
                <div className="w-full grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`py-3 text-center text-sm font-semibold rounded-xl border transition-all ${
                      role === 'CUSTOMER'
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm shadow-brand-500/20'
                        : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700/50'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SELLER')}
                    className={`py-3 text-center text-sm font-semibold rounded-xl border transition-all ${
                      role === 'SELLER'
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm shadow-brand-500/20'
                        : 'border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700/50'
                    }`}
                  >
                    Business / Seller
                  </button>
                </div>
                
                <span className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-2 mb-2">Step 2: Sign Up</span>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    alert('Google Sign-up Failed');
                  }}
                  text="signup_with"
                />
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-dark-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-dark-800 text-slate-500">
                    Or register with email
                  </span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleRegister}>
              <div>
              {/* Role selection moved to top for Google Auth compatibility */}
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.name}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.email}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                    placeholder="admin@enterprise.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.phone}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.password}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-brand-500/30"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t.createAccount}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </form>
            </>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-center mb-2">
                  {language === 'en' ? 'Enter 6-Digit OTP Verification Code' : 'Wpisz 6-cyfrowy kod weryfikacyjny OTP'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-widest text-2xl font-bold border-slate-300 dark:border-dark-600 dark:bg-dark-900 dark:text-white rounded-xl focus:ring-brand-500 focus:border-brand-500 py-4 transition-colors"
                  placeholder="000000"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-brand-500/30"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP Code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-dark-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-dark-800 text-slate-500">
                  Secure Enterprise Authentication
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

