/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Student, Exam, ExamSession, Teacher } from '../../types/exam';
import { 
  FileText, 
  Printer, 
  Search, 
  CheckSquare, 
  Square, 
  Download, 
  Check, 
  Building, 
  User, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  DoorOpen,
  Filter,
  Eye,
  List,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentResultsRecapViewProps {
  students: Student[];
  exams: Exam[];
  examSessions: ExamSession[];
  operatorName: string;
  teachers: Teacher[];
}

interface StudentExamResultItem {
  exam: Exam;
  session?: ExamSession;
  status: 'submitted' | 'force_submitted' | 'working' | 'blocked' | 'not_started';
  score: number;
  maxScore: number;
  percentage: number;
  predicate: { grade: string; label: string; color: string };
  violationsCount: number;
  submittedAt: string;
}

interface StudentFullRecap {
  student: Student;
  results: StudentExamResultItem[];
  totalExams: number;
  completedExams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalViolations: number;
  overallPredicate: { grade: string; label: string; color: string };
}

function getGradePredicate(percentage: number) {
  if (percentage >= 88) {
    return { grade: 'A', label: 'Sangat Baik', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (percentage >= 75) {
    return { grade: 'B', label: 'Baik', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (percentage >= 65) {
    return { grade: 'C', label: 'Cukup', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { grade: 'D', label: 'Perlu Remedial', color: 'text-rose-700 bg-rose-50 border-rose-200' };
}

export const StudentResultsRecapView: React.FC<StudentResultsRecapViewProps> = ({
  students,
  exams,
  examSessions,
  operatorName,
  teachers,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'documents'>('table');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => students.map(s => s.id));
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Available classes & rooms
  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();
  }, [students]);

  const availableRooms = useMemo(() => {
    return Array.from(new Set(students.map(s => s.room || 'Ruang 1').filter(Boolean))).sort();
  }, [students]);

  // Compute full recaps for all students
  const studentRecapsMap = useMemo(() => {
    const map = new Map<string, StudentFullRecap>();

    students.forEach(st => {
      let completedCount = 0;
      let totalEarnedScore = 0;
      let totalMaxScore = 0;
      let highest = 0;
      let lowest = 100;
      let totalViolations = 0;

      const results: StudentExamResultItem[] = exams.map(ex => {
        // Find session for this student and exam
        const session = examSessions.find(
          s => (s.studentId === st.id || s.nisn === st.nisn) && s.examId === ex.id
        );

        if (session) {
          const max = session.maxScore || ex.questions.reduce((acc, q) => acc + (q.score || 10), 0) || 100;
          const score = session.score || 0;
          const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
          const violationsCount = session.violations?.length || 0;
          totalViolations += violationsCount;

          if (session.status === 'submitted' || session.status === 'force_submitted') {
            completedCount++;
            totalEarnedScore += percentage;
            totalMaxScore += 100;
            if (percentage > highest) highest = percentage;
            if (percentage < lowest) lowest = percentage;
          }

          return {
            exam: ex,
            session,
            status: session.status,
            score,
            maxScore: max,
            percentage,
            predicate: getGradePredicate(percentage),
            violationsCount,
            submittedAt: session.endTime 
              ? new Date(session.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
              : 'Aktif Mengerjakan',
          };
        } else {
          const max = ex.questions.reduce((acc, q) => acc + (q.score || 10), 0) || 100;
          return {
            exam: ex,
            status: 'not_started',
            score: 0,
            maxScore: max,
            percentage: 0,
            predicate: getGradePredicate(0),
            violationsCount: 0,
            submittedAt: 'Belum Mengerjakan',
          };
        }
      });

      const averageScore = completedCount > 0 ? Math.round(totalEarnedScore / completedCount) : 0;
      if (completedCount === 0) {
        lowest = 0;
      }

      map.set(st.id, {
        student: st,
        results,
        totalExams: exams.length,
        completedExams: completedCount,
        averageScore,
        highestScore: highest,
        lowestScore: lowest,
        totalViolations,
        overallPredicate: getGradePredicate(averageScore),
      });
    });

    return map;
  }, [students, exams, examSessions]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchClass = selectedClass === 'all' || st.className === selectedClass;
      const matchRoom = selectedRoom === 'all' || (st.room || 'Ruang 1') === selectedRoom;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = 
        !q || 
        st.name.toLowerCase().includes(q) || 
        st.nisn.includes(q);

      return matchClass && matchRoom && matchQuery;
    });
  }, [students, selectedClass, selectedRoom, searchQuery]);

  // Selected students for printing / action
  const selectedStudents = useMemo(() => {
    return students.filter(st => selectedStudentIds.includes(st.id));
  }, [students, selectedStudentIds]);

  // Selection handlers
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectVisible = () => {
    const visibleIdsSet = new Set(filteredStudents.map(s => s.id));
    setSelectedStudentIds(prev => prev.filter(id => !visibleIdsSet.has(id)));
  };

  const handleSelectAllGlobal = () => {
    setSelectedStudentIds(students.map(s => s.id));
  };

  const handleDeselectAllGlobal = () => {
    setSelectedStudentIds([]);
  };

  const handleSelectSpecificClass = (className: string) => {
    const classStudentIds = students.filter(s => s.className === className).map(s => s.id);
    setSelectedStudentIds(classStudentIds);
    setSelectedClass(className);
  };

  // Export recap table to Excel XLSX
  const handleExportExcelRecap = () => {
    const rows = filteredStudents.map((st, idx) => {
      const recap = studentRecapsMap.get(st.id);
      const rowData: Record<string, any> = {
        'No': idx + 1,
        'Nama Siswa': st.name,
        'NISN': st.nisn,
        'Kelas': st.className,
        'Ruang': st.room || 'Ruang 1',
        'Asal Sekolah': st.school,
        'Total Ujian': exams.length,
        'Ujian Selesai': recap?.completedExams || 0,
        'Rata-rata Nilai': recap?.averageScore || 0,
        'Predikat Umum': recap?.overallPredicate.label || '-',
      };

      // Add each subject score
      exams.forEach(ex => {
        const item = recap?.results.find(r => r.exam.id === ex.id);
        const colKey = `${ex.subject} (${ex.title})`;
        if (item && (item.status === 'submitted' || item.status === 'force_submitted')) {
          rowData[colKey] = item.percentage;
        } else if (item && item.status === 'working') {
          rowData[colKey] = 'Sedang Ujian';
        } else {
          rowData[colKey] = 'Belum Ujian';
        }
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Hasil_Semua_Mapel');
    XLSX.writeFile(workbook, `Rekap_Hasil_Asesmen_SmanGt_EduSecure_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Generate printable HTML documents
  const handlePrintDocuments = (targetStudentIds?: string[]) => {
    const printIds = targetStudentIds || selectedStudentIds;
    const studentsToPrint = students.filter(s => printIds.includes(s.id));
    if (studentsToPrint.length === 0) return;

    setIsPrinting(true);

    const logoUrl = 'https://iili.io/f0D1nQs.png';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Dokumen Rekap Hasil Ujian Siswa - SmanGt EduSecure CBT</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #0f172a;
            font-size: 11pt;
            line-height: 1.4;
          }
          .student-document {
            page-break-after: always;
            padding-bottom: 20px;
          }
          .student-document:last-child {
            page-break-after: auto;
          }
          .doc-header {
            display: flex;
            align-items: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 16px;
            gap: 16px;
          }
          .doc-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            flex: 1;
          }
          .school-name {
            font-size: 14pt;
            font-weight: 800;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .doc-title {
            font-size: 12pt;
            font-weight: 700;
            margin: 3px 0;
            text-transform: uppercase;
            color: #1e3a8a;
          }
          .doc-subtitle {
            font-size: 9.5pt;
            margin: 0;
            color: #475569;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 10pt;
          }
          .meta-table td {
            padding: 3px 4px;
            vertical-align: top;
          }
          .meta-table td.lbl {
            width: 130px;
            font-weight: 600;
            color: #334155;
          }
          .meta-table td.sep {
            width: 10px;
            text-align: center;
          }
          .meta-table td.val {
            font-weight: 700;
            color: #0f172a;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 9.5pt;
          }
          .results-table th, .results-table td {
            border: 1px solid #1e293b;
            padding: 6px 8px;
            text-align: left;
          }
          .results-table th {
            background-color: #f1f5f9;
            font-weight: 700;
            text-align: center;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .summary-box {
            display: flex;
            justify-content: space-between;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 9.5pt;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item span {
            display: block;
            font-size: 8pt;
            color: #64748b;
          }
          .summary-item strong {
            font-size: 12pt;
            color: #0f172a;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 36px;
            font-size: 10pt;
            text-align: center;
          }
          .sign-col {
            width: 45%;
          }
          .sign-space {
            height: 55px;
          }
          .sign-name {
            font-weight: 700;
            text-decoration: underline;
          }
          .badge-status {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
            display: inline-block;
          }
          .integrity-seal {
            font-size: 8pt;
            color: #059669;
            margin-top: 6px;
            text-align: center;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        ${studentsToPrint.map(st => {
          const recap = studentRecapsMap.get(st.id);
          return `
            <div class="student-document">
              <div class="doc-header">
                <img src="${logoUrl}" alt="Logo" class="doc-logo" />
                <div class="header-text">
                  <h2 class="school-name">${st.school || 'SMA NEGERI UNGGULAN'}</h2>
                  <h3 class="doc-title">LEMBAR LAPORAN HASIL ASESMEN BERBASIS KOMPUTER (CBT)</h3>
                  <p class="doc-subtitle">Sistem Ujian Terproteksi Anti-Curang SmanGt EduSecure CBT</p>
                </div>
              </div>

              <table class="meta-table">
                <tr>
                  <td class="lbl">Nama Peserta Didik</td>
                  <td class="sep">:</td>
                  <td class="val">${st.name}</td>
                  <td class="lbl" style="padding-left: 20px;">Kelas</td>
                  <td class="sep">:</td>
                  <td class="val">${st.className}</td>
                </tr>
                <tr>
                  <td class="lbl">NISN</td>
                  <td class="sep">:</td>
                  <td class="val">${st.nisn}</td>
                  <td class="lbl" style="padding-left: 20px;">Ruang Ujian</td>
                  <td class="sep">:</td>
                  <td class="val">${st.room || 'Ruang 1'}</td>
                </tr>
                <tr>
                  <td class="lbl">Token Login Siswa</td>
                  <td class="sep">:</td>
                  <td class="val" style="font-family: monospace;">${st.token}</td>
                  <td class="lbl" style="padding-left: 20px;">Status Asesmen</td>
                  <td class="sep">:</td>
                  <td class="val">${recap?.completedExams || 0} dari ${exams.length} Mapel Selesai</td>
                </tr>
              </table>

              <table class="results-table">
                <thead>
                  <tr>
                    <th style="width: 30px;">No</th>
                    <th>Mata Pelajaran & Judul Ujian</th>
                    <th>Guru Pengampu</th>
                    <th style="width: 110px;">Status</th>
                    <th style="width: 80px;">Skor / Poin</th>
                    <th style="width: 60px;">Nilai (100)</th>
                    <th style="width: 70px;">Predikat</th>
                  </tr>
                </thead>
                <tbody>
                  ${recap?.results.map((res, i) => `
                    <tr>
                      <td class="text-center">${i + 1}</td>
                      <td>
                        <strong>${res.exam.subject}</strong><br>
                        <span style="font-size: 8.5pt; color: #475569;">${res.exam.title} (${res.exam.grade})</span>
                      </td>
                      <td>${res.exam.teacherName}</td>
                      <td class="text-center">
                        ${res.status === 'submitted' || res.status === 'force_submitted' 
                          ? '<span style="color: #047857; font-weight: bold;">Selesai</span>' 
                          : res.status === 'working' 
                          ? '<span style="color: #d97706; font-weight: bold;">Sedang Ujian</span>'
                          : '<span style="color: #64748b;">Belum Mengerjakan</span>'}
                      </td>
                      <td class="text-center font-mono">
                        ${res.status === 'submitted' || res.status === 'force_submitted' 
                          ? `${res.score} / ${res.maxScore}` 
                          : '-'}
                      </td>
                      <td class="text-center" style="font-weight: bold; font-size: 10pt;">
                        ${res.status === 'submitted' || res.status === 'force_submitted' 
                          ? res.percentage 
                          : '-'}
                      </td>
                      <td class="text-center" style="font-weight: bold;">
                        ${res.status === 'submitted' || res.status === 'force_submitted' 
                          ? `${res.predicate.grade} (${res.predicate.label})` 
                          : '-'}
                      </td>
                    </tr>
                  `).join('') || `<tr><td colspan="7" class="text-center">Belum ada paket ujian terdaftar</td></tr>`}
                </tbody>
              </table>

              <div class="summary-box">
                <div class="summary-item">
                  <span>TOTAL MAPEL</span>
                  <strong>${exams.length} Ujian</strong>
                </div>
                <div class="summary-item">
                  <span>MAPEL DISELESAIKAN</span>
                  <strong style="color: #047857;">${recap?.completedExams || 0} Ujian</strong>
                </div>
                <div class="summary-item">
                  <span>RATA-RATA NILAI</span>
                  <strong style="color: #1e3a8a; font-size: 13pt;">${recap?.averageScore || 0}</strong>
                </div>
                <div class="summary-item">
                  <span>NILAI TERTINGGI</span>
                  <strong style="color: #047857;">${recap?.highestScore || 0}</strong>
                </div>
                <div class="summary-item">
                  <span>PREDIKAT UMUM</span>
                  <strong>${recap?.overallPredicate.grade} (${recap?.overallPredicate.label})</strong>
                </div>
                <div class="summary-item">
                  <span>CATATAN INTEGRITAS</span>
                  <strong style="color: ${recap?.totalViolations ? '#b91c1c' : '#047857'}; font-size: 9.5pt;">
                    ${recap?.totalViolations ? `${recap.totalViolations}x Pelanggaran` : 'Terverifikasi Bersih'}
                  </strong>
                </div>
              </div>

              <div class="integrity-seal">
                Dokumen ini diterbitkan secara otomatis dan terverifikasi oleh Sistem Keamanan Integritas SmanGt EduSecure CBT.
              </div>

              <div class="signatures">
                <div class="sign-col">
                  <div>Mengetahui,</div>
                  <div>Orang Tua / Wali Siswa,</div>
                  <div class="sign-space"></div>
                  <div class="sign-name">( ............................................ )</div>
                </div>

                <div class="sign-col">
                  <div>Ditetapkan pada: ${currentDate}</div>
                  <div>Master Operator CBT & Pengawas,</div>
                  <div class="sign-space"></div>
                  <div class="sign-name">( ${operatorName} )</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Open in a new browser window / tab as requested
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <div class="no-print" style="position: sticky; top: 0; left: 0; right: 0; background: #0f172a; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoUrl}" alt="Logo" style="width: 32px; height: 32px; object-fit: contain;" />
            <div>
              <div style="font-weight: bold; font-size: 14px; letter-spacing: 0.3px;">SmanGt EduSecure CBT · Dokumen Rekap Hasil Ujian Siswa</div>
              <div style="font-size: 11px; color: #94a3b8;">${studentsToPrint.length} Dokumen Siswa Siap Dicetak (1 Siswa = 1 Lembar A4)</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span>🖨️ Cetak / Simpan PDF</span>
            </button>
            <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px;">
              <span>✕ Tutup</span>
            </button>
          </div>
        </div>
        ${htmlContent}
      `);
      printWindow.document.close();
      printWindow.focus();
      setIsPrinting(false);
    } else {
      // Fallback to invisible iframe if popups are completely blocked
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setIsPrinting(false);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 500);
      } else {
        setIsPrinting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Rekap Hasil Ujian Multi-Mapel
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Dokumen Hasil Siswa Lengkap
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Dokumen resmi rekapitulasi nilai komprehensif seluruh mata pelajaran untuk setiap peserta didik. Siap dicetak untuk beberapa siswa, per kelas, atau seluruh siswa.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleExportExcelRecap}
            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Ekspor rekapitulasi nilai seluruh siswa ke format Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrintDocuments()}
            disabled={selectedStudents.length === 0 || isPrinting}
            className={`px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {isPrinting ? 'Menyiapkan...' : `Cetak ${selectedStudents.length} Dokumen Siswa`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NISN siswa..."
              className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
            />
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Kelas ({availableClasses.length})</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {/* Filter Ruang */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Ruang:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-2.5 py-2 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Ruang ({availableRooms.length})</option>
              {availableRooms.map(rm => (
                <option key={rm} value={rm}>{rm}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View mode toggle & Quick selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Select specific class shortcut buttons */}
          {availableClasses.length > 0 && selectedClass !== 'all' && (
            <button
              type="button"
              onClick={() => handleSelectSpecificClass(selectedClass)}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title={`Pilih semua siswa di kelas ${selectedClass}`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pilih Semua Kelas {selectedClass}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Pilih seluruh siswa yang tampil pada filter saat ini"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilih Ditampilkan ({filteredStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAllGlobal}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Pilih seluruh siswa yang terdaftar di sekolah"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilih Semua ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAllGlobal}
            className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Batalkan semua pilihan"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Toggle between Table View & Document Cards Preview */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center ml-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('documents')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'documents' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lembar Dokumen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selection Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1 text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            Status Seleksi: <strong className="text-indigo-700">{selectedStudents.length} dari {students.length} Siswa</strong> siap dicetak.
          </span>
          {selectedClass !== 'all' && (
            <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
              Filter Kelas: {selectedClass}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500">
          💡 Setiap dokumen dicetak pada 1 lembar A4 terpisah dengan tanda tangan resmi & rekap seluruh mapel.
        </span>
      </div>

      {/* MODE 1: TABEL REKAPITULASI RINGKAS */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={selectedStudents.length === filteredStudents.length ? handleDeselectVisible : handleSelectAllVisible}
                      className="cursor-pointer"
                      title="Pilih semua siswa di tabel ini"
                    >
                      {selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 mx-auto" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Identitas Siswa</th>
                  <th className="py-3 px-3">Kelas & Ruang</th>
                  <th className="py-3 px-3 text-center">Progres Ujian</th>
                  <th className="py-3 px-3 text-center">Rata-rata Nilai</th>
                  <th className="py-3 px-3 text-center">Predikat</th>
                  <th className="py-3 px-3 text-center">Integritas</th>
                  <th className="py-3 px-3 text-right">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  const recap = studentRecapsMap.get(st.id);
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <tr 
                      key={st.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(st.id)}
                          className="cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NISN: {st.nisn} · Token: {st.token}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{st.className}</span>
                        <div className="text-[11px] text-indigo-700 font-medium">{st.room || 'Ruang 1'}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800">
                          {recap?.completedExams || 0} / {exams.length}
                        </span>
                        <span className="block text-[10px] text-slate-400">Mapel Selesai</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm font-extrabold text-indigo-900 font-mono">
                          {recap?.averageScore || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${recap?.overallPredicate.color}`}>
                          {recap?.overallPredicate.grade} ({recap?.overallPredicate.label})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {recap?.totalViolations ? (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <span>{recap.totalViolations}x Pelanggaran</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Bersih</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintDocuments([st.id])}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Cetak lembar rekap hasil ujian untuk siswa ini"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Cetak Dokumen</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-400">
              Tidak ada data siswa yang cocok dengan filter atau pencarian Anda.
            </div>
          )}
        </div>
      )}

      {/* MODE 2: PRATINJAU DOKUMEN HASIL ASESMEN LENGKAP */}
      {viewMode === 'documents' && (
        <div className="space-y-6">
          {selectedStudents.map(st => {
            const recap = studentRecapsMap.get(st.id);
            return (
              <div 
                key={st.id}
                className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm relative space-y-6"
              >
                {/* Print button on top right */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintDocuments([st.id])}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Dokumen Ini</span>
                  </button>
                </div>

                {/* Kop Surat Header */}
                <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
                  <img 
                    src="https://iili.io/f0D1nQs.png" 
                    alt="Logo SmanGt" 
                    className="w-14 h-14 object-contain shrink-0" 
                  />
                  <div className="flex-1 text-center pr-28">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                      {st.school || 'SMA NEGERI UNGGULAN'}
                    </h3>
                    <h4 className="text-xs sm:text-sm font-bold text-indigo-900 uppercase">
                      LEMBAR LAPORAN HASIL ASESMEN BERBASIS KOMPUTER (CBT)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Sistem Asesmen Terproteksi Anti-Curang SmanGt EduSecure CBT
                    </p>
                  </div>
                </div>

                {/* Student Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Nama Peserta Didik:</span>
                    <strong className="text-slate-900 text-sm">{st.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Kelas:</span>
                    <strong className="text-blue-700">{st.className}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">NISN:</span>
                    <strong className="font-mono text-slate-800">{st.nisn}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Ruang Ujian:</span>
                    <strong className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {st.room || 'Ruang 1'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Token Login Akun:</span>
                    <strong className="font-mono bg-slate-900 text-amber-300 px-2 py-0.5 rounded text-xs">
                      {st.token}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Status Penyelesaian:</span>
                    <strong className="text-emerald-700">
                      {recap?.completedExams || 0} dari {exams.length} Mapel Selesai
                    </strong>
                  </div>
                </div>

                {/* Table of all subjects and results */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Mata Pelajaran & Judul Ujian</th>
                        <th className="py-2.5 px-3">Guru Pengampu</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Skor / Poin</th>
                        <th className="py-2.5 px-3 text-center">Nilai (100)</th>
                        <th className="py-2.5 px-3 text-center">Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recap?.results.map((res, i) => (
                        <tr key={res.exam.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">{i + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">{res.exam.subject}</span>
                            <span className="block text-[11px] text-slate-500">{res.exam.title} ({res.exam.grade})</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{res.exam.teacherName}</td>
                          <td className="py-2.5 px-3 text-center">
                            {res.status === 'submitted' || res.status === 'force_submitted' ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                Selesai
                              </span>
                            ) : res.status === 'working' ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                Sedang Ujian
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[10px]">
                                Belum Mengerjakan
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                            {res.status === 'submitted' || res.status === 'force_submitted' 
                              ? `${res.score} / ${res.maxScore}` 
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 text-sm">
                            {res.status === 'submitted' || res.status === 'force_submitted' 
                              ? res.percentage 
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {res.status === 'submitted' || res.status === 'force_submitted' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${res.predicate.color}`}>
                                {res.predicate.grade} ({res.predicate.label})
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Statistics Box */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Mapel</span>
                    <span className="text-base font-bold text-slate-900">{exams.length} Mapel</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mapel Selesai</span>
                    <span className="text-base font-bold text-emerald-700">{recap?.completedExams || 0} Mapel</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Rata-rata Nilai</span>
                    <span className="text-lg font-black text-indigo-700">{recap?.averageScore || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Predikat Umum</span>
                    <span className="text-base font-bold text-slate-900">{recap?.overallPredicate.grade} ({recap?.overallPredicate.label})</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Integritas CBT</span>
                    <span className={`text-xs font-bold ${recap?.totalViolations ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {recap?.totalViolations ? `${recap.totalViolations}x Pelanggaran` : 'Bersih 0 Pelanggaran'}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-700">
                  <div>
                    <div>Mengetahui,</div>
                    <div>Orang Tua / Wali Siswa,</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">( ............................................ )</div>
                  </div>
                  <div>
                    <div>Ditetapkan pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                    <div>Master Operator CBT,</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline">( {operatorName} )</div>
                  </div>
                </div>
              </div>
            );
          })}

          {selectedStudents.length === 0 && (
            <div className="text-center py-16 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              Belum ada siswa yang dipilih untuk menampilkan pratinjau dokumen. Silakan centang siswa di atas atau klik tombol <strong>Pilih Semua Siswa</strong>.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
