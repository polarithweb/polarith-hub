import React, { useState } from 'react';
import { LogIn, ShieldCheck, Phone } from 'lucide-react';
import { sanitizeWhatsappNumber } from '../utils/toolsLogic';

export interface SavedUserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  whatsappNumber: string;
  deviceInfo: string;
  lastLoginAt: string;
  createdAt: string;
  authMethod: 'google-oauth' | 'device-gmail';
}

interface LoginGateModalProps {
  onGoogleSignIn: (whatsappNumber: string) => Promise<void>;
  isLoading: boolean;
  errorMsg: string | null;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  onGoogleSignIn,
  isLoading,
  errorMsg,
}) => {
  const [whatsappInput, setWhatsappInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanedWhatsapp = sanitizeWhatsappNumber(whatsappInput);
    if (!cleanedWhatsapp) {
      setValidationError(
        'Please enter a valid WhatsApp number (7 to 15 digits, e.g. +91 98765 43210) before signing in with Google.'
      );
      return;
    }

    await onGoogleSignIn(cleanedWhatsapp);
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
              Login with Google
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Welcome to <span className="font-medium text-slate-900">Polarith Softwares</span> by Priyam Kesh. Enter your WhatsApp number below and sign in with your Google (Gmail) account to continue.
        </p>

        {(validationError || errorMsg) && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            {validationError || errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-whatsapp"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-whatsapp"
                type="tel"
                required
                value={whatsappInput}
                onChange={(e) => {
                  setWhatsappInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. +91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-white/95 border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-900 font-mono-tabular"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {isLoading ? 'Connecting to Google...' : 'Continue with Google (Gmail Account)'}
            </span>
          </button>
        </form>

        <p className="mt-5 text-[11px] text-slate-500 text-center leading-normal">
          Your Google account and WhatsApp number are saved on your device for automatic login and synced with Polarith Softwares.
        </p>
      </div>
    </div>
  );
};
