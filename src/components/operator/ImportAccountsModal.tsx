/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Student, Teacher } from '../../types/exam';
import { 
  parseStudentsFromXlsx, 
  parseTeachersFromXlsx, 
  downloadStudentTemplateExcel, 
  downloadTeacherTemplateExcel,
  generateUniqueTeacherToken,
  generateUniqueStudentToken,
  ParsedStudentItem,
  ParsedTeacherItem
} from '../../utils/importer';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  GraduationCap,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ImportAccountsModalProps {
  existingStudents: Student[];
  existingTeachers: Teacher[];
  onImportStudents: (students: Student[]) => void;
  onImportTeachers: (teachers: Teacher[]) => void;
  onClose: () => void;
  initialMode?: 'students' | 'teachers';
}

export const ImportAccountsModal: React.FC<ImportAccountsModalProps> = ({
  existingStudents,
  existingTeachers,
  onImportStudents,
  onImportTeachers,
  onClose,
  initialMode = 'students',
}) => {
  const [accountType, setAccountType] = useState<'students' | 'teachers'>(initialMode);
  const [rawText, setRawText] = useState<string>('');
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentItem[]>([]);
  const [parsedTeachers, setParsedTeachers] = useState<ParsedTeacherItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);

  // Load sample dataset
  const handleLoadSample = () => {
    if (accountType === 'students') {
      setRawText(
`No;NISN;Nama Siswa;Kelas;Sekolah;Token Siswa (Opsional)
1;0078912340;Fajar Hidayatullah;XII MIPA 3;SMA Negeri Unggulan 1;SISWA-7821
2;0084567891;Zahra Amalia;XII MIPA 3;SMA Negeri Unggulan 1;SISWA-4419
3;0073216549;Bagas Wicaksono;XI RPL 1;SMK Teknologi Informatika;SISWA-6023
4;0069874512;Tiara Maharani;XII IPS 2;SMA Negeri Unggulan 1;SISWA-9150
5;0056123478;Dimas Aditya;XI TKJ 2;SMK Teknologi Informatika;SISWA-3382
6;0071122334;Amanda Safitri;XII MIPA 2;SMA Negeri Unggulan 1;SISWA-8204`
      );
    } else {
      setRawText(
`No;NIP;Nama Guru;Mata Pelajaran;Email
1;19870312 201101 1 003;Drs. Bambang Hidayat, M.Si;Fisika Terapan;bambang.hidayat@sekolah.sch.id
2;19920824 201802 2 006;Anisa Wulandari, S.Pd;Bahasa Inggris;anisa.wulandari@sekolah.sch.id
3;19851110 200903 1 005;Eko Prasetyo, M.Kom;Kecerdasan Buatan & Web;eko.prasetyo@sekolah.sch.id
4;19900415 201502 2 011;Nurul Fatimah, S.Pd;Kimia Organik;nurul.fatimah@sekolah.sch.id`
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (isXlsx) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = evt.target?.result as ArrayBuffer;
            if (data) {
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
              setRawText(csv);
            }
          } catch (err: any) {
            setErrors([`Gagal membaca file Excel: ${err.message}`]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result;
          if (typeof text === 'string') {
            setRawText(text);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleParse = () => {
    setErrors([]);
    if (accountType === 'students') {
      const res = parseStudentsFromXlsx(rawText);
      setParsedStudents(res.students);
      setErrors(res.errors);
      setHasParsed(true);
    } else {
      const res = parseTeachersFromXlsx(rawText);
      setParsedTeachers(res.teachers);
      setErrors(res.errors);
      setHasParsed(true);
    }
  };

  const handleConfirmImport = () => {
    if (accountType === 'students') {
      if (parsedStudents.length === 0) return;

      const newStudentEntries: Student[] = parsedStudents.map((ps, idx) => {
        // If student NISN already exists, update info
        const existing = existingStudents.find(s => s.nisn === ps.nisn);
        const finalToken = ps.token || existing?.token || generateUniqueStudentToken();
        if (existing) {
          return {
            ...existing,
            name: ps.name,
            className: ps.className,
            school: ps.school,
            token: finalToken,
          };
        }
        return {
          id: `s-imp-${Date.now()}-${idx}`,
          nisn: ps.nisn,
          name: ps.name,
          className: ps.className,
          school: ps.school,
          token: finalToken,
          status: 'ready',
          lastLogin: 'Belum Pernah Login',
        };
      });

      // Merge by NISN
      const merged = [...existingStudents];
      newStudentEntries.forEach(ns => {
        const index = merged.findIndex(s => s.nisn === ns.nisn);
        if (index >= 0) {
          merged[index] = ns;
        } else {
          merged.push(ns);
        }
      });

      onImportStudents(merged);
      onClose();
    } else {
      if (parsedTeachers.length === 0) return;

      const newTeacherEntries: Teacher[] = parsedTeachers.map((pt, idx) => {
        const existing = existingTeachers.find(t => t.nip === pt.nip);
        const resolvedToken = (pt.token && pt.token.trim()) || existing?.token || generateUniqueTeacherToken();
        if (existing) {
          return {
            ...existing,
            name: pt.name,
            subject: pt.subject,
            email: pt.email,
            token: resolvedToken,
          };
        }
        return {
          id: `t-imp-${Date.now()}-${idx}`,
          nip: pt.nip,
          name: pt.name,
          subject: pt.subject,
          email: pt.email,
          token: resolvedToken,
        };
      });

      // Merge by NIP
      const merged = [...existingTeachers];
      newTeacherEntries.forEach(nt => {
        const index = merged.findIndex(t => t.nip === nt.nip);
        if (index >= 0) {
          merged[index] = nt;
        } else {
          merged.push(nt);
        }
      });

      onImportTeachers(merged);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Tool Import Akun Format Excel / XLSX (.csv)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Impor massal akun siswa dan guru dengan cepat menggunakan file spreadsheet Excel atau CSV.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Type Selector Tab */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => {
              setAccountType('students');
              setRawText('');
              setParsedStudents([]);
              setParsedTeachers([]);
              setHasParsed(false);
              setErrors([]);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'students'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Import Akun Siswa (NISN, Nama, Kelas, Sekolah)</span>
          </button>
          <button
            onClick={() => {
              setAccountType('teachers');
              setRawText('');
              setParsedStudents([]);
              setParsedTeachers([]);
              setHasParsed(false);
              setErrors([]);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'teachers'
                ? 'bg-white text-indigo-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Import Akun Guru (NIP, Nama, Mapel, Email)</span>
          </button>
        </div>

        {/* Toolbar: Template & Sample */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md font-medium text-slate-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Excel/CSV</span>
              <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md font-medium text-slate-700 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Muat Contoh Data</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (accountType === 'students') {
                downloadStudentTemplateExcel();
              } else {
                downloadTeacherTemplateExcel();
              }
            }}
            className="px-3 py-1.5 text-emerald-800 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {accountType === 'students' ? 'Unduh Format Excel Siswa (.csv)' : 'Unduh Format Excel Guru (.csv)'}
            </span>
          </button>
        </div>

        {/* Data Input Textarea */}
        <div className="mb-4">
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              accountType === 'students'
                ? "Tempelkan data tabel siswa dari Excel di sini (pisahkan titik koma ';' atau koma ',')...\nFormat: No; NISN; Nama Siswa; Kelas; Sekolah\nContoh: 1;0078912340;Fajar Hidayatullah;XII MIPA 3;SMA Negeri Unggulan 1"
                : "Tempelkan data tabel guru dari Excel di sini...\nFormat: No; NIP; Nama Guru; Mata Pelajaran; Email\nContoh: 1;19870312 201101 1 003;Drs. Bambang Hidayat, M.Si;Fisika Terapan;bambang@sekolah.sch.id"
            }
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Button for Parsing */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Analisis & Validasi Kolom Excel</span>
          </button>

          {hasParsed && (
            <span className="text-xs text-slate-700 font-semibold">
              Terdeteksi:{' '}
              <strong className="text-emerald-600 font-mono">
                {accountType === 'students' ? parsedStudents.length : parsedTeachers.length} Akun Valid
              </strong>
            </span>
          )}
        </div>

        {/* Error notification */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>Catatan Format:</span>
            </div>
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        {/* Preview Table: Students */}
        {hasParsed && accountType === 'students' && parsedStudents.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No</th>
                  <th className="py-2 px-3">NISN</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3">Kelas</th>
                  <th className="py-2 px-3">Token Siswa</th>
                  <th className="py-2 px-3">Sekolah</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsedStudents.map((st, i) => {
                  const isExisting = existingStudents.some(s => s.nisn === st.nisn);
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{st.nisn}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-2 px-3 text-slate-600">{st.className}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-blue-700 font-bold">{st.token || 'AUTO'}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">{st.school}</td>
                      <td className="py-2 px-3">
                        {isExisting ? (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                            Update
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            Baru
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Preview Table: Teachers */}
        {hasParsed && accountType === 'teachers' && parsedTeachers.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No</th>
                  <th className="py-2 px-3">NIP</th>
                  <th className="py-2 px-3">Nama Guru</th>
                  <th className="py-2 px-3">Mata Pelajaran</th>
                  <th className="py-2 px-3">Token Guru</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsedTeachers.map((tc, i) => {
                  const isExisting = existingTeachers.some(t => t.nip === tc.nip);
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700">{tc.nip}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{tc.name}</td>
                      <td className="py-2 px-3 text-slate-600">{tc.subject}</td>
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700 bg-indigo-50/50">{tc.token || 'AUTO'}</td>
                      <td className="py-2 px-3">
                        {isExisting ? (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                            Update
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            Baru
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={accountType === 'students' ? parsedStudents.length === 0 : parsedTeachers.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Simpan & Daftarkan{' '}
              {accountType === 'students' ? `${parsedStudents.length} Siswa` : `${parsedTeachers.length} Guru`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
