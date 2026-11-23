/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X,
  ShieldAlert
} from 'lucide-react';

export const OPERATOR_ACTIVATION_CODE = '@10901018#777#';

interface OperatorActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OperatorActivationModal: React.FC<OperatorActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activationCodeInput, setActivationCodeInput] = useState<string>('');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActivationCodeInput('');
      setErrorMessage('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = activationCodeInput.trim();

    if (!cleanInput) {
      setErrorMessage('Silakan masukkan kode aktivasi operator.');
      return;
    }

    if (cleanInput === OPERATOR_ACTIVATION_CODE) {
      setIsSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        onSuccess();
      }, 600);
    } else {
      setErrorMessage('Kode aktivasi salah! Akses ke Laman Pusat Operator ditolak. Pastikan Anda memasukkan kode aktivasi resmi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-7 text-white animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="operator-modal-title"
      >
        {/* Glow ambient background decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Tutup & Kembali"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt EduSecure CBT" 
            className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-md" 
          />
          <h2 id="operator-modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Autentikasi Pusat Operator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            SmanGt EduSecure CBT · Masukkan kode aktivasi resmi untuk membuka dashboard kontrol CBT dan pengawasan ujian.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-start gap-2.5 shadow-sm animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs rounded-xl flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span className="font-semibold">Kode aktivasi valid! Membuka Pusat Kendali Operator...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <label htmlFor="activationCode" className="font-semibold text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kode Aktivasi Operator</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Wajib Diisi
              </span>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                id="activationCode"
                type={showCode ? 'text' : 'password'}
                value={activationCodeInput}
                onChange={(e) => {
                  setActivationCodeInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Masukkan kode aktivasi operator..."
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-11"
                required
                autoComplete="off"
                disabled={isSuccess}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                title={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Akses terbatas. Hanya dapat dibuka oleh Master Operator CBT / Proktor Utama yang memiliki kode aktivasi resmi.
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSuccess}
              className="w-1/3 py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className={`w-2/3 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Buka Laman Operator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            SmanGt EduSecure CBT · Master Operator Security Gate
          </span>
        </div>
      </div>
    </div>
  );
};
