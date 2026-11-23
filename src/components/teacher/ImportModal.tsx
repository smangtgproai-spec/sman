/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Question } from '../../types/exam';
import { 
  parseDocxText, 
  parseXlsxCsvText, 
  parseGoogleFormContent, 
  downloadSampleExcel 
} from '../../utils/importer';
import { 
  FileText, 
  FileSpreadsheet, 
  FormInput, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ImportModalProps {
  onImport: (questions: Question[]) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'docx' | 'xlsx' | 'gform'>('xlsx');
  const [inputText, setInputText] = useState<string>('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);

  // Sample templates for quick preview test
  const handleLoadSample = (type: 'docx' | 'xlsx' | 'gform') => {
    if (type === 'docx') {
      setInputText(
`[SOAL]
Kromosom yang menentukan jenis kelamin pada manusia disebut dengan istilah?
A. Autosom
B. Gonosom
C. Alel
D. Sentromer
KUNCI: B
TIPE: PG

[SOAL]
Pilihlah komponen-komponen yang menyusun nukleotida pada molekul DNA (jawaban lebih dari satu):
A. Gula Deoksiribosa
B. Gugus Fosfat
C. Basa Nitrogen Adenin
D. Asam Amino Glukosa
KUNCI: A,B,C
TIPE: MCMA

[SOAL]
Analisis 4 pernyataan berikut mengenai sistem respirasi aerob dan respirasi anaerob:
1. Glikolisis tidak membutuhkan oksigen dan menghasilkan 2 ATP
2. Fermentasi asam laktat menghasilkan senyawa karbondioksida (CO2)
3. Siklus Krebs berlangsung di dalam matriks mitokondria
4. Transpor elektron menghasilkan jumlah molekul ATP paling sedikit
TIPE: TABEL`
      );
    } else if (type === 'xlsx') {
      setInputText(
`No;Tipe;Pertanyaan;Opsi A;Opsi B;Opsi C;Opsi D;Opsi E;Kunci;Skor
1;PG;Port standar yang digunakan untuk transmisi web protokol aman HTTPS adalah?;Port 21;Port 80;Port 443;Port 8080;Port 25;C;25
2;MCMA;Manakah di antara perangkat keras berikut yang bekerja pada Lapisan Jaringan (Network Layer) dan Data Link Layer OSI Model?;Router;Switch Layer 2;Kabel UTP;Access Point Bridge;Repeater Pasif;A,B,D;30
3;TABEL;Tentukan kebenaran 4 pernyataan mengenai enkripsi simetris dan asimetris:;Kriptografi asimetris menggunakan sepasang kunci privat dan publik;B;Enkripsi AES adalah contoh algoritma asimetris berkecepatan rendah;S;Fungsi Hash MD5 dan SHA-1 saat ini tidak lagi direkomendasikan karena rentan collision;B;Digital Signature dibuat menggunakan kunci publik pengirim;S;-;35`
      );
    } else if (type === 'gform') {
      setInputText(
`[
  {
    "title": "Berdasarkan Hukum Kepler III, kuadrat periode revolusi planet berbanding lurus dengan pangkat tiga dari?",
    "type": "MULTIPLE_CHOICE",
    "options": ["Massa jenis planet", "Jarak rata-rata planet ke matahari", "Kecepatan orbit rotasi", "Diameter ekuator planet"],
    "correctOptions": ["B"]
  },
  {
    "title": "Tentukan kebenaran hukum fisika modern pada 4 pernyataan berikut:",
    "type": "MATRIX",
    "statements": [
      { "text": "Cahaya memiliki sifat dualisme gelombang dan partikel", "isCorrect": true },
      { "text": "Efek fotolistrik membuktikan cahaya sebagai partikel foton", "isCorrect": true },
      { "text": "Kecepatan cahaya di ruang hampa bergantung pada kecepatan sumber cahaya", "isCorrect": false },
      { "text": "Massa benda bertambah ketika bergerak mendekati kecepatan cahaya", "isCorrect": true }
    ]
  }
]`
      );
    }
  };

  const handleParse = () => {
    let res;
    if (activeTab === 'docx') {
      res = parseDocxText(inputText);
    } else if (activeTab === 'xlsx') {
      res = parseXlsxCsvText(inputText);
    } else {
      res = parseGoogleFormContent(inputText);
    }

    setPreviewQuestions(res.questions);
    setErrors(res.errors);
    setHasParsed(true);
  };

  const handleConfirmImport = () => {
    if (previewQuestions.length === 0) return;
    onImport(previewQuestions);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          if (buffer) {
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
            setInputText(csv);
            setActiveTab('xlsx');
          }
        } catch (err: any) {
          setErrors([`Gagal membaca file Excel (.xlsx/.xls): ${err.message}`]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          setInputText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tool Import Butir Soal (DOCX, XLSX/CSV, Google Form)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Impor banyak soal sekaligus tanpa harus mengetik satu demi satu.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => { setActiveTab('xlsx'); setHasParsed(false); setPreviewQuestions([]); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'xlsx' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Format Excel / CSV (.xlsx, .csv)</span>
          </button>
          <button
            onClick={() => { setActiveTab('docx'); setHasParsed(false); setPreviewQuestions([]); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'docx' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Format Kartu Soal DOCX / Teks</span>
          </button>
          <button
            onClick={() => { setActiveTab('gform'); setHasParsed(false); setPreviewQuestions([]); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gform' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FormInput className="w-4 h-4 text-purple-600" />
            <span>Google Form (JSON / Form Copy)</span>
          </button>
        </div>

        {/* Action Header per Tab */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md font-medium text-slate-700 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File</span>
              <input type="file" accept=".txt,.csv,.json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => handleLoadSample(activeTab)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md font-medium text-slate-700"
            >
              Muat Contoh Data
            </button>
          </div>

          {activeTab === 'xlsx' && (
            <button
              onClick={downloadSampleExcel}
              className="px-3 py-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Format Excel (.csv)</span>
            </button>
          )}
        </div>

        {/* Text Input Area */}
        <div className="mb-4">
          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeTab === 'xlsx'
                ? "Tempelkan data spreadsheet di sini (pisahkan titik koma atau koma)...\nContoh: 1;PG;Soal...;Opsi A;Opsi B;Opsi C;Opsi D;Opsi E;Kunci;Skor"
                : activeTab === 'docx'
                ? "Tempelkan teks kartu soal DOCX di sini...\n[SOAL]\nPertanyaan...\nA. Opsi A\nB. Opsi B\nKUNCI: A"
                : "Tempelkan format JSON Google Form atau teks pertanyaan di sini..."
            }
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleParse}
            disabled={!inputText.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
          >
            Konversi & Analisis Butir Soal
          </button>

          {hasParsed && (
            <span className="text-xs text-slate-600 font-medium">
              Hasil Deteksi: <strong className="text-emerald-600">{previewQuestions.length} Butir Soal Siap Diimpor</strong>
            </span>
          )}
        </div>

        {/* Error notifications */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>Peringatan Format:</span>
            </div>
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        {/* Preview Questions */}
        {previewQuestions.length > 0 && (
          <div className="mb-5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50 p-2 text-xs">
            {previewQuestions.map((q, i) => (
              <div key={i} className="p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">#{i + 1} [{q.type.toUpperCase()}]</span>
                  <span className="text-slate-500 font-mono">Skor: {q.score}</span>
                </div>
                <p className="text-slate-700 truncate">{q.text}</p>
                {q.type === 'true_false_matrix' && (
                  <span className="text-[11px] text-blue-600 font-semibold">Tabel 4 Pernyataan Benar/Salah</span>
                )}
                {q.options && (
                  <span className="text-[11px] text-slate-500">
                    Opsi: {q.options.map(o => o.label).join(', ')} · Kunci: {q.correctOptions?.join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

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
            disabled={previewQuestions.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Impor {previewQuestions.length} Butir Soal ke Ujian</span>
          </button>
        </div>
      </div>
    </div>
  );
};
