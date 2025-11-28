
import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface AuthModalProps {
  name: string;
  mode: 'setup' | 'login';
  onSuccess: (password: string) => void;
  onClose: () => void;
  error?: string;
  lang: Language;
}

const AuthModal: React.FC<AuthModalProps> = ({ name, mode, onSuccess, onClose, error: externalError, lang }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError(t.errorEmptyPassword);
      return;
    }
    onSuccess(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-santa-dark border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-santa-red to-red-800 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 text-white">
            {mode === 'setup' ? <KeyRound size={24} /> : <Lock size={24} />}
          </div>
          <h3 className="text-xl font-bold text-white">
            {mode === 'setup' ? t.secureAccount.replace('{name}', name) : t.welcomeBack.replace('{name}', name)}
          </h3>
          <p className="text-red-100 text-sm mt-1">
            {mode === 'setup' 
              ? t.createPasswordDesc 
              : t.enterPasswordDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              placeholder={mode === 'setup' ? t.createPasswordPlaceholder : t.enterPasswordPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-santa-gold focus:border-transparent transition-all pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {(localError || externalError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm text-center">
              {localError || externalError ? (externalError === 'Incorrect password' ? t.errorIncorrectPassword : (localError || externalError)) : ''}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 bg-santa-gold hover:bg-yellow-300 text-santa-dark font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {mode === 'setup' ? t.setPassword : t.unlock} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
