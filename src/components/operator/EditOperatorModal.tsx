/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Operator } from '../../types/exam';
import { 
  User, 
  Mail, 
  AtSign, 
  ShieldCheck, 
  Check, 
  X, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface EditOperatorModalProps {
  isOpen: boolean;
  operator: Operator;
  onClose: () => void;
  onSave: (updated: Operator) => void;
}

export const EditOperatorModal: React.FC<EditOperatorModalProps> = ({
  isOpen,
  operator,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState<string>(operator.name);
  const [username, setUsername] = useState<string>(operator.username || 'admin.cbt');
  const [email, setEmail] = useState<string>(operator.email || 'operator.pusat@cbt-secure.sch.id');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(operator.name);
      setUsername(operator.username || 'admin.cbt');
      setEmail(operator.email || 'operator.pusat@cbt-secure.sch.id');
      setError('');
    }
  }, [isOpen, operator]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama Master Operator tidak boleh kosong.');
      return;
    }

    onSave({
      ...operator,
      name: cleanName,
      username: username.trim() || 'admin.cbt',
      email: email.trim() || 'operator.pusat@cbt-secure.sch.id',
    });
    onClose();
  };

  const handleResetDefault = () => {
    setName('Hendra Kusuma, S.ST (Master Operator)');
    setUsername('admin.cbt');
    setEmail('operator.pusat@cbt-secure.sch.id');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-operator-modal-title"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-operator-modal-title" className="text-base font-bold text-white">
                Edit Identitas Master Operator
              </h3>
              <p className="text-xs text-slate-400">
                Ubah nama penanggung jawab sistem CBT dan Berita Acara
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Input Nama Master Operator */}
          <div className="space-y-1.5">
            <label htmlFor="operator-name-input" className="block text-xs font-bold text-slate-800">
              Nama Lengkap Master Operator / Proktor <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="operator-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Contoh: Bpk. Hendra Kusuma, S.ST / Proktor Utama"
                className="w-full px-3.5 py-2.5 text-xs text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Nama ini akan ditampilkan pada header kendali, navigasi atas, dan lembar tanda tangan Berita Acara.
            </p>
          </div>

          {/* Preset Cepat Nama Operator */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Saran:
            </span>
            <button
              type="button"
              onClick={() => setName('Proktor Utama CBT SMAN')}
              className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
            >
              Proktor Utama CBT SMAN
            </button>
            <button
              type="button"
              onClick={() => setName('Tim IT & Operator Asesmen')}
              className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
            >
              Tim IT & Operator Asesmen
            </button>
            <button
              type="button"
              onClick={() => setName('Hendra Kusuma, S.ST (Master Operator)')}
              className="text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
            >
              Bawaan Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Username Operator */}
            <div className="space-y-1.5">
              <label htmlFor="operator-username-input" className="block text-xs font-semibold text-slate-700">
                Username Operator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  id="operator-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin.cbt"
                  className="w-full pl-8 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Email Operator */}
            <div className="space-y-1.5">
              <label htmlFor="operator-email-input" className="block text-xs font-semibold text-slate-700">
                Email Kontak Operator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="operator-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@cbt.sch.id"
                  className="w-full pl-8 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pratinjau Tampilan */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 block">
              Pratinjau Identitas Aktif:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {name.trim() || '— Belum Diisi —'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                MASTER OPERATOR
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>{email || 'operator@cbt.sch.id'}</span>
              <span>·</span>
              <span>Username: <strong className="font-mono">{username || 'admin.cbt'}</strong></span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer py-1"
              title="Kembalikan ke nama default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Nama</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
