import React, { useState } from 'react';
import { LogIn, ShieldCheck, Mail, User as UserIcon, CheckCircle2 } from 'lucide-react';

export interface SavedUserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  deviceInfo: string;
  lastLoginAt: string;
  createdAt: string;
  authMethod: 'google-oauth' | 'device-gmail';
}

interface LoginGateModalProps {
  onGoogleSignIn: () => Promise<void>;
  onDeviceGmailSignIn: (email: string, displayName: string) => Promise<void>;
  isLoading: boolean;
  errorMsg: string | null;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  onGoogleSignIn,
  onDeviceGmailSignIn,
  isLoading,
  errorMsg,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleManualGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid Gmail or email address.');
      return;
    }
    await onDeviceGmailSignIn(trimmedEmail, trimmedName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl frosted-panel shadow-xl p-6 sm:p-8 border border-white/80">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-indigo-600">
              Polarith Softwares · Identity Gate
            </p>
            <h1 className="text-2xl font-serif-display font-semibold text-slate-900 mt-1">
              Sign in with Gmail
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Welcome to <span className="font-medium text-slate-900">Polarith Studio</span> by Priyam Kesh. Sign in with your Google account to personalize your dashboard, sync Cinema Machine movie requests, and save your login session directly on this device.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google (Gmail Popup)'}</span>
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white/90 px-3 text-xs text-slate-500 whitespace-nowrap">
            Or save Gmail directly on this device
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <form onSubmit={handleManualGmailSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="login-name" className="block text-xs font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Sen"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-white/90 border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1">
              Gmail Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-white/90 border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Gmail Session to Device</span>
          </button>
        </form>

        <p className="mt-5 text-[11px] text-slate-500 text-center leading-normal">
          Your session details are stored locally on your device for instant auto-login and synced with Polarith Studio security protocols.
        </p>
      </div>
    </div>
  );
};
