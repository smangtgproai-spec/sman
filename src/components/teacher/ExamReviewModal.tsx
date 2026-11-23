/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exam, Question } from '../../types/exam';
import {
  X,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  FileText,
  Clock,
  HelpCircle,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';

interface ExamReviewModalProps {
  exam: Exam;
  onClose: () => void;
  onPublishExam?: () => void;
}

export const ExamReviewModal: React.FC<ExamReviewModalProps> = ({
  exam,
  onClose,
  onPublishExam,
}) => {
  const questions: Question[] = exam.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showAnswerKeys, setShowAnswerKeys] = useState<boolean>(true);

  // Simulated answers state so the teacher can test interactive options
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, any>>({});

  const currentQuestion: Question | undefined = questions[currentIndex];

  // Simulation interaction handlers
  const handleSelectOptionPG = (optId: string) => {
    if (!currentQuestion) return;
    setSimulatedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optId,
    }));
  };

  const handleToggleOptionMCMA = (optId: string) => {
    if (!currentQuestion) return;
    const existing = (simulatedAnswers[currentQuestion.id] as string[]) || [];
    const updated = existing.includes(optId)
      ? existing.filter((id) => id !== optId)
      : [...existing, optId];
    setSimulatedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }));
  };

  const handleSelectMatrix = (stmtId: string, val: boolean) => {
    if (!currentQuestion) return;
    const existing = (simulatedAnswers[currentQuestion.id] as Record<string, boolean>) || {};
    setSimulatedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...existing,
        [stmtId]: val,
      },
    }));
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.score || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                  Review Tampilan Ujian
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    exam.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {exam.status === 'published' ? 'Sudah Dipublish' : 'Status: Draft'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate mt-0.5 max-w-xl">
                {exam.title} — <span className="text-slate-300 font-normal">{exam.subject} ({exam.grade})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Toggle Show Answer Keys */}
            <button
              type="button"
              onClick={() => setShowAnswerKeys(!showAnswerKeys)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                showAnswerKeys
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Aktifkan untuk melihat penanda kunci jawaban yang benar"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{showAnswerKeys ? 'Kunci Jawaban: Tampil' : 'Kunci Jawaban: Sembunyi'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tutup review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Soal di Paket Ujian Ini</h3>
            <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
              Anda belum menambahkan butir soal pada ujian <strong>{exam.title}</strong>. Silakan tambahkan soal secara manual atau impor dari file Excel (.xlsx / .csv) sebelum melakukan review dan publikasi.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              Kembali ke Pembuat Soal
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100/70">
            {/* Main Question Display (Left) */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
              {currentQuestion && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Question Header Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-lg">
                          Soal No. {currentIndex + 1}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {currentQuestion.type === 'pg' && 'Pilihan Ganda (Tunggal)'}
                          {currentQuestion.type === 'mcma' && 'Pilihan Ganda Kompleks (MCMA)'}
                          {currentQuestion.type === 'true_false_matrix' && 'Tabel 4 Pernyataan Benar/Salah'}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                          Bobot: {currentQuestion.score} Poin
                        </span>
                      </div>

                      {(currentQuestion.type === 'pg' || currentQuestion.type === 'mcma') && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          currentQuestion.showOptionLabels !== false
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {currentQuestion.showOptionLabels !== false ? 'Dengan Opsi Huruf (A, B, C, D, E)' : 'Tanpa Huruf (Hanya Teks)'}
                        </span>
                      )}
                    </div>

                    {/* Question Image (if any) */}
                    {currentQuestion.imageUrl && (
                      <div className="mb-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 inline-block max-w-md">
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Ilustrasi Soal"
                            className="max-h-60 rounded-lg object-contain w-full"
                          />
                          {currentQuestion.imageCaption && (
                            <p className="text-[11px] text-slate-500 font-medium text-center mt-1.5 italic">
                              {currentQuestion.imageCaption}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="text-sm md:text-base text-slate-900 font-medium leading-relaxed whitespace-pre-line mb-6">
                      <MathRenderer content={currentQuestion.text} />
                    </div>

                    {/* Options / Statement View */}
                    {/* TYPE 1: PG (Single Choice) */}
                    {currentQuestion.type === 'pg' && currentQuestion.options && (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          <span>Pilih satu jawaban yang paling tepat:</span>
                        </p>
                        {currentQuestion.options.map((opt) => {
                          const isSelected = simulatedAnswers[currentQuestion.id] === opt.id;
                          const isCorrect = currentQuestion.correctOptions?.includes(opt.id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOptionPG(opt.id)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-medium'
                                  : showAnswerKeys && isCorrect
                                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-medium'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>

                              <div className="text-sm leading-snug flex-1 flex items-center justify-between gap-2">
                                <div>
                                  {currentQuestion.showOptionLabels !== false && (
                                    <strong className="mr-2 text-indigo-900 font-bold">{opt.label}.</strong>
                                  )}
                                  <MathRenderer content={opt.text} />
                                </div>
                                {showAnswerKeys && isCorrect && (
                                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>KUNCI</span>
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 2: MCMA (Multiple Choice Multiple Answers) */}
                    {currentQuestion.type === 'mcma' && currentQuestion.options && (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban:</span>
                        </p>
                        {currentQuestion.options.map((opt) => {
                          const userVals = (simulatedAnswers[currentQuestion.id] as string[]) || [];
                          const isChecked = userVals.includes(opt.id);
                          const isCorrect = currentQuestion.correctOptions?.includes(opt.id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleToggleOptionMCMA(opt.id)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-medium'
                                  : showAnswerKeys && isCorrect
                                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-medium'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                                  isChecked
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                              </div>

                              <div className="text-sm leading-snug flex-1 flex items-center justify-between gap-2">
                                <div>
                                  {currentQuestion.showOptionLabels !== false && (
                                    <strong className="mr-2 text-indigo-900 font-bold">{opt.label}.</strong>
                                  )}
                                  <MathRenderer content={opt.text} />
                                </div>
                                {showAnswerKeys && isCorrect && (
                                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>KUNCI</span>
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 3: True/False Matrix (4 statements) */}
                    {currentQuestion.type === 'true_false_matrix' && currentQuestion.matrixStatements && (
                      <div className="pt-2">
                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse text-xs md:text-sm">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <th className="py-3 px-4 w-12 text-center">No</th>
                                <th className="py-3 px-4">Pernyataan Analisis</th>
                                <th className="py-3 px-3 w-28 text-center text-emerald-700">BENAR</th>
                                <th className="py-3 px-3 w-28 text-center text-rose-700">SALAH</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {currentQuestion.matrixStatements.map((stmt, idx) => {
                                const userMap = (simulatedAnswers[currentQuestion.id] as Record<string, boolean>) || {};
                                const currentVal = userMap[stmt.id];

                                return (
                                  <tr key={stmt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                                      {idx + 1}
                                    </td>
                                    <td className="py-3 px-4 text-slate-800 font-medium leading-relaxed">
                                      <MathRenderer content={stmt.statement} />
                                      {showAnswerKeys && (
                                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                          stmt.correctValue
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                                        }`}>
                                          Kunci: {stmt.correctValue ? 'BENAR' : 'SALAH'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectMatrix(stmt.id, true)}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                          currentVal === true
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : showAnswerKeys && stmt.correctValue === true
                                            ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 font-extrabold'
                                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                      >
                                        BENAR
                                      </button>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectMatrix(stmt.id, false)}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                          currentVal === false
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : showAnswerKeys && stmt.correctValue === false
                                            ? 'bg-rose-100 text-rose-800 border-2 border-rose-500 font-extrabold'
                                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                                        }`}
                                      >
                                        SALAH
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Explanation / Pembahasan (if available and showAnswerKeys is ON) */}
                    {showAnswerKeys && currentQuestion.explanation && (
                      <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pembahasan / Keterangan Kunci:</span>
                        </div>
                        <p className="leading-relaxed">{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Bottom Controls */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <span className="text-xs font-bold text-slate-500">
                      Soal {currentIndex + 1} dari {questions.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIndex === questions.length - 1}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Palette and Metadata */}
            <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Nomor Soal ({questions.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">Klik untuk lompat</span>
                </h3>

                {/* Number Palette Grid */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((q, idx) => {
                    const isActive = idx === currentIndex;
                    const isAnswered = simulatedAnswers[q.id] !== undefined;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                            : isAnswered
                            ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Soal nomor ${idx + 1} (${q.score} poin)`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Exam Metadata Summary Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Informasi Paket Ujian</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Durasi Ujian:</span>
                    <strong className="text-slate-900 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {exam.durationMinutes} Menit
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Kode Token Siswa:</span>
                    <strong className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {exam.token}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Bobot Skor:</span>
                    <strong className="text-slate-900 font-mono">{totalPoints} Poin</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Acak Nomor Soal:</span>
                    <span className={`font-semibold ${exam.randomizeQuestions ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {exam.randomizeQuestions ? 'Aktif' : 'Tidak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Acak Opsi PG:</span>
                    <span className={`font-semibold ${exam.randomizeOptionsPG ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {exam.randomizeOptionsPG ? 'Aktif' : 'Tidak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Acak Opsi MCMA:</span>
                    <span className={`font-semibold ${exam.randomizeOptionsMCMA ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {exam.randomizeOptionsMCMA ? 'Aktif' : 'Tidak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Acak Matriks B/S:</span>
                    <span className={`font-semibold ${exam.randomizeStatementsMatrix ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {exam.randomizeStatementsMatrix ? 'Aktif' : 'Tidak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Lihat Nilai Langsung:</span>
                    <span className={`font-semibold ${exam.showResultsImmediately ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {exam.showResultsImmediately ? 'Ya' : 'Tidak'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
                {exam.status !== 'published' && onPublishExam && (
                  <button
                    type="button"
                    onClick={() => {
                      onPublishExam();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publikasikan Ujian Sekarang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mode Review & Simulasi: Uji coba pengerjaan di sini tidak tercatat ke hasil asesmen siswa sesungguhnya.</span>
          </div>
          <span className="font-mono text-slate-400">Total Soal: {questions.length} Butir</span>
        </div>
      </div>
    </div>
  );
};
