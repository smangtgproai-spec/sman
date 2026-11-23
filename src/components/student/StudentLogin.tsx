/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, Exam, ExamSession } from '../../types/exam';
import { 
  BookOpen, 
  KeyRound, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  User, 
  FileText, 
  CheckCircle2, 
  UserX,
  Calendar,
  CalendarClock,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { getExamScheduleStatus, formatExamDateTime } from '../../utils/examSchedule';

interface StudentLoginProps {
  students: Student[];
  exams: Exam[];
  examSessions: ExamSession[];
  onLoginSuccess: (student: Student, exam: Exam) => void;
  onBackToPortal: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  students,
  exams,
  examSessions,
  onLoginSuccess,
  onBackToPortal,
}) => {
  const publishedExams = exams.filter(e => e.status === 'published');
  
  // Available classes for filtering
  const availableClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Filtered students by class
  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(s => s.className === selectedClass);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => filteredStudents[0]?.id || students[0]?.id || '');
  const [studentTokenInput, setStudentTokenInput] = useState<string>('');
  const [examTokenInput, setExamTokenInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const isAccountDisabled = Boolean(currentStudent?.isAccountDisabled);
  const isStudentLocked = Boolean(currentStudent?.isLockedOut || currentStudent?.status === 'blocked') && !isAccountDisabled;

  // When class filter changes, update selected student
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    setErrorMessage('');
    const matching = newClass === 'all' ? students : students.filter(s => s.className === newClass);
    if (matching.length > 0) {
      setSelectedStudentId(matching[0].id);
      setStudentTokenInput('');
      setExamTokenInput('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentStudent) {
      setErrorMessage('Silakan pilih identitas nama siswa terlebih dahulu.');
      return;
    }

    // 1. Check Account Disabled by Operator
    if (isAccountDisabled) {
      setErrorMessage(
        `AKUN DINONAKTIFKAN: Akun siswa atas nama "${currentStudent.name}" pada ${currentStudent.room || 'ruangan ini'} sedang dinonaktifkan oleh Operator. Akun siswa lainnya tidak terganggu. Silakan hubungi proktor/pengawas ruang untuk mengaktifkan kembali akun Anda.`
      );
      return;
    }

    // 2. Check Lockout due to integrity violations
    if (isStudentLocked) {
      setErrorMessage(
        'AKUN ANDA TERKUNCI: Anda telah melebihi batas toleransi pelanggaran sistem integritas ujian (misal: keluar fullscreen / pindah tab). Anda tidak diizinkan masuk ke laman ujian sebelum akun dibuka kuncinya (reset lockout) oleh Master Operator.'
      );
      return;
    }

    // 2. Validate Student Token
    const cleanStudentTokenInput = studentTokenInput.trim().toUpperCase();
    const actualStudentToken = (currentStudent.token || '').trim().toUpperCase();

    if (!cleanStudentTokenInput) {
      setErrorMessage('Token Siswa wajib diisi.');
      return;
    }

    if (cleanStudentTokenInput !== actualStudentToken) {
      setErrorMessage(
        `Token Siswa tidak sesuai dengan akun "${currentStudent.name}". Pastikan Anda memasukkan token unik pribadi yang tercantum pada kartu ujian atau diberikan oleh operator.`
      );
      return;
    }

    // 3. Validate Exam Token (Token Mapel)
    const cleanExamToken = examTokenInput.trim().toUpperCase();
    if (!cleanExamToken) {
      setErrorMessage('Token Mapel ujian wajib diisi.');
      return;
    }

    const matchedExam = publishedExams.find(
      ex => ex.token.trim().toUpperCase() === cleanExamToken
    );

    if (!matchedExam) {
      setErrorMessage('Token Mapel tidak valid atau jadwal mata pelajaran tersebut belum dibuka oleh guru/operator.');
      return;
    }

    // 4. Validate Exam Schedule (Tanggal dan Jam Mulai s.d Selesai)
    const scheduleInfo = getExamScheduleStatus(matchedExam);
    if (!scheduleInfo.isAccessible) {
      if (scheduleInfo.status === 'upcoming') {
        setErrorMessage(
          `JADWAL UJIAN BELUM DIBUKA: Ujian "${matchedExam.title}" (${matchedExam.subject}) baru akan dibuka pada ${formatExamDateTime(matchedExam.startDate)}. Silakan tunggu hingga jadwal pelaksanaan tiba.`
        );
      } else if (scheduleInfo.status === 'ended') {
        setErrorMessage(
          `JADWAL UJIAN TELAH BERAKHIR: Batas waktu pelaksanaan untuk ujian "${matchedExam.title}" (${matchedExam.subject}) telah berakhir pada ${formatExamDateTime(matchedExam.endDate)}. Akses pengerjaan telah ditutup.`
        );
      }
      return;
    }

    // 5. Enforce 1x Attempt Rule: Check if student already submitted this exam
    const isAlreadyCompleted = 
      Boolean(currentStudent.completedExamIds?.includes(matchedExam.id)) ||
      examSessions.some(
        s => (s.studentId === currentStudent.id || s.nisn === currentStudent.nisn) &&
             s.examId === matchedExam.id &&
             s.status !== 'working'
      );

    if (isAlreadyCompleted) {
      setErrorMessage(
        `KESEMPATAN 1x TELAH DIGUNAKAN: Siswa atas nama "${currentStudent.name}" sudah pernah menyelesaikan dan mengumpulkan lembar jawaban untuk ujian "${matchedExam.title}". Setiap siswa hanya memiliki 1 kali kesempatan mengerjakan soal yang sama. Anda tidak dapat mengerjakan ulang ujian ini kecuali kode token login akun Anda di-reset oleh Master Operator.`
      );
      return;
    }

    // All checks pass -> proceed to exam
    onLoginSuccess(currentStudent, matchedExam);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6">
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt EduSecure CBT" 
            className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" 
          />
          <h2 className="text-xl font-bold text-slate-900">Masuk Laman Ujian Siswa</h2>
          <p className="text-xs text-slate-500 mt-1">
            SmanGt EduSecure CBT · Masukkan Token Siswa dan Token Mapel ujian
          </p>
        </div>

        {/* Account Disabled Banner by Operator */}
        {isAccountDisabled && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-400 text-xs text-rose-900 space-y-1.5 animate-pulse shadow-xs">
            <div className="flex items-center gap-2 font-black text-rose-700">
              <UserX className="w-4 h-4 text-rose-600" />
              <span>AKUN DINONAKTIFKAN OLEH OPERATOR ({currentStudent?.room || 'Ruang Ujian'})</span>
            </div>
            <p className="leading-relaxed">
              Akun atas nama <strong>{currentStudent?.name}</strong> pada ruangan <strong>{currentStudent?.room || 'Ruang 1'}</strong> sedang dinonaktifkan oleh Operator CBT.
            </p>
            <p className="text-[11px] text-slate-600">
              Akun siswa lainnya di ruangan ini maupun di ruangan lain tetap aktif secara normal.
            </p>
            <p className="font-semibold text-rose-950 text-[11px] pt-1 border-t border-rose-200">
              Silakan segera hubungi Pengawas / Master Operator untuk mengaktifkan kembali akun Anda.
            </p>
          </div>
        )}

        {/* Lockout Warning Banner if currently selected student is locked out */}
        {isStudentLocked && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-800 space-y-1.5 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-rose-700">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>AKUN TERKUNCI (MELEBIHI BATAS PELANGGARAN)</span>
            </div>
            <p className="leading-relaxed">
              Akun atas nama <strong>{currentStudent?.name}</strong> tidak diizinkan masuk ke laman ujian karena tercatat melakukan pelanggaran keamanan melebihi batas.
            </p>
            <p className="font-semibold text-rose-900 text-[11px] pt-1 border-t border-rose-200">
              Silakan segera melapor ke Master Operator / Proktor untuk verifikasi dan pembukaan kunci (Reset Lockout).
            </p>
          </div>
        )}

        {errorMessage && !isStudentLocked && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-bold">Akses Ditolak: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <div className="text-center py-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-4 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Belum Ada Akun Siswa Terdaftar</span>
              Seluruh data siswa belum tersedia di sistem. Silakan masuk ke <strong>Laman Operator</strong> untuk menambahkan atau mengimpor data siswa baru menggunakan file format Excel (.xlsx / .csv).
            </div>
            <button
              type="button"
              onClick={onBackToPortal}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Kembali ke Portal Utama
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Filter Kelas & Pilih Nama Siswa */}
            <div className="space-y-3 p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Identitas Peserta Didik</span>
                </label>
                {availableClasses.length > 1 && (
                  <span className="text-[11px] text-slate-500">
                    Filter Kelas:
                  </span>
                )}
              </div>

              {availableClasses.length > 1 && (
                <div>
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Kelas ({students.length} Siswa)</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pilih Nama Siswa (Sesuai NISN):
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setStudentTokenInput('');
                    setExamTokenInput('');
                    setErrorMessage('');
                  }}
                  className={`w-full px-3 py-2.5 text-xs rounded-lg font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isStudentLocked 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {filteredStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — NISN: {st.nisn} ({st.className}) {st.isLockedOut || st.status === 'blocked' ? '⚠️ [TERKUNCI]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {currentStudent && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Asal Sekolah: <strong>{currentStudent.school}</strong></span>
                  <span className="text-slate-600">
                    Kelas: <strong>{currentStudent.className}</strong> · Ruang: <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{currentStudent.room || 'Ruang 1'}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Input 1: Token Siswa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ketik Token Siswa (Token Unik Peserta)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Wajib Diisi Manual
                </span>
              </div>
              <input
                type="text"
                value={studentTokenInput}
                onChange={(e) => {
                  setStudentTokenInput(e.target.value.toUpperCase());
                  setErrorMessage('');
                }}
                placeholder="Ketik token unik siswa Anda (Contoh: SISWA-****)"
                className="w-full px-3.5 py-2.5 text-xs uppercase font-mono font-bold tracking-wider bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="off"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ketik token unik yang tercantum pada kartu peserta ujian atau diberikan oleh proktor/operator.
              </p>
            </div>

            {/* Input 2: Token Mapel */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ketik Token Mapel (Kode Akses Ujian)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Wajib Diisi Manual
                </span>
              </div>
              <input
                type="text"
                value={examTokenInput}
                onChange={(e) => {
                  setExamTokenInput(e.target.value.toUpperCase());
                  setErrorMessage('');
                }}
                placeholder="Ketik token mata pelajaran ujian"
                className="w-full px-3.5 py-2.5 text-xs uppercase font-mono font-bold tracking-wider bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                autoComplete="off"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dapatkan token mata pelajaran dari guru pengampu atau pengawas ruang ujian saat sesi dimulai.
              </p>
            </div>

            {/* Informasi Jadwal Ujian Tersedia */}
            {publishedExams.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Jadwal Pelaksanaan Ujian Resmi</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {publishedExams.length} Mata Pelajaran
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {publishedExams.map(ex => {
                    const sched = getExamScheduleStatus(ex);
                    return (
                      <div key={ex.id} className="text-[11px] p-2 bg-white rounded-lg border border-slate-200/60 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{ex.subject}</span>
                          <span className="text-slate-500 text-[10px] block truncate">
                            {ex.enableSchedule !== false && ex.startDate && ex.endDate
                              ? `${formatExamDateTime(ex.startDate)} s.d ${formatExamDateTime(ex.endDate)}`
                              : 'Bebas jadwal (dapat diakses kapan saja)'}
                          </span>
                        </div>
                        <div className="shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${sched.badgeBg} ${sched.badgeText} ${sched.badgeBorder}`}>
                            {sched.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isStudentLocked}
                className={`w-full py-3 px-4 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
                  isStudentLocked
                    ? 'bg-slate-400 cursor-not-allowed opacity-75'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg cursor-pointer'
                }`}
              >
                {isStudentLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Akun Terkunci - Hubungi Operator</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Verifikasi & Masuk Laman Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBackToPortal}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Kembali ke Portal Utama
          </button>
          <span className="text-[11px] text-slate-400 font-mono">SmanGt EduSecure CBT Engine</span>
        </div>
      </div>
    </div>
  );
};
