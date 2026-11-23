/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExamSession, Exam } from '../../types/exam';
import { CheckCircle2, ShieldCheck, Printer, AlertTriangle, Home, Clock, ShieldAlert, Lock } from 'lucide-react';

interface ExamResultViewProps {
  session: ExamSession;
  exam: Exam;
  onBackToPortal: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  session,
  exam,
  onBackToPortal,
}) => {
  const percentage = session.maxScore ? Math.round((session.score! / session.maxScore) * 100) : 0;
  const isBlocked = session.status === 'blocked' || (session.violations && session.violations.length >= 3);
  const isTimeExpired = session.status === 'force_submitted';

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Certificate Top Banner */}
        <div className={`text-white p-8 text-center relative overflow-hidden ${
          isBlocked 
            ? 'bg-rose-950 border-b border-rose-800' 
            : isTimeExpired 
            ? 'bg-amber-950 border-b border-amber-800' 
            : 'bg-slate-900'
        }`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isBlocked
              ? 'bg-rose-600/30 text-rose-400 border border-rose-500/50'
              : isTimeExpired
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}>
            {isBlocked ? (
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            ) : isTimeExpired ? (
              <Clock className="w-10 h-10 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            {isBlocked
              ? 'Jawaban Dikumpulkan Otomatis (3x Pelanggaran)'
              : isTimeExpired
              ? 'Jawaban Dikumpulkan Otomatis (Waktu Habis)'
              : 'Ujian Berhasil Dikumpulkan'}
          </h1>
          <p className="text-xs text-slate-300">
            {isBlocked
              ? 'Lembar jawaban telah otomatis diamankan dan dikirimkan ke server CBT. Akun Anda dikunci.'
              : isTimeExpired
              ? 'Waktu pengerjaan selesai. Seluruh butir jawaban tersimpan otomatis pada sistem SmanGt EduSecure CBT.'
              : 'Bukti verifikasi pengerjaan telah tersimpan aman pada sistem SmanGt EduSecure CBT'}
          </p>
        </div>

        {/* 1x Attempt Limitation Alert Box */}
        <div className="px-8 pt-6">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Ketentuan 1 Kali Kesempatan Pengerjaan Soal:</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Lembar jawaban Anda telah resmi dikumpulkan. Setiap siswa hanya memiliki <strong>1 (satu) kali kesempatan</strong> mengerjakan ujian ini. 
                Anda tidak dapat lagi masuk atau mengulang soal yang sama, kecuali dilakukan reset kode token login oleh Master Operator.
              </p>
            </div>
          </div>
        </div>

        {/* Details & Grades */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <span className="text-slate-500">Nama Siswa:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{session.studentName}</p>
            </div>
            <div>
              <span className="text-slate-500">NISN / Kelas:</span>
              <p className="font-bold text-slate-900 font-mono mt-0.5">{session.nisn} ({session.className})</p>
            </div>
            <div>
              <span className="text-slate-500">Mata Pelajaran:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{session.subject}</p>
            </div>
            <div>
              <span className="text-slate-500">Waktu Pengumpulan:</span>
              <p className="font-mono text-slate-800 mt-0.5">{new Date(session.endTime || Date.now()).toLocaleTimeString('id-ID')} WIB</p>
            </div>
          </div>

          {/* Score Box (If enabled by teacher) */}
          {exam.showResultsImmediately ? (
            <div className="border border-slate-200 rounded-xl p-6 text-center bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nilai Akhir Ujian
              </span>
              <div className="text-5xl font-extrabold text-blue-600 font-mono my-2 tabular-nums">
                {percentage}
                <span className="text-xl text-slate-400 font-normal"> / 100</span>
              </div>
              <p className="text-xs text-slate-600">
                Total skor yang diperoleh: <strong>{session.score}</strong> dari poin maksimal <strong>{session.maxScore}</strong>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-center">
              Hasil nilai evaluasi sedang diproses dan akan dipublikasikan oleh guru pengampu ({exam.teacherName}).
            </div>
          )}

          {/* Security Integrity Report */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Laporan Catatan Integritas Keamanan Ujian
            </h3>
            {session.violations.length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                Pengerjaan bersih. Tidak ditemukan indikasi kecurangan, perpindahan tab, maupun layar belah.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-2">
                  Terdeteksi <strong>{session.violations.length} catatan peringatan sistem</strong> selama sesi pengerjaan.
                </div>
                {session.violations.map((v) => (
                  <div key={v.id} className="text-[11px] text-slate-500 flex items-center justify-between border-b border-slate-100 pb-1">
                    <span>{v.title}</span>
                    <span className="font-mono text-slate-400">{v.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti Ujian</span>
            </button>

            <button
              onClick={onBackToPortal}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Portal Utama</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
