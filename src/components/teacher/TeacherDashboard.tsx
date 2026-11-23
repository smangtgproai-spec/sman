/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, Exam, Question, ExamSession } from '../../types/exam';
import { QuestionEditorModal } from './QuestionEditorModal';
import { ImportModal } from './ImportModal';
import { ExamReviewModal } from './ExamReviewModal';
import { exportResultsToCsv } from '../../utils/export';
import { MathRenderer } from '../common/MathRenderer';
import { 
  toDateTimeLocalString, 
  formatExamDateTime, 
  getExamScheduleStatus, 
  calculateScheduleDuration 
} from '../../utils/examSchedule';
import { 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Upload, 
  Settings, 
  KeyRound, 
  Eye, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldAlert, 
  Sparkles,
  Layers,
  ChevronRight,
  ArrowLeft,
  Calendar,
  CalendarClock,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  PlayCircle,
  RotateCcw
} from 'lucide-react';

interface TeacherDashboardProps {
  currentTeacher: Teacher;
  exams: Exam[];
  examSessions: ExamSession[];
  onUpdateExams: (exams: Exam[]) => void;
  onLogoutTeacher: () => void;
  onBackToPortal: () => void;
  isOperatorMode?: boolean;
  onReturnToOperator?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentTeacher,
  exams,
  examSessions,
  onUpdateExams,
  onLogoutTeacher,
  onBackToPortal,
  isOperatorMode,
  onReturnToOperator,
}) => {
  const activeTeacher = currentTeacher;

  // Selected exam for management belonging to this teacher
  const teacherExams = exams.filter(e => e.teacherId === activeTeacher.id);
  const [selectedExamId, setSelectedExamId] = useState<string>(teacherExams[0]?.id || '');

  // Modals
  const [editingQuestion, setEditingQuestion] = useState<Question | null | 'new'>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'results'>('questions');

  // Exam details form state
  const currentExam = teacherExams.find(e => e.id === selectedExamId) || teacherExams[0];

  // Update current exam in global state
  const handleUpdateCurrentExam = (updater: (prev: Exam) => Exam) => {
    if (!currentExam) return;
    const updated = updater(currentExam);
    const nextList = exams.map(e => e.id === currentExam.id ? updated : e);
    onUpdateExams(nextList);
  };

  // Create new exam
  const handleCreateNewExam = () => {
    const newExamId = `exam-${Date.now()}`;
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 3600 * 1000);
    const newExam: Exam = {
      id: newExamId,
      title: 'Ujian Baru: Mata Pelajaran',
      subject: activeTeacher.subject,
      grade: 'Kelas XII',
      teacherId: activeTeacher.id,
      teacherName: activeTeacher.name,
      durationMinutes: 45,
      token: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'draft',
      questions: [],
      randomizeQuestions: false,
      randomizeOptions: false,
      randomizeOptionsPG: false,
      randomizeOptionsMCMA: false,
      randomizeStatementsMatrix: false,
      showResultsImmediately: true,
      createdAt: new Date().toISOString().slice(0, 10),
      academicYear: '2025/2026 Ganjil',
      enableSchedule: true,
      startDate: toDateTimeLocalString(now),
      endDate: toDateTimeLocalString(end),
    };
    onUpdateExams([...exams, newExam]);
    setSelectedExamId(newExamId);
  };

  // Save question from editor modal
  const handleSaveQuestion = (q: Question) => {
    handleUpdateCurrentExam(prev => {
      const exists = prev.questions.some(item => item.id === q.id);
      const newQuestions = exists
        ? prev.questions.map(item => item.id === q.id ? q : item)
        : [...prev.questions, q];
      return { ...prev, questions: newQuestions };
    });
    setEditingQuestion(null);
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    handleUpdateCurrentExam(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
    }));
  };

  // Import questions batch
  const handleBatchImport = (newQuestions: Question[]) => {
    handleUpdateCurrentExam(prev => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
    }));
  };

  // Sessions for this exam
  const currentExamSessions = examSessions.filter(s => s.examId === currentExam?.id);

  // Export results to CSV
  const handleExportResults = () => {
    if (!currentExam) return;
    const formatted = currentExamSessions.map((s, idx) => ({
      no: idx + 1,
      studentName: s.studentName,
      nisn: s.nisn,
      className: s.className,
      score: s.score || 0,
      maxScore: s.maxScore || 100,
      percentage: s.maxScore ? (s.score! / s.maxScore) * 100 : 0,
      violationsCount: s.violations.length,
      status: s.status === 'submitted' ? 'Selesai Mandiri' : s.status === 'force_submitted' ? 'Selesai Terkunci/Waktu Habis' : 'Sedang Mengerjakan',
      submittedAt: s.endTime ? new Date(s.endTime).toLocaleTimeString('id-ID') : '-',
    }));
    exportResultsToCsv(currentExam.title, currentExam.subject, formatted);
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8">
      {/* Operator Access Banner */}
      {isOperatorMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-amber-600 font-medium text-xs">
          <div className="flex items-center gap-2.5">
            <span className="bg-slate-950 text-white font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shrink-0 shadow-2xs">
              Akses Operator
            </span>
            <span>
              Anda sedang masuk ke laman guru atas nama <strong>{activeTeacher.name}</strong> ({activeTeacher.subject}). Anda dapat mengelola soal, token, dan memonitor ujian langsung.
            </span>
          </div>
          <button
            onClick={onReturnToOperator}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard Operator</span>
          </button>
        </div>
      )}

      {/* Teacher Profile Top Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{activeTeacher.name}</h1>
              {isOperatorMode ? (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                  <span>Mode Akses Operator</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Dashboard Mandiri Guru
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>NIP: <strong className="font-mono text-slate-700">{activeTeacher.nip}</strong></span>
              <span>·</span>
              <span>Mata Pelajaran: <strong className="text-indigo-700">{activeTeacher.subject}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                <KeyRound className="w-3 h-3 text-indigo-600" />
                Token: <strong className="text-indigo-900 font-bold">{activeTeacher.token}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Logout / Return to Operator */}
        <div className="flex items-center gap-2 shrink-0">
          {isOperatorMode ? (
            <button
              onClick={onReturnToOperator}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
              title="Kembali ke Dashboard Master Operator"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-900" />
              <span>Kembali ke Operator</span>
            </button>
          ) : (
            <button
              onClick={onLogoutTeacher}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Keluar dari sesi guru ini dan masukkan token guru lain"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Keluar / Ganti Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Exam Selector and Creator Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Pengelolaan Asesmen & Ujian
          </span>
          <div className="flex items-center gap-3 mt-1">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-slate-800 text-white font-bold text-base md:text-lg rounded-lg px-3 py-1.5 border border-slate-700 focus:ring-2 focus:ring-indigo-500 max-w-md"
            >
              {teacherExams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} [{ex.status.toUpperCase()}]
                </option>
              ))}
            </select>
            {currentExam && (
              <>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                  currentExam.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentExam.status === 'published' ? 'Sudah Dipublikasikan' : 'Draft'}
                </span>
                {(() => {
                  const scheduleInfo = getExamScheduleStatus(currentExam);
                  return (
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 ${
                      scheduleInfo.status === 'active' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' :
                      scheduleInfo.status === 'upcoming' ? 'bg-amber-950/80 text-amber-300 border-amber-700/50' :
                      scheduleInfo.status === 'ended' ? 'bg-rose-950/80 text-rose-300 border-rose-700/50' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      <CalendarClock className="w-3 h-3" />
                      <span>{scheduleInfo.label}</span>
                    </span>
                  );
                })()}
              </>
            )}
          </div>
          {currentExam && (
            <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-3">
              <span>Token Akses: <strong className="font-mono text-emerald-400">{currentExam.token}</strong></span>
              <span>·</span>
              <span>Durasi: <strong>{currentExam.durationMinutes} Menit</strong></span>
              <span>·</span>
              <span>Jumlah Soal: <strong>{currentExam.questions.length} Butir</strong></span>
              {currentExam.enableSchedule !== false && currentExam.startDate && currentExam.endDate && (
                <>
                  <span>·</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    Jadwal: <strong className="text-indigo-300">{formatExamDateTime(currentExam.startDate)} s.d {formatExamDateTime(currentExam.endDate)}</strong>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCreateNewExam}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Ujian Baru</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {teacherExams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Belum Ada Ujian untuk {activeTeacher.name}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Anda belum memiliki jadwal ujian untuk mata pelajaran <strong>{activeTeacher.subject}</strong>. Klik tombol di bawah untuk membuat draf ujian pertama Anda dan mulai menginput atau mengimpor butir soal.
          </p>
          <button
            onClick={handleCreateNewExam}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 mx-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Draf Ujian Pertama</span>
          </button>
        </div>
      ) : (
        <>
          {/* Main Tabs */}
          <div className="border-b border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto no-scrollbar whitespace-nowrap pb-1 max-w-full">
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'questions' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
              >
            <BookOpen className="w-4 h-4" />
            <span>Bank Soal ({currentExam?.questions.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Ujian & Token</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'results' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hasil & Rekap Nilai Siswa ({currentExamSessions.length})</span>
          </button>
        </div>

        {activeTab === 'questions' && (
          <div className="flex items-center gap-2 pb-2">
            {currentExam?.questions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Review tampilan soal ujian persis seperti di layar siswa"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Review Tampilan Soal</span>
              </button>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tool Import (DOCX, XLSX, GForm)</span>
            </button>
            <button
              onClick={() => setEditingQuestion('new')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Butir Soal</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BANK SOAL */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {currentExam?.questions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Belum Ada Soal pada Ujian Ini</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Mulai tambahkan soal pilihan ganda, MCMA, atau tabel 4 pernyataan, atau gunakan tool import dari file DOCX / Excel / Google Form.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg"
                >
                  Import Soal Cepat
                </button>
                <button
                  onClick={() => setEditingQuestion('new')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Tulis Soal Baru
                </button>
              </div>
            </div>
          ) : (
            currentExam?.questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {q.type === 'pg' && 'Pilihan Ganda'}
                      {q.type === 'mcma' && 'MCMA / Pilihan Ganda Kompleks'}
                      {q.type === 'true_false_matrix' && 'Tabel 4 Pernyataan Benar/Salah'}
                    </span>
                    <span className="text-xs font-mono text-indigo-600 font-semibold">
                      Skor: {q.score} Poin
                    </span>
                    {(q.type === 'pg' || q.type === 'mcma') && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        q.showOptionLabels !== false
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {q.showOptionLabels !== false ? 'Opsi ABCDE' : 'Tanpa Huruf ABCDE'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded"
                      title="Edit Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Image Preview */}
                {q.imageUrl && (
                  <div className="mb-3 max-w-xs">
                    <img src={q.imageUrl} alt="Ilustrasi" className="h-28 rounded border border-slate-200 object-contain bg-slate-50" />
                    {q.imageCaption && (
                      <span className="text-[11px] text-slate-500 block mt-1">{q.imageCaption}</span>
                    )}
                  </div>
                )}

                <div className="text-xs md:text-sm text-slate-900 font-medium mb-3 leading-relaxed whitespace-pre-line">
                  <MathRenderer content={q.text} />
                </div>

                {/* Render Answers Preview */}
                {q.type === 'true_false_matrix' && q.matrixStatements && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                    <span className="font-semibold text-slate-700 block mb-1">Pernyataan & Kunci:</span>
                    {q.matrixStatements.map((stmt, sIdx) => (
                      <div key={stmt.id} className="flex items-center justify-between text-slate-600">
                        <span className="flex-1 pr-2">
                          <strong className="mr-1">{sIdx + 1}.</strong>
                          <MathRenderer content={stmt.statement} />
                        </span>
                        <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] shrink-0 ${
                          stmt.correctValue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {stmt.correctValue ? 'BENAR' : 'SALAH'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => {
                      const isCorrect = q.correctOptions?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="truncate flex-1">
                            <MathRenderer content={opt.text} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PENGATURAN UJIAN & PUBLISH */}
      {activeTab === 'settings' && currentExam && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl space-y-5">
          <h3 className="text-base font-bold text-slate-900">Pengaturan Asesmen</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Ujian</label>
            <input
              type="text"
              value={currentExam.title}
              onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={currentExam.subject}
                onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Kelas</label>
              <input
                type="text"
                value={currentExam.grade}
                onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Pengerjaan (Menit)</label>
              <input
                type="number"
                min={5}
                max={240}
                value={currentExam.durationMinutes}
                onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Akses / Token Siswa</label>
              <input
                type="text"
                value={currentExam.token}
                onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, token: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg text-blue-700 font-bold"
              />
            </div>
          </div>

          {/* MENU PENGATURAN TANGGAL & JAM MULAI DAN BERAKHIR UJIAN */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/60 p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Menu Pengaturan Jadwal Tanggal & Jam Ujian</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Atur tanggal dan jam mulai serta tanggal dan jam berakhir agar siswa hanya dapat mengakses ujian pada rentang waktu yang ditentukan.
                    </p>
                  </div>
                </div>

                {/* Status Badge Live */}
                {(() => {
                  const scheduleInfo = getExamScheduleStatus(currentExam);
                  return (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 uppercase tracking-wider flex items-center gap-1 ${scheduleInfo.badgeBg} ${scheduleInfo.badgeText} ${scheduleInfo.badgeBorder}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        scheduleInfo.status === 'active' ? 'bg-emerald-500 animate-ping' :
                        scheduleInfo.status === 'upcoming' ? 'bg-amber-500' :
                        scheduleInfo.status === 'ended' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      {scheduleInfo.label}
                    </span>
                  );
                })()}
              </div>

              {/* Toggle Aktifkan Batasan Jadwal */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={currentExam.enableSchedule !== false}
                    onChange={(e) => {
                      const willEnable = e.target.checked;
                      handleUpdateCurrentExam(prev => {
                        const now = new Date();
                        const defaultStart = prev.startDate || toDateTimeLocalString(now);
                        const defaultEnd = prev.endDate || toDateTimeLocalString(new Date(now.getTime() + (prev.durationMinutes || 60) * 60 * 1000 + 3600000));
                        return {
                          ...prev,
                          enableSchedule: willEnable,
                          startDate: defaultStart,
                          endDate: defaultEnd,
                        };
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Batasi Waktu Akses dengan Jadwal Tanggal & Jam
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {currentExam.enableSchedule !== false
                        ? 'Siswa hanya bisa membuka ujian di antara waktu mulai dan berakhir di bawah ini.'
                        : 'Bebas akses kapan saja oleh siswa (tanpa batasan tanggal & jam).'}
                    </span>
                  </div>
                </label>

                {currentExam.enableSchedule === false && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                    Bebas Akses
                  </span>
                )}
              </div>

              {/* Inputs Tanggal & Jam Mulai s.d Berakhir */}
              {currentExam.enableSchedule !== false && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. TANGGAL & JAM MULAI */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tanggal & Jam Mulai Ujian</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nowStr = toDateTimeLocalString(new Date());
                            handleUpdateCurrentExam(prev => ({ ...prev, startDate: nowStr }));
                          }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="Set waktu mulai ke waktu saat ini"
                        >
                          Set Sekarang
                        </button>
                      </div>

                      <input
                        type="datetime-local"
                        value={currentExam.startDate || ''}
                        onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500"
                      />

                      <div className="text-[11px] text-slate-500 font-medium">
                        {currentExam.startDate ? (
                          <span className="text-slate-700">Mulai: {formatExamDateTime(currentExam.startDate)}</span>
                        ) : (
                          <span className="text-amber-600">Belum disetel (otomatis dapat diakses)</span>
                        )}
                      </div>
                    </div>

                    {/* 2. TANGGAL & JAM BERAKHIR */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CalendarX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tanggal & Jam Berakhir Ujian</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const base = currentExam.startDate ? new Date(currentExam.startDate) : new Date();
                              const newEnd = new Date(base.getTime() + 1 * 3600 * 1000);
                              handleUpdateCurrentExam(prev => ({ ...prev, endDate: toDateTimeLocalString(newEnd) }));
                            }}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            title="Set selesai 1 jam dari mulai"
                          >
                            +1 Jam
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              const base = currentExam.startDate ? new Date(currentExam.startDate) : new Date();
                              const newEnd = new Date(base.getTime() + 2 * 3600 * 1000);
                              handleUpdateCurrentExam(prev => ({ ...prev, endDate: toDateTimeLocalString(newEnd) }));
                            }}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            title="Set selesai 2 jam dari mulai"
                          >
                            +2 Jam
                          </button>
                        </div>
                      </div>

                      <input
                        type="datetime-local"
                        value={currentExam.endDate || ''}
                        onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500"
                      />

                      <div className="text-[11px] text-slate-500 font-medium">
                        {currentExam.endDate ? (
                          <span className="text-slate-700">Berakhir: {formatExamDateTime(currentExam.endDate)}</span>
                        ) : (
                          <span className="text-amber-600">Belum disetel (tanpa batas berakhir)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preset Cepat Tanggal & Jam */}
                  <div className="pt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Preset Cepat:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const end = new Date(now.getTime() + 2 * 3600 * 1000);
                        handleUpdateCurrentExam(prev => ({
                          ...prev,
                          startDate: toDateTimeLocalString(now),
                          endDate: toDateTimeLocalString(end),
                        }));
                      }}
                      className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Sekarang s.d +2 Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30);
                        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0);
                        handleUpdateCurrentExam(prev => ({
                          ...prev,
                          startDate: toDateTimeLocalString(start),
                          endDate: toDateTimeLocalString(end),
                        }));
                      }}
                      className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Hari Ini (07:30 - 10:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30);
                        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0);
                        handleUpdateCurrentExam(prev => ({
                          ...prev,
                          startDate: toDateTimeLocalString(start),
                          endDate: toDateTimeLocalString(end),
                        }));
                      }}
                      className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Hari Ini (10:30 - 13:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tmrw = new Date();
                        tmrw.setDate(tmrw.getDate() + 1);
                        const start = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 8, 0);
                        const end = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 11, 0);
                        handleUpdateCurrentExam(prev => ({
                          ...prev,
                          startDate: toDateTimeLocalString(start),
                          endDate: toDateTimeLocalString(end),
                        }));
                      }}
                      className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Besok Pagi (08:00 - 11:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const end = new Date(now.getTime() + 24 * 3600 * 1000);
                        handleUpdateCurrentExam(prev => ({
                          ...prev,
                          startDate: toDateTimeLocalString(now),
                          endDate: toDateTimeLocalString(end),
                        }));
                      }}
                      className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Rentang 24 Jam
                    </button>
                  </div>

                  {/* Validasi & Info Durasi Jendela Pengerjaan */}
                  {(() => {
                    const isInvalidRange =
                      Boolean(currentExam.startDate && currentExam.endDate) &&
                      new Date(currentExam.endDate!).getTime() <= new Date(currentExam.startDate!).getTime();
                    const durationStr = calculateScheduleDuration(currentExam.startDate, currentExam.endDate);
                    const scheduleInfo = getExamScheduleStatus(currentExam);

                    if (isInvalidRange) {
                      return (
                        <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Perhatian:</strong> Tanggal & jam berakhir ujian harus lebih lambat dari tanggal & jam mulai!
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 bg-white/90 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>
                            Jendela Akses Terbuka: <strong className="text-slate-900">{durationStr}</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">
                            Durasi Pengerjaan Siswa: <strong className="text-slate-800">{currentExam.durationMinutes} Menit</strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 italic">
                          {scheduleInfo.message}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Pengaturan Pengacakan & Anti-Contek */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pengaturan Integritas & Pengacakan Soal (Anti-Contek)</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  const allActive =
                    currentExam.randomizeQuestions &&
                    currentExam.randomizeOptionsPG &&
                    currentExam.randomizeOptionsMCMA &&
                    currentExam.randomizeStatementsMatrix;
                  handleUpdateCurrentExam(prev => ({
                    ...prev,
                    randomizeQuestions: !allActive,
                    randomizeOptions: !allActive,
                    randomizeOptionsPG: !allActive,
                    randomizeOptionsMCMA: !allActive,
                    randomizeStatementsMatrix: !allActive,
                  }));
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {currentExam.randomizeQuestions &&
                currentExam.randomizeOptionsPG &&
                currentExam.randomizeOptionsMCMA &&
                currentExam.randomizeStatementsMatrix
                  ? 'Matikan Semua Pengacakan'
                  : 'Aktifkan Semua Pengacakan'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Kombinasi pengacakan nomor soal, butir pilihan jawaban, dan pernyataan matriks membuat tampilan setiap siswa berbeda serta meminimalisir contek massal.
            </p>

            <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              {/* 1. Acak Nomor Soal */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!currentExam.randomizeQuestions}
                  onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 block">
                    Acak Urutan Nomor Soal Siswa
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Urutan nomor soal (1 s/d {currentExam.questions.length || 'N'}) akan diacak untuk setiap siswa yang mengerjakan.
                  </span>
                </div>
              </label>

              {/* 2. Acak Pilihan Ganda (PG) */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2.5 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={!!currentExam.randomizeOptionsPG}
                  onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, randomizeOptionsPG: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 block">
                    Acak Butir Jawaban untuk Soal Pilihan Ganda (PG)
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Posisi opsi pilihan jawaban (A, B, C, D, E) pada tipe soal PG tunggal diacak sehingga urutan huruf opsi tiap siswa berlainan.
                  </span>
                </div>
              </label>

              {/* 3. Acak Pilihan Ganda Kompleks (MCMA) */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2.5 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={!!currentExam.randomizeOptionsMCMA}
                  onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, randomizeOptionsMCMA: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 block">
                    Acak Butir Jawaban untuk Soal Pilihan Ganda Kompleks (MCMA)
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Pilihan centang ganda pada soal MCMA ditampilkan dalam urutan acak untuk tiap peserta didik.
                  </span>
                </div>
              </label>

              {/* 4. Acak Baris Pernyataan pada Soal Tabel Benar/Salah */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2.5 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={!!currentExam.randomizeStatementsMatrix}
                  onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, randomizeStatementsMatrix: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 block">
                    Acak Pernyataan pada Soal Tabel Benar / Salah
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Urutan baris pernyataan pada tabel analisis benar/salah akan diacak saat siswa membuka ujian.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Pengaturan Evaluasi Nilai */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentExam.showResultsImmediately}
                onChange={(e) => handleUpdateCurrentExam(prev => ({ ...prev, showResultsImmediately: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-950 block">
                  Tampilkan Nilai Evaluasi Langsung ke Siswa Setelah Submit
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Jika dicentang, siswa akan langsung melihat skor akhir dan perolehan nilai di layar ujian setelah menyelesaikan ujian.
                </span>
              </div>
            </label>
          </div>

          {/* Review Soal Ujian Card */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Review & Simulasi Tampilan Soal Siswa</h4>
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {currentExam.questions.length} Butir Soal
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Periksa tata letak teks soal, ilustrasi gambar, pilihan jawaban ABCDE, dan tabel pernyataan persis seperti tampilan yang akan dihadapi siswa sebelum ujian dipublish.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review Soal Ujian</span>
            </button>
          </div>

          {/* Publish Toggle Button & Quick Review */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Status Publikasi Ujian</span>
              <span className="text-[11px] text-slate-500">
                {currentExam.status === 'published'
                  ? 'Ujian aktif dan dapat diakses siswa dengan token resmi.'
                  : 'Ujian masih berupa draft dan belum dapat diakses siswa.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka pratinjau soal ujian sebelum dipublish"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Review Soal</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateCurrentExam(prev => ({
                  ...prev,
                  status: prev.status === 'published' ? 'draft' : 'published',
                }))}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentExam.status === 'published'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentExam.status === 'published' ? 'Tutup / Tarik Publikasi' : 'Publikasikan Ujian Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HASIL & REKAP NILAI SISWA */}
      {activeTab === 'results' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rekap Nilai & Partisipasi Siswa</h3>
              <p className="text-xs text-slate-500">
                Ujian: {currentExam?.title} (Mata Pelajaran: {currentExam?.subject})
              </p>
            </div>

            <button
              onClick={handleExportResults}
              disabled={currentExamSessions.length === 0}
              className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unduh Rekap Nilai Excel (.csv)</span>
            </button>
          </div>

          {currentExamSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada siswa yang menyelesaikan atau mengerjakan ujian ini.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN & Kelas</th>
                    <th className="py-3 px-4">Total Skor</th>
                    <th className="py-3 px-4">Nilai Akhir</th>
                    <th className="py-3 px-4">Pelanggaran</th>
                    <th className="py-3 px-4">Waktu Submit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentExamSessions.map((sess, idx) => {
                    const finalPercent = sess.maxScore ? Math.round((sess.score! / sess.maxScore) * 100) : 0;
                    return (
                      <tr key={sess.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{sess.studentName}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{sess.nisn} ({sess.className})</td>
                        <td className="py-3 px-4 font-mono">{sess.score} / {sess.maxScore}</td>
                        <td className="py-3 px-4">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            finalPercent >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {finalPercent}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sess.violations.length > 0 ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{sess.violations.length} catatan</span>
                            </span>
                          ) : (
                            <span className="text-emerald-600">0 (Bersih)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {sess.endTime ? new Date(sess.endTime).toLocaleTimeString('id-ID') : 'Sedang Aktif'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          initialQuestion={editingQuestion === 'new' ? null : editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onImport={handleBatchImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Exam Review Modal */}
      {showReviewModal && currentExam && (
        <ExamReviewModal
          exam={currentExam}
          onClose={() => setShowReviewModal(false)}
          onPublishExam={() => {
            handleUpdateCurrentExam(prev => ({ ...prev, status: 'published' }));
          }}
        />
      )}
    </div>
  );
};
