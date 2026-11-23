/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, Exam, ExamSession } from '../../types/exam';
import { 
  User, 
  BookOpen, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize, 
  HelpCircle, 
  FileText, 
  LogOut, 
  Play,
  Lock,
  RotateCcw,
  Calendar,
  CalendarClock
} from 'lucide-react';
import { enterExamFullscreen } from '../../utils/security';
import { getExamScheduleStatus, formatExamDateTime } from '../../utils/examSchedule';

interface StudentDashboardProps {
  student: Student;
  activeExam: Exam;
  isRoomDisabled?: boolean;
  isStudentDisabled?: boolean;
  isExamCompleted?: boolean;
  completedSession?: ExamSession;
  onStartExam: (exam: Exam) => void;
  onLogoutStudent: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  activeExam,
  isRoomDisabled = false,
  isStudentDisabled = false,
  isExamCompleted = false,
  completedSession,
  onStartExam,
  onLogoutStudent,
}) => {
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false);

  const scheduleInfo = getExamScheduleStatus(activeExam);
  const isScheduleBlocked = !scheduleInfo.isAccessible;

  const handleConfirmStart = async () => {
    if (isExamCompleted) return;
    setIsRequestingFullscreen(true);
    await enterExamFullscreen();
    setIsRequestingFullscreen(false);
    onStartExam(activeExam);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Student Identity Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border border-blue-200 shrink-0">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Siswa Terverifikasi
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>NISN: <strong className="font-mono text-slate-700">{student.nisn}</strong></span>
              <span>·</span>
              <span>Kelas: <strong className="text-slate-700">{student.className}</strong></span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Ruang Ujian: {student.room || 'Ruang 1'}
              </span>
              <span>·</span>
              <span>{student.school}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogoutStudent}
          className="self-start md:self-center px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Available Exam Card */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-3">Ujian yang Siap Dikerjakan</h2>

        {/* Student Account Disabled Banner */}
        {student.isAccountDisabled && (
          <div className="mb-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3.5 text-xs text-rose-900 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-sm text-rose-950 block">
                Akun Anda Dinonaktifkan oleh Operator ({student.room || 'Ruang 1'})
              </span>
              <p className="text-rose-800 leading-relaxed">
                Pengawas / Master Operator telah menonaktifkan akun Anda secara khusus pada {student.room || 'ruangan ini'}. Anda tidak dapat memulai ujian. Akun siswa lainnya tidak terganggu dan tetap aktif secara normal.
              </p>
              <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-rose-200">
                Silakan hubungi proktor ruangan untuk mengaktifkan kembali akun Anda.
              </p>
            </div>
          </div>
        )}

        {/* Exam Schedule Upcoming Warning Banner */}
        {scheduleInfo.status === 'upcoming' && !isExamCompleted && (
          <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3.5 text-xs text-amber-950 shadow-2xs">
            <CalendarClock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-sm block">
                Jadwal Ujian Belum Dimulai
              </span>
              <p className="text-amber-900 leading-relaxed">
                Ujian <strong>{activeExam.title}</strong> dijadwalkan baru dibuka pada <strong>{formatExamDateTime(activeExam.startDate)}</strong>.
                {activeExam.endDate && (
                  <span> Batas waktu pengerjaan berakhir pada <strong>{formatExamDateTime(activeExam.endDate)}</strong>.</span>
                )}
              </p>
              <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200">
                Tombol pengerjaan soal akan terbuka otomatis saat jam pelaksanaan telah tiba.
              </p>
            </div>
          </div>
        )}

        {/* Exam Schedule Ended Warning Banner */}
        {scheduleInfo.status === 'ended' && !isExamCompleted && (
          <div className="mb-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3.5 text-xs text-rose-950 shadow-2xs">
            <CalendarClock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-sm block">
                Batas Waktu Pelaksanaan Ujian Telah Berakhir
              </span>
              <p className="text-rose-900 leading-relaxed">
                Jadwal akses untuk ujian <strong>{activeExam.title}</strong> telah ditutup pada <strong>{formatExamDateTime(activeExam.endDate)}</strong>. Anda tidak dapat memulai pengerjaan ujian ini lagi.
              </p>
              <p className="text-[11px] text-rose-800 font-semibold pt-1 border-t border-rose-200">
                Silakan hubungi proktor ruangan atau guru pengampu jika memerlukan sesi ujian susulan.
              </p>
            </div>
          </div>
        )}

        {/* 1x Attempt Limitation Alert Banner */}
        {isExamCompleted && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3.5 text-xs text-amber-900 shadow-2xs">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-sm text-amber-950 block">
                Ujian Ini Sudah Selesai Dikumpulkan (1x Kesempatan Telah Digunakan)
              </span>
              <p className="text-slate-700 leading-relaxed">
                Anda telah menyelesaikan dan mengumpulkan lembar jawaban untuk ujian <strong>{activeExam.title}</strong>. 
                Sesuai aturan ujian, setiap peserta didik hanya memiliki <strong>1 (satu) kali kesempatan</strong> mengerjakan soal. 
                Akses pengerjaan ulang dinonaktifkan, <strong>kecuali kode token Anda di-reset oleh Master Operator</strong>.
              </p>
              {completedSession && (
                <div className="pt-2 text-[11px] font-mono text-amber-800 flex items-center gap-3">
                  <span>Waktu Pengumpulan: <strong>{new Date(completedSession.endTime || Date.now()).toLocaleTimeString('id-ID')} WIB</strong></span>
                  <span>·</span>
                  <span>Status: <strong className="uppercase">{completedSession.status}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Specific Disabled Warning Banner */}
        {isStudentDisabled && !isExamCompleted && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-900 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Akses Soal untuk Akun Anda Dinonaktifkan Sementara oleh Pengawas
              </span>
              <span className="text-rose-700">
                Pengawas Pusat / Master Operator sedang menonaktifkan akses pengerjaan soal secara khusus untuk akun Anda. Peserta lain tetap mengerjakan secara normal. Silakan hubungi pengawas jika ini memerlukan tindak lanjut.
              </span>
            </div>
          </div>
        )}

        {/* Room Disabled Warning Banner */}
        {isRoomDisabled && !isStudentDisabled && !isExamCompleted && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-900 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Akses Soal untuk {student.room || 'Ruang 1'} Dinonaktifkan Sementara
              </span>
              <span className="text-rose-700">
                Pengawas Pusat / Master Operator sedang mematikan akses soal pada ruangan Anda. Anda baru dapat memulai ujian setelah operator mengaktifkan kembali sesi ruangan ini.
              </span>
            </div>
          </div>
        )}

        <div className={`bg-white border rounded-xl p-4 sm:p-6 shadow-xs transition-all ${
          isExamCompleted ? 'border-slate-300 bg-slate-50/60' : 'border-slate-200 hover:border-blue-400'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{activeExam.subject} · {activeExam.grade}</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${scheduleInfo.badgeBg} ${scheduleInfo.badgeText} ${scheduleInfo.badgeBorder}`}>
                  {scheduleInfo.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{activeExam.title}</h3>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Guru Pengampu: <strong className="text-slate-700">{activeExam.teacherName}</strong></span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Durasi: <strong className="text-slate-700">{activeExam.durationMinutes} Menit</strong></span>
                </span>
                <span>·</span>
                <span>Jumlah Soal: <strong className="text-slate-700">{activeExam.questions.length} Butir</strong></span>
                <span>·</span>
                <span>Token Akses: <strong className="font-mono text-blue-600 font-bold">{activeExam.token}</strong></span>
                {activeExam.enableSchedule !== false && activeExam.startDate && activeExam.endDate && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span>Jadwal: <strong>{formatExamDateTime(activeExam.startDate)} s.d {formatExamDateTime(activeExam.endDate)}</strong></span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {isExamCompleted ? (
                <button
                  disabled
                  className="px-6 py-2.5 text-xs font-bold rounded-lg bg-slate-200 text-slate-500 border border-slate-300 flex items-center gap-2 cursor-not-allowed shadow-2xs"
                  title="Anda sudah pernah menyelesaikan ujian ini (1x kesempatan pengerjaan)"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Ujian Selesai (1x Digunakan)</span>
                </button>
              ) : (
                <button
                  disabled={isRoomDisabled || isStudentDisabled || Boolean(student.isAccountDisabled) || isScheduleBlocked}
                  onClick={() => setShowAgreementModal(true)}
                  className={`px-6 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm ${
                    isRoomDisabled || isStudentDisabled || student.isAccountDisabled || isScheduleBlocked
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                      : 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {student.isAccountDisabled
                      ? 'Akun Dinonaktifkan Operator'
                      : isStudentDisabled
                      ? 'Akses Soal Dinonaktifkan'
                      : isRoomDisabled
                      ? 'Akses Ruang Dinonaktifkan'
                      : scheduleInfo.status === 'upcoming'
                      ? 'Jadwal Belum Dimulai'
                      : scheduleInfo.status === 'ended'
                      ? 'Jadwal Telah Berakhir'
                      : 'Mulai Kerjakan Ujian'}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pilihan Ganda, MCMA & Tabel 4 Pernyataan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Dukungan Ilustrasi & Diagram Bergambar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Proteksi Keamanan Anti-Curang Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Integritas & Mode Aman Ujian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Harap baca tata tertib teknis sebelum memasuki ruang ujian.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5 text-xs text-slate-700 mb-5">
              <div className="flex items-start gap-2">
                <Maximize className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mode Layar Penuh (Fullscreen):</strong> Sistem akan mengunci tampilan peramban ke layar penuh. Keluar fullscreen akan dicatat sebagai pelanggaran.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Proteksi Tab & Aplikasi Mengambang:</strong> Dilarang membuka tab lain, floating notes, atau berganti ke aplikasi lain.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Anti Screenshot & Copy Teks:</strong> Klik kanan, penyalinan teks, dan tangkapan layar (PrintScreen) diblokir sepenuhnya. Watermark identitas Anda akan terpampang di lembar ujian.
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 select-none">
                Saya menyetujui seluruh ketentuan integritas ujian dan siap menaati tata tertib serta pengawasan sistem CBT.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!agreed || isRequestingFullscreen}
                onClick={handleConfirmStart}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Maximize className="w-4 h-4" />
                <span>{isRequestingFullscreen ? 'Meminta Layar Penuh...' : 'Masuk Ruang Ujian'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
