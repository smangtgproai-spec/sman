/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher } from '../../types/exam';
import { 
  GraduationCap, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  UserCheck, 
  Info,
  ArrowLeft
} from 'lucide-react';

interface TeacherLoginProps {
  teachers: Teacher[];
  onLoginSuccess: (teacher: Teacher) => void;
  onBackToPortal: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({
  teachers,
  onLoginSuccess,
  onBackToPortal,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentTeacher) {
      setErrorMessage('Pilih akun guru terlebih dahulu.');
      return;
    }

    if (!tokenInput.trim()) {
      setErrorMessage('Token akses guru wajib dimasukkan secara manual.');
      return;
    }

    const inputClean = tokenInput.trim().toUpperCase();
    const correctToken = (currentTeacher.token || '').trim().toUpperCase();

    if (inputClean !== correctToken) {
      setErrorMessage(
        `Token yang Anda masukkan (${inputClean}) tidak cocok dengan token resmi ${currentTeacher.name}. Hubungi Operator CBT jika Anda memerlukan informasi atau reset token.`
      );
      return;
    }

    onLoginSuccess(currentTeacher);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt EduSecure CBT" 
            className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" 
          />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Portal Masuk Laman Guru</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            SmanGt EduSecure CBT · Masukkan Token Akses unik Guru Pengampu
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-bold">Akses Ditolak: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {teachers.length === 0 ? (
          <div className="text-center py-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-5 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1 text-sm">Belum Ada Akun Guru Terdaftar</span>
              Seluruh data awal guru telah dibersihkan. Silakan masuk ke <strong>Laman Operator</strong> untuk menambahkan akun guru secara manual atau mengimpor data melalui file Excel (.xlsx / .csv).
            </div>
            <button
              type="button"
              onClick={onBackToPortal}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
            >
              Kembali ke Portal Utama
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Teacher Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Pilih Identitas Guru Pendidik</span>
                <span className="text-[11px] font-normal text-slate-400">Total: {teachers.length} Guru</span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setTokenInput('');
                  setErrorMessage('');
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                required
              >
                {teachers.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name} — {tc.subject} (NIP: {tc.nip})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Teacher Info Card */}
            {currentTeacher && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                <div className="font-bold text-indigo-950 truncate">{currentTeacher.name}</div>
                <div className="text-[11px] text-indigo-700 mt-0.5 truncate">
                  Pengampu: <strong>{currentTeacher.subject}</strong> · NIP: {currentTeacher.nip}
                </div>
              </div>
            )}

            {/* Token Input (Manual Entry) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ketik Token Akses Guru</span>
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value.toUpperCase());
                  setErrorMessage('');
                }}
                placeholder="Ketik token guru di sini (Contoh: GURU-****)"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase transition-all"
                required
                autoComplete="off"
              />
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Ketik token unik yang telah diberikan oleh Operator CBT atau Administrator.</span>
              </div>
            </div>

            {/* Submit & Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Buka Dashboard Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBackToPortal}
                className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Portal Utama</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
