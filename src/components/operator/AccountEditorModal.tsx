/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, Teacher, AVAILABLE_EXAM_ROOMS } from '../../types/exam';
import { generateUniqueTeacherToken, generateUniqueStudentToken } from '../../utils/importer';
import { X, CheckCircle2, User, GraduationCap, ShieldAlert, KeyRound, RefreshCw, Lock, Unlock } from 'lucide-react';

interface AccountEditorModalProps {
  type: 'student' | 'teacher';
  student?: Student | null;
  teacher?: Teacher | null;
  onSaveStudent?: (student: Student) => void;
  onSaveTeacher?: (teacher: Teacher) => void;
  onClose: () => void;
}

export const AccountEditorModal: React.FC<AccountEditorModalProps> = ({
  type,
  student,
  teacher,
  onSaveStudent,
  onSaveTeacher,
  onClose,
}) => {
  // Student state
  const [nisn, setNisn] = useState<string>(student?.nisn || '');
  const [studentName, setStudentName] = useState<string>(student?.name || '');
  const [className, setClassName] = useState<string>(student?.className || 'XII MIPA 1');
  const [room, setRoom] = useState<string>(student?.room || 'Ruang 1');
  const [school, setSchool] = useState<string>(student?.school || 'SMA Negeri Unggulan 1');
  const [studentToken, setStudentToken] = useState<string>(student?.token || generateUniqueStudentToken());
  const [isLockedOut, setIsLockedOut] = useState<boolean>(Boolean(student?.isLockedOut || student?.status === 'blocked'));
  const [status, setStatus] = useState<'ready' | 'working' | 'finished' | 'blocked'>(student?.status || 'ready');

  // Teacher state
  const [nip, setNip] = useState<string>(teacher?.nip || '');
  const [teacherName, setTeacherName] = useState<string>(teacher?.name || '');
  const [subject, setSubject] = useState<string>(teacher?.subject || 'Biologi');
  const [email, setEmail] = useState<string>(teacher?.email || '');
  const [teacherToken, setTeacherToken] = useState<string>(teacher?.token || generateUniqueTeacherToken());

  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (type === 'student') {
      if (!nisn.trim() || !studentName.trim()) {
        setErrorMsg('NISN dan Nama Siswa wajib diisi.');
        return;
      }

      const finalToken = (studentToken.trim() || generateUniqueStudentToken()).toUpperCase();
      const updatedStudent: Student = {
        id: student?.id || `s-man-${Date.now()}`,
        nisn: nisn.trim(),
        name: studentName.trim(),
        className: className.trim(),
        room: room.trim() || 'Ruang 1',
        school: school.trim(),
        token: finalToken,
        status: isLockedOut ? 'blocked' : (status === 'blocked' ? 'ready' : status),
        isLockedOut: isLockedOut,
        lockoutReason: isLockedOut ? (student?.lockoutReason || 'Terkunci karena pelanggaran sistem integritas ujian') : undefined,
        lastLogin: student?.lastLogin || 'Baru Didaftarkan',
      };

      onSaveStudent?.(updatedStudent);
      onClose();
    } else {
      if (!nip.trim() || !teacherName.trim()) {
        setErrorMsg('NIP dan Nama Guru wajib diisi.');
        return;
      }

      const defaultEmail = email.trim() || `${teacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`;
      const finalToken = (teacherToken.trim() || generateUniqueTeacherToken()).toUpperCase();

      const updatedTeacher: Teacher = {
        id: teacher?.id || `t-man-${Date.now()}`,
        nip: nip.trim(),
        name: teacherName.trim(),
        subject: subject.trim(),
        email: defaultEmail,
        token: finalToken,
      };

      onSaveTeacher?.(updatedTeacher);
      onClose();
    }
  };

  const isEditing = type === 'student' ? Boolean(student) : Boolean(teacher);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              type === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {type === 'student' ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing 
                  ? (type === 'student' ? 'Edit Akun Siswa' : 'Edit Akun Guru') 
                  : (type === 'student' ? 'Tambah Akun Siswa Baru' : 'Tambah Akun Guru Baru')}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'student' ? 'Perbarui profil dan status akses ujian siswa' : 'Perbarui profil dan hak akses guru pengampu'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {type === 'student' ? (
            /* STUDENT FORM */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0071234567"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Contoh: XII MIPA 1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penempatan Ruang Ujian
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                  >
                    {AVAILABLE_EXAM_ROOMS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Akun
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="ready">Aktif (Siap Ujian)</option>
                  <option value="working">Sedang Mengerjakan</option>
                  <option value="finished">Selesai</option>
                  <option value="blocked">Terkunci (Pelanggaran)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sekolah / Asal Institusi
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Contoh: SMA Negeri Unggulan 1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Token Unik Siswa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Token Akses Masuk Siswa</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStudentToken(generateUniqueStudentToken())}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Baru</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentToken}
                    onChange={(e) => setStudentToken(e.target.value.toUpperCase())}
                    placeholder="Contoh: SISWA-7821"
                    className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Token ini wajib dimasukkan oleh siswa saat akan masuk ke laman ujian.
                </p>
              </div>

              {/* Status Lockout Pelanggaran */}
              <div className={`p-3 rounded-xl border text-xs ${
                isLockedOut 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    {isLockedOut ? (
                      <Lock className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{isLockedOut ? 'Akun Terkunci (Pelanggaran)' : 'Akses Ujian Normal'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isLockedOut) {
                        setIsLockedOut(false);
                        setStatus('ready');
                      } else {
                        setIsLockedOut(true);
                        setStatus('blocked');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      isLockedOut 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isLockedOut ? 'Buka Kunci Akun' : 'Kunci Akun'}
                  </button>
                </div>
                {isLockedOut && (
                  <p className="text-[11px] text-rose-600 mt-1.5 leading-relaxed">
                    Siswa tidak dapat masuk ke laman ujian sebelum kunci dibuka oleh operator.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* TEACHER FORM */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19840215 200801 2 004"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Guru & Gelar
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Contoh: Ibu Ratna Dewi, M.Pd"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran Pengampu
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Biologi & Ilmu Hayati"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: ratnadewi@sekolah.sch.id"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Token Unik Akses Guru</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTeacherToken(generateUniqueTeacherToken())}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    title="Generate token acak baru"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Token Baru</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={teacherToken}
                  onChange={(e) => setTeacherToken(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU-7712"
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider bg-indigo-50/50 border border-indigo-200 rounded-lg text-indigo-900 focus:ring-2 focus:ring-indigo-500 uppercase"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Token ini digunakan guru untuk masuk ke Laman Dashboard Guru masing-masing. Dapat diedit atau direset kapan saja oleh Operator.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm ${
                type === 'student' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Daftarkan Akun'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
