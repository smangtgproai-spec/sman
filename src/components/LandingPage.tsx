/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from './Navbar';
import { 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  Lock, 
  EyeOff, 
  CopyCheck, 
  Layers, 
  Camera, 
  CheckCircle,
  ArrowRight,
  Clock,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (role: UserRole) => void;
  activeExamsCount: number;
  totalStudents: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  activeExamsCount,
  totalStudents,
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex flex-col items-center justify-center gap-3 mb-4 sm:mb-5">
            <img 
              src="https://iili.io/f0D1nQs.png" 
              alt="Logo SmanGt EduSecure CBT" 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-md hover:scale-105 transition-transform" 
            />
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] sm:text-xs font-semibold max-w-full">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="truncate">SmanGt EduSecure CBT · Standar Asesmen Digital Nasional</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto mb-3 sm:mb-5">
            Sistem Ujian Online Terproteksi dengan Integritas Tinggi
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Platform Computer-Based Test (CBT) komprehensif dengan deteksi kecurangan real-time, penguncian layar penuh, multi-tipe soal interaktif, dan pemantauan pengawas transparan.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2.5 sm:gap-3 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => onNavigate('student')}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <BookOpen className="w-4 h-4" />
              <span>Masuk Laman Ujian Siswa</span>
              <ArrowRight className="w-4 h-4 ml-auto sm:ml-0" />
            </button>
            <button
              onClick={() => onNavigate('teacher')}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Masuk Laman Guru</span>
            </button>
            <button
              onClick={() => onNavigate('operator')}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Pusat Kendali Operator</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main 3 Portals */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">Portal Akses Berdasarkan Hak Akses</h2>
          <p className="text-sm text-slate-500 mt-1">
            Setiap peran memiliki otorisasi tersendiri untuk menjaga keamanan integritas sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Siswa */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Laman Ujian (Siswa)</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Khusus peserta didik. Menampilkan kartu identitas siswa, daftar ujian yang aktif, verifikasi token masuk, dan ruang ujian terkunci otomatis.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dashboard & Kartu Identitas Siswa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>3 Tipe Soal: PG, MCMA, & Benar-Salah Tabel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Proteksi Fullscreen Kiosk Mode</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('student')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Buka Laman Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Guru */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Laman Guru</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Dashboard khusus setiap guru untuk mengelola bank soal, membuat soal baru bergambar, import DOCX/Excel/Google Form, serta menerbitkan token ujian.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dashboard Mandiri & Login Token Unik Guru</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Editor Soal PG, MCMA, & Tabel 4 Pernyataan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Gambar & Import DOCX, XLSX, Google Form</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('teacher')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Buka Laman Guru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Operator */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Settings className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Kode Aktivasi</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Laman Operator (Pusat)</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Akses penuh ke seluruh sistem platform: live monitoring peserta real-time, transparan sisa durasi, force submit, reset akun siswa & guru, serta kontrol buka/tutup sesi.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Live Proctoring & Deteksi Pelanggaran</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Reset Akun Siswa & Guru Terkunci</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Buka/Tutup Sesi Ujian & Ekspor Berita Acara</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('operator')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buka Pusat Operator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Security Architecture Showcase */}
      <section className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold tracking-tight">5 Pilar Perlindungan Keamanan Integritas Ujian</h2>
            <p className="text-xs text-slate-400 mt-2">
              Sistem penguncian berlapis melindungi integritas soal dan mencegah siswa mencari bantuan di luar aplikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="w-8 h-8 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Anti Layar Belah</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mendeteksi perubahan dimensi viewport dan split-screen window. Layar otomatis terkunci jika dibagi dua.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="w-8 h-8 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <CopyCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Anti Copy Teks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Memblokir klik kanan, selectstart, kombinasi Ctrl+C, Ctrl+V, Ctrl+U, Print, serta shortcut developer F12.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="w-8 h-8 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <EyeOff className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Anti Layar Mengambang</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mendeteksi hilangnya fokus browser (window blur) akibat floating apps, Picture-in-Picture, atau pop-up.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="w-8 h-8 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Anti Screenshot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menghalau tombol PrintScreen, proteksi media print CSS, dan watermark identitas siswa dinamis di atas soal.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4">
              <div className="w-8 h-8 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Proteksi Tab</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Page Visibility API mencatat setiap perpindahan tab browser, membunyikan alarm dan menghitung strike pelanggaran.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="py-6 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>© 2026 SmanGt EduSecure CBT Engine · Sistem Asesmen Berbasis Komputer & Keamanan Terproteksi Nasional</p>
      </footer>
    </div>
  );
};
