/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question, QuestionType, QuestionOption, MatrixStatement } from '../../types/exam';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle, 
  HelpCircle, 
  Upload, 
  X,
  FileCheck,
  Calculator,
  Eye,
  Sparkles
} from 'lucide-react';
import { CELL_DIAGRAM_SVG, NETWORK_DIAGRAM_SVG } from '../../data/initialData';
import { EquationEditorModal } from './EquationEditorModal';
import { MathRenderer } from '../common/MathRenderer';

interface QuestionEditorModalProps {
  initialQuestion?: Question | null;
  onSave: (question: Question) => void;
  onClose: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  initialQuestion,
  onSave,
  onClose,
}) => {
  // Scale score between 1 and 10, default to 5
  const getInitialScore = (rawScore?: number): number => {
    if (typeof rawScore === 'number' && !isNaN(rawScore)) {
      if (rawScore >= 1 && rawScore <= 10) return rawScore;
      if (rawScore > 10) return Math.min(10, Math.max(1, Math.round(rawScore / 10)));
    }
    return 5;
  };

  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'pg');
  const [text, setText] = useState<string>(initialQuestion?.text || '');
  const [score, setScore] = useState<number>(() => getInitialScore(initialQuestion?.score));
  const [showOptionLabels, setShowOptionLabels] = useState<boolean>(
    initialQuestion?.showOptionLabels !== undefined ? initialQuestion.showOptionLabels : true
  );
  const [imageUrl, setImageUrl] = useState<string>(initialQuestion?.imageUrl || '');
  const [imageCaption, setImageCaption] = useState<string>(initialQuestion?.imageCaption || '');
  const [explanation, setExplanation] = useState<string>(initialQuestion?.explanation || '');

  // Options for PG / MCMA
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options || [
      { id: 'A', label: 'A', text: 'Pilihan Jawaban A' },
      { id: 'B', label: 'B', text: 'Pilihan Jawaban B' },
      { id: 'C', label: 'C', text: 'Pilihan Jawaban C' },
      { id: 'D', label: 'D', text: 'Pilihan Jawaban D' },
    ]
  );
  const [correctOptions, setCorrectOptions] = useState<string[]>(
    initialQuestion?.correctOptions || ['A']
  );

  // Statements for True/False Table with 4 statements
  const [matrixStatements, setMatrixStatements] = useState<MatrixStatement[]>(
    initialQuestion?.matrixStatements || [
      { id: 'st-1', statement: 'Pernyataan analisis ke-1 mengenai fenomena atau data penelitian', correctValue: true },
      { id: 'st-2', statement: 'Pernyataan analisis ke-2 mengenai variabel bebas dan kontrol', correctValue: false },
      { id: 'st-3', statement: 'Pernyataan analisis ke-3 mengenai hasil kalkulasi atau observasi', correctValue: true },
      { id: 'st-4', statement: 'Pernyataan analisis ke-4 mengenai kesimpulan hipotesis kerja', correctValue: false },
    ]
  );

  // Handle local image file upload to DataURL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Tool Equation State & Handlers
  const [showEquationModal, setShowEquationModal] = useState<boolean>(false);
  const [equationTargetField, setEquationTargetField] = useState<string>('question_text');

  const handleOpenEquationModal = (targetField: string = 'question_text') => {
    setEquationTargetField(targetField);
    setShowEquationModal(true);
  };

  const handleInsertEquation = (formulaText: string, targetField?: string) => {
    const target = targetField || equationTargetField;
    if (target === 'question_text') {
      setText((prev) => (prev ? `${prev} ${formulaText}` : formulaText));
    } else if (target === 'explanation') {
      setExplanation((prev) => (prev ? `${prev} ${formulaText}` : formulaText));
    } else if (target.startsWith('opt_')) {
      const optId = target.replace('opt_', '');
      setOptions((prev) =>
        prev.map((opt) => (opt.id === optId ? { ...opt, text: opt.text ? `${opt.text} ${formulaText}` : formulaText } : opt))
      );
    } else if (target.startsWith('stmt_')) {
      const stmtIdx = parseInt(target.replace('stmt_', ''), 10);
      setMatrixStatements((prev) =>
        prev.map((stmt, i) => (i === stmtIdx ? { ...stmt, statement: stmt.statement ? `${stmt.statement} ${formulaText}` : formulaText } : stmt))
      );
    }
  };

  // Quick inline symbol insert for question text
  const handleQuickInsertSymbol = (symbol: string) => {
    setText((prev) => (prev ? `${prev} ${symbol}` : symbol));
  };

  const handleToggleCorrectOption = (optId: string) => {
    if (type === 'pg') {
      setCorrectOptions([optId]);
    } else {
      if (correctOptions.includes(optId)) {
        if (correctOptions.length > 1) {
          setCorrectOptions(correctOptions.filter(id => id !== optId));
        }
      } else {
        setCorrectOptions([...correctOptions, optId]);
      }
    }
  };

  const handleUpdateOptionText = (idx: number, newText: string) => {
    setOptions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: newText };
      return next;
    });
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions([...options, { id: nextChar, label: nextChar, text: `Pilihan Jawaban ${nextChar}` }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const removedId = options[idx].id;
    const filtered = options.filter((_, i) => i !== idx).map((opt, i) => {
      const label = String.fromCharCode(65 + i);
      return { id: label, label, text: opt.text };
    });
    setOptions(filtered);
    setCorrectOptions(prev => prev.filter(id => id !== removedId).map(() => 'A'));
  };

  const handleUpdateStatement = (idx: number, newText: string) => {
    setMatrixStatements(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], statement: newText };
      return next;
    });
  };

  const handleToggleStatementValue = (idx: number, value: boolean) => {
    setMatrixStatements(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], correctValue: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Teks pertanyaan wajib diisi.');
      return;
    }

    const sanitizedScore = Math.min(10, Math.max(1, Math.round(Number(score) || 1)));

    const questionToSave: Question = {
      id: initialQuestion?.id || `q-${Date.now()}`,
      type,
      text,
      score: sanitizedScore,
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      explanation: explanation.trim() || undefined,
      showOptionLabels: type === 'true_false_matrix' ? undefined : showOptionLabels,
      ...(type === 'true_false_matrix'
        ? { matrixStatements }
        : { options, correctOptions }),
    };

    onSave(questionToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialQuestion ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur tipe soal, pertanyaan, media gambar, opsi jawaban, dan bobot penilaian.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Top Row: Type & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Soal Asesmen
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pg">Pilihan Ganda Biasa (1 Jawaban Benar)</option>
                <option value="mcma">MCMA / Pilihan Ganda Kompleks (Banyak Jawaban Benar)</option>
                <option value="true_false_matrix">Tabel Benar/Salah (4 Baris Pernyataan)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Bobot Skor (Skala 1 - 10)
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {score} Poin
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={score}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setScore(1);
                    } else {
                      const val = Number(raw);
                      setScore(Math.min(10, Math.max(1, Math.round(val))));
                    }
                  }}
                  className="w-16 px-2.5 py-1.5 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {/* Quick Selection Buttons 1 to 10 */}
                <div className="flex-1 flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScore(num)}
                      className={`h-7 w-7 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        score === num
                          ? 'bg-indigo-600 text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                      }`}
                      title={`Pilih bobot ${num} poin`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Pilih rentang bobot penilaian: 1 (sangat mudah / bobot ringan) hingga 10 (kompleks / bobot tinggi).
              </p>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Isi Pertanyaan / Konteks Kasus
              </label>

              {/* Tool Equation Action Button */}
              <button
                type="button"
                onClick={() => handleOpenEquationModal('question_text')}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                title="Buka Tool Equation untuk membuat rumus matematika, fisika, kimia atau notasi ilmiah"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-300" />
                <span>Tool Equation & Rumus Ilmiah</span>
                <span className="bg-indigo-950/60 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded font-extrabold border border-indigo-400/30">
                  Mat/Fis/Kim
                </span>
              </button>
            </div>

            {/* Quick Math/Science Symbol Palette */}
            <div className="mb-2 p-1.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 overflow-x-auto text-xs scrollbar-thin">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" /> Cepat:
              </span>
              {[
                { label: 'x²', val: '$x^2$' },
                { label: 'xⁿ', val: '$x^n$' },
                { label: '√x', val: '$\\sqrt{x}$' },
                { label: 'a/b', val: '$\\frac{a}{b}$' },
                { label: '±', val: '$\\pm$' },
                { label: '×', val: '$\\times$' },
                { label: '÷', val: '$\\div$' },
                { label: '≤', val: '$\\le$' },
                { label: '≥', val: '$\\ge$' },
                { label: '≠', val: '$\\neq$' },
                { label: 'π', val: '$\\pi$' },
                { label: 'θ', val: '$\\theta$' },
                { label: 'Δ', val: '$\\Delta$' },
                { label: 'Ω', val: '$\\Omega$' },
                { label: 'μ', val: '$\\mu$' },
                { label: 'H₂O', val: '$\\text{H}_2\\text{O}$' },
                { label: 'CO₂', val: '$\\text{CO}_2$' },
                { label: '→', val: '$\\rightarrow$' },
                { label: '⇌', val: '$\\rightleftharpoons$' },
                { label: '×10ⁿ', val: '$\\times 10^n$' },
              ].map((sym, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickInsertSymbol(sym.val)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-mono font-bold border border-slate-200 shrink-0 cursor-pointer transition-colors"
                  title={`Sisipkan ${sym.label}`}
                >
                  {sym.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tuliskan stimulus, teks soal, atau permasalahan di sini. Anda dapat menggunakan Tool Equation di atas untuk menyisipkan rumus..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
              required
            />

            {/* Live Formula Preview if text contains equation */}
            {text && (text.includes('$') || text.includes('\\')) && (
              <div className="mt-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 mb-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview Teks Soal & Notasi Ilmiah (KaTeX Rendering):</span>
                </div>
                <div className="text-xs text-slate-900 font-medium whitespace-pre-line leading-relaxed">
                  <MathRenderer content={text} />
                </div>
              </div>
            )}
          </div>

          {/* Image Attachment Panel */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Sisipkan Gambar / Diagram pada Soal (Opsional)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setImageCaption(''); }}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Hapus Gambar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Upload File Gambar:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Atau Pilih Diagram Siap Pakai:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setImageUrl(CELL_DIAGRAM_SVG); setImageCaption('Diagram Sel Eukariotik & Mitokondria'); }}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700"
                  >
                    Sel Biologi
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageUrl(NETWORK_DIAGRAM_SVG); setImageCaption('Skema Jaringan Komputer & Firewall'); }}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700"
                  >
                    Jaringan Komputer
                  </button>
                </div>
              </div>
            </div>

            {imageUrl && (
              <div className="pt-2 flex items-center gap-4">
                <img src={imageUrl} alt="Preview" className="h-16 w-24 object-contain rounded border border-slate-200 bg-white" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Keterangan gambar (contoh: Gambar 1.1 Diagram Sel)"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* OPSI JAWABAN SESUAI TIPE */}
          {type === 'true_false_matrix' ? (
            /* TABEL 4 PERNYATAAN BENAR / SALAH */
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-800">
                Tabel 4 Pernyataan & Kunci Kebenaran (Benar / Salah)
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Teks Pernyataan</th>
                      <th className="py-2.5 px-3 w-28 text-center text-emerald-700">Kunci: BENAR</th>
                      <th className="py-2.5 px-3 w-28 text-center text-rose-700">Kunci: SALAH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {matrixStatements.map((stmt, idx) => (
                      <tr key={stmt.id}>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={stmt.statement}
                              onChange={(e) => handleUpdateStatement(idx, e.target.value)}
                              className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                              placeholder="Teks pernyataan analisis..."
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenEquationModal(`stmt_${idx}`)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-600 border border-slate-200 transition-colors cursor-pointer shrink-0"
                              title="Sisipkan rumus/notasi ke pernyataan ini"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {stmt.statement && (stmt.statement.includes('$') || stmt.statement.includes('\\')) && (
                            <div className="mt-1 text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200">
                              <MathRenderer content={stmt.statement} />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatementValue(idx, true)}
                            className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${
                              stmt.correctValue === true
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                            }`}
                          >
                            Benar
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatementValue(idx, false)}
                            className={`w-full py-1.5 rounded text-xs font-bold transition-colors ${
                              stmt.correctValue === false
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                            }`}
                          >
                            Salah
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PG & MCMA OPTIONS */
            <div className="space-y-3.5">
              {/* Menu Ceklis Tampilkan / Tidak Tampilkan Opsi ABCDE */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="checkbox-show-option-labels"
                    checked={showOptionLabels}
                    onChange={(e) => setShowOptionLabels(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <div>
                    <label
                      htmlFor="checkbox-show-option-labels"
                      className="text-xs font-bold text-slate-900 cursor-pointer select-none flex items-center gap-1.5"
                    >
                      <span>Tampilkan Label Opsi (A, B, C, D, E) pada Soal</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {showOptionLabels
                        ? 'Aktif: Siswa akan melihat huruf penanda A, B, C, D, E pada setiap butir pilihan jawaban.'
                        : 'Non-aktif: Label huruf A, B, C, D, E disembunyikan. Siswa hanya memilih berdasarkan teks opsi.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      showOptionLabels
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {showOptionLabels ? '✓ Label ABCDE Tampil' : '✕ Label ABCDE Disembunyikan'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  {type === 'pg'
                    ? 'Pilihan Jawaban (Klik tombol huruf untuk menandai Kunci Jawaban)'
                    : 'Pilihan Jawaban MCMA (Klik tombol huruf untuk memilih lebih dari 1 Kunci)'}
                </label>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Opsi</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isCorrect = correctOptions.includes(opt.id);
                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCorrectOption(opt.id)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs shrink-0 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Klik untuk jadikan kunci jawaban"
                        >
                          {opt.label}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOptionText(idx, e.target.value)}
                          placeholder={`Teks pilihan ${opt.label}...`}
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenEquationModal(`opt_${opt.id}`)}
                          className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer shrink-0"
                          title={`Sisipkan rumus/notasi ke Pilihan ${opt.label}`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && (
                        <div className="ml-10 text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          <MathRenderer content={opt.text} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Pembahasan / Rubrik Penilaian (Opsional)
              </label>
              <button
                type="button"
                onClick={() => handleOpenEquationModal('explanation')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3 h-3" />
                <span>Tool Rumus Pembahasan</span>
              </button>
            </div>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Catatan pembahasan soal atau langkah penyelesaian rumus..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
            {explanation && (explanation.includes('$') || explanation.includes('\\')) && (
              <div className="mt-1 text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <MathRenderer content={explanation} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Simpan Butir Soal</span>
            </button>
          </div>
        </form>

        {/* Dedicated Tool Equation & Formula Assistant Modal */}
        <EquationEditorModal
          isOpen={showEquationModal}
          onClose={() => setShowEquationModal(false)}
          onInsert={handleInsertEquation}
          defaultTarget={equationTargetField}
          availableTargets={[
            { id: 'question_text', label: 'Teks Pertanyaan / Stimulus' },
            ...options.map((opt) => ({ id: `opt_${opt.id}`, label: `Pilihan Jawaban ${opt.label}` })),
            ...matrixStatements.map((_, i) => ({ id: `stmt_${i}`, label: `Pernyataan Tabel Baris ke-${i + 1}` })),
            { id: 'explanation', label: 'Pembahasan / Kunci' },
          ]}
        />
      </div>
    </div>
  );
};
