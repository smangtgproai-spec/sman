/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  Calculator, 
  Atom, 
  FlaskConical, 
  Binary, 
  HelpCircle,
  PlusCircle,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';

export type EquationCategory = 'math' | 'physics' | 'chemistry' | 'scientific';

interface EquationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (formulaText: string, targetField?: string) => void;
  availableTargets?: { id: string; label: string }[];
  defaultTarget?: string;
}

interface FormulaPreset {
  label: string;
  latex: string;
  description: string;
  category: EquationCategory;
}

const PRESET_FORMULAS: FormulaPreset[] = [
  // --- MATEMATIKA ---
  {
    category: 'math',
    label: 'Rumus Kuadrat (ABC)',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    description: 'Penyelesaian persamaan kuadrat ax² + bx + c = 0',
  },
  {
    category: 'math',
    label: 'Pecahan Biasa',
    latex: '\\frac{a}{b}',
    description: 'Pecahan pembilang a dan penyebut b',
  },
  {
    category: 'math',
    label: 'Pangkat & Eksponen',
    latex: 'x^{n} + y^{m}',
    description: 'Notasi bilangan berpangkat eksponensial',
  },
  {
    category: 'math',
    label: 'Akar Kuadrat & Kubik',
    latex: '\\sqrt{x} \\quad \\text{atau} \\quad \\sqrt[3]{x}',
    description: 'Bentuk akar kuadrat atau akar pangkat-n',
  },
  {
    category: 'math',
    label: 'Trigonometri Identitas',
    latex: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1',
    description: 'Identitas dasar trigonometri',
  },
  {
    category: 'math',
    label: 'Integral Tertentu',
    latex: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)',
    description: 'Kalkulus integral tentu dari batas a ke b',
  },
  {
    category: 'math',
    label: 'Deret & Notasi Sigma',
    latex: '\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\dots + x_n',
    description: 'Penjumlahan beruntun deret suku',
  },
  {
    category: 'math',
    label: 'Limit Fungsi',
    latex: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1',
    description: 'Konsep limit fungsi matematika',
  },
  {
    category: 'math',
    label: 'Matriks 2x2',
    latex: 'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    description: 'Matriks ordo 2x2 dengan tanda kurung bundar',
  },
  {
    category: 'math',
    label: 'Vektor Posisi & Titik',
    latex: '\\vec{v} = v_x \\hat{i} + v_y \\hat{j}',
    description: 'Notasi vektor komponen sumbu i dan j',
  },

  // --- FISIKA ---
  {
    category: 'physics',
    label: 'Hukum II Newton',
    latex: '\\Sigma \\vec{F} = m \\cdot \\vec{a}',
    description: 'Resultan gaya sama dengan massa dikali percepatan',
  },
  {
    category: 'physics',
    label: 'GLBB (Jarak & Waktu)',
    latex: 's = v_0 t + \\frac{1}{2} a t^2',
    description: 'Jarak tempuh gerak lurus berubah beraturan',
  },
  {
    category: 'physics',
    label: 'Kecepatan Akhir GLBB',
    latex: 'v_t^2 = v_0^2 + 2 a s',
    description: 'Hubungan kecepatan akhir dengan jarak percepatan',
  },
  {
    category: 'physics',
    label: 'Energi Kinetik',
    latex: 'E_k = \\frac{1}{2} m v^2',
    description: 'Energi yang dimiliki benda karena geraknya',
  },
  {
    category: 'physics',
    label: 'Energi Potensial Gravitasi',
    latex: 'E_p = m \\cdot g \\cdot h',
    description: 'Energi potensial ketinggian benda di medan gravitasi',
  },
  {
    category: 'physics',
    label: 'Hukum Gravitasi Newton',
    latex: 'F = G \\frac{m_1 m_2}{r^2}',
    description: 'Gaya tarik gravitasi antara dua massa',
  },
  {
    category: 'physics',
    label: 'Hukum Ohm & Hambatan',
    latex: 'V = I \\cdot R \\quad \\text{atau} \\quad P = V \\cdot I',
    description: 'Tegangan, kuat arus listrik, dan daya listrik',
  },
  {
    category: 'physics',
    label: 'Gaya Coulomb (Elektrostatis)',
    latex: 'F = k \\frac{|q_1 q_2|}{r^2}',
    description: 'Gaya interaksi antara dua muatan listrik titik',
  },
  {
    category: 'physics',
    label: 'Tekanan Hidrostatis',
    latex: 'P_h = \\rho \\cdot g \\cdot h',
    description: 'Tekanan cairan pada kedalaman tertentu',
  },
  {
    category: 'physics',
    label: 'Kalor & Perubahan Suhu',
    latex: 'Q = m \\cdot c \\cdot \\Delta T',
    description: 'Kalor yang diserap atau dilepas zat',
  },
  {
    category: 'physics',
    label: 'Gelombang & Frekuensi',
    latex: 'v = \\lambda \\cdot f \\quad \\text{dengan} \\quad T = \\frac{1}{f}',
    description: 'Cepat rambat gelombang, panjang gelombang, dan frekuensi',
  },

  // --- KIMIA ---
  {
    category: 'chemistry',
    label: 'Reaksi Pembentukan Air',
    latex: '2\\text{H}_2(g) + \\text{O}_2(g) \\rightarrow 2\\text{H}_2\\text{O}(l)',
    description: 'Reaksi sintesis hidrogen dan oksigen menghasilkan air',
  },
  {
    category: 'chemistry',
    label: 'Reaksi Netralisasi Asam-Basa',
    latex: '\\text{HCl}(aq) + \\text{NaOH}(aq) \\rightarrow \\text{NaCl}(aq) + \\text{H}_2\\text{O}(l)',
    description: 'Asam klorida bereaksi dengan natrium hidroksida',
  },
  {
    category: 'chemistry',
    label: 'Reaksi Pembakaran Metana',
    latex: '\\text{CH}_4(g) + 2\\text{O}_2(g) \\rightarrow \\text{CO}_2(g) + 2\\text{H}_2\\text{O}(g)',
    description: 'Pembakaran hidrokarbon gas metana',
  },
  {
    category: 'chemistry',
    label: 'Reaksi Kesetimbangan Amonia',
    latex: '\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)',
    description: 'Proses Haber-Bosch dalam reaksi kesetimbangan dinamis',
  },
  {
    category: 'chemistry',
    label: 'Fotosintesis Biokimia',
    latex: '6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{cahaya}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2',
    description: 'Persamaan fotosintesis glukosa dan oksigen',
  },
  {
    category: 'chemistry',
    label: 'Senyawa Kimia Populer',
    latex: '\\text{H}_2\\text{SO}_4, \\quad \\text{CaCO}_3, \\quad \\text{KMnO}_4, \\quad \\text{CH}_3\\text{COOH}',
    description: 'Asam sulfat, kalsium karbonat, kalium permanganat, asam asetat',
  },
  {
    category: 'chemistry',
    label: 'Ion & Muatan Listrik',
    latex: '\\text{Na}^+, \\quad \\text{Ca}^{2+}, \\quad \\text{Fe}^{3+}, \\quad \\text{SO}_4^{2-}, \\quad \\text{NH}_4^+',
    description: 'Kation dan anion dengan muatan atas',
  },
  {
    category: 'chemistry',
    label: 'Notasi Isotop & Radioaktif',
    latex: '_{6}^{14}\\text{C} \\rightarrow \\, _{7}^{14}\\text{N} + \\, _{-1}^{0}\\beta',
    description: 'Peluruhan beta isotop Karbon-14 menjadi Nitrogen-14',
  },
  {
    category: 'chemistry',
    label: 'Rumus Derajat Keasaman (pH)',
    latex: '\\text{pH} = -\\log[\\text{H}^+] \\quad \\text{dan} \\quad \\text{pOH} = -\\log[\\text{OH}^-]',
    description: 'Definisi derajat keasaman larutan',
  },

  // --- NOTASI ILMIAH & ANGKA PENTING ---
  {
    category: 'scientific',
    label: 'Bilangan Avogadro',
    latex: 'N_A = 6.022 \\times 10^{23} \\text{ partikel/mol}',
    description: 'Jumlah partikel per satu mol zat',
  },
  {
    category: 'scientific',
    label: 'Kecepatan Cahaya di Ruang Hampa',
    latex: 'c = 3.00 \\times 10^8 \\text{ m/s}',
    description: 'Konstanta kecepatan rambat gelombang elektromagnetik',
  },
  {
    category: 'scientific',
    label: 'Konstanta Planck',
    latex: 'h = 6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}',
    description: 'Konstanta fundamental mekanika kuantum',
  },
  {
    category: 'scientific',
    label: 'Muatan Elementer Elektron',
    latex: 'e = 1.602 \\times 10^{-19} \\text{ C}',
    description: 'Besar muatan satu partikel elektron atau proton',
  },
  {
    category: 'scientific',
    label: 'Massa Diam Elektron',
    latex: 'm_e = 9.109 \\times 10^{-31} \\text{ kg}',
    description: 'Massa elektron dalam satuan baku kg',
  },
  {
    category: 'scientific',
    label: 'Konstanta Gravitasi Universal',
    latex: 'G = 6.674 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2',
    description: 'Konstanta umum gravitasi Newton',
  },
  {
    category: 'scientific',
    label: 'Format Notasi Ilmiah Umum',
    latex: 'a \\times 10^{n} \\quad (1 \\le a < 10)',
    description: 'Bentuk baku penulisan angka penting',
  },
];

// Quick Symbol Buttons for one-click insertion
const QUICK_SYMBOLS = [
  { symbol: '\\frac{a}{b}', display: 'a/b', desc: 'Pecahan' },
  { symbol: 'x^{2}', display: 'x²', desc: 'Kuadrat' },
  { symbol: 'x^{n}', display: 'xⁿ', desc: 'Pangkat n' },
  { symbol: 'x_{1}', display: 'x₁', desc: 'Subskrip 1' },
  { symbol: '\\sqrt{x}', display: '√x', desc: 'Akar kuadrat' },
  { symbol: '\\pm', display: '±', desc: 'Plus-minus' },
  { symbol: '\\times', display: '×', desc: 'Kali' },
  { symbol: '\\div', display: '÷', desc: 'Bagi' },
  { symbol: '\\approx', display: '≈', desc: 'Mendekati' },
  { symbol: '\\neq', display: '≠', desc: 'Tidak sama dengan' },
  { symbol: '\\le', display: '≤', desc: 'Kurang dari sama dengan' },
  { symbol: '\\ge', display: '≥', desc: 'Lebih dari sama dengan' },
  { symbol: '\\pi', display: 'π', desc: 'Pi' },
  { symbol: '\\theta', display: 'θ', desc: 'Theta' },
  { symbol: '\\alpha', display: 'α', desc: 'Alfa' },
  { symbol: '\\beta', display: 'β', desc: 'Beta' },
  { symbol: '\\Delta', display: 'Δ', desc: 'Delta' },
  { symbol: '\\lambda', display: 'λ', desc: 'Lambda' },
  { symbol: '\\Omega', display: 'Ω', desc: 'Ohm' },
  { symbol: '\\mu', display: 'μ', desc: 'Mikro' },
  { symbol: '\\rho', display: 'ρ', desc: 'Massa jenis / Rho' },
  { symbol: '\\rightarrow', display: '→', desc: 'Reaksi searah' },
  { symbol: '\\rightleftharpoons', display: '⇌', desc: 'Kesetimbangan' },
  { symbol: '\\infty', display: '∞', desc: 'Tak hingga' },
  { symbol: '\\times 10^{n}', display: '×10ⁿ', desc: 'Notasi Ilmiah' },
  { symbol: '\\text{H}_2\\text{O}', display: 'H₂O', desc: 'Air' },
  { symbol: '\\text{CO}_2', display: 'CO₂', desc: 'Karbon Dioksida' },
  { symbol: '_{Z}^{A}\\text{X}', display: 'ᴬᶻX', desc: 'Isotop' },
];

export const EquationEditorModal: React.FC<EquationEditorModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  availableTargets = [
    { id: 'question_text', label: 'Teks Soal / Stimulus' },
    { id: 'opt_A', label: 'Opsi Jawaban A' },
    { id: 'opt_B', label: 'Opsi Jawaban B' },
    { id: 'opt_C', label: 'Opsi Jawaban C' },
    { id: 'opt_D', label: 'Opsi Jawaban D' },
    { id: 'explanation', label: 'Penjelasan / Pembahasan' },
  ],
  defaultTarget = 'question_text',
}) => {
  const [activeCategory, setActiveCategory] = useState<EquationCategory>('math');
  const [currentLatex, setCurrentLatex] = useState<string>('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [displayMode, setDisplayMode] = useState<'inline' | 'block'>('inline');
  const [selectedTarget, setSelectedTarget] = useState<string>(defaultTarget);
  const [copied, setCopied] = useState<boolean>(false);

  // Interactive Builder States
  const [builderType, setBuilderType] = useState<'custom' | 'fraction' | 'power' | 'root' | 'scientific' | 'chemistry'>('custom');
  
  // Fraction Builder
  const [fracNum, setFracNum] = useState<string>('a');
  const [fracDen, setFracDen] = useState<string>('b');

  // Power Builder
  const [powerBase, setPowerBase] = useState<string>('x');
  const [powerExp, setPowerExp] = useState<string>('2');

  // Root Builder
  const [rootRadicand, setRootRadicand] = useState<string>('x');
  const [rootDegree, setRootDegree] = useState<string>('');

  // Scientific Notation Builder
  const [sciCoeff, setSciCoeff] = useState<string>('3.00');
  const [sciExp, setSciExp] = useState<string>('8');
  const [sciUnit, setSciUnit] = useState<string>('\\text{m/s}');

  // Chemistry Compound Builder
  const [chemReactants, setChemReactants] = useState<string>('2\\text{H}_2(g) + \\text{O}_2(g)');
  const [chemArrow, setChemArrow] = useState<string>('\\rightarrow');
  const [chemProducts, setChemProducts] = useState<string>('2\\text{H}_2\\text{O}(l)');

  // Filter presets by active category
  const filteredPresets = useMemo(() => {
    return PRESET_FORMULAS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  if (!isOpen) return null;

  // Insert symbol or text into the current cursor / equation
  const handleInsertSymbol = (symbolLatex: string) => {
    setCurrentLatex((prev) => {
      if (!prev) return symbolLatex;
      return `${prev} ${symbolLatex}`;
    });
  };

  // Build formula from builder sub-forms
  const applyFraction = () => {
    const res = `\\frac{${fracNum.trim() || 'a'}}{${fracDen.trim() || 'b'}}`;
    setCurrentLatex(res);
  };

  const applyPower = () => {
    const res = `${powerBase.trim() || 'x'}^{${powerExp.trim() || '2'}}`;
    setCurrentLatex(res);
  };

  const applyRoot = () => {
    if (rootDegree.trim()) {
      setCurrentLatex(`\\sqrt[${rootDegree.trim()}]{${rootRadicand.trim() || 'x'}}`);
    } else {
      setCurrentLatex(`\\sqrt{${rootRadicand.trim() || 'x'}}`);
    }
  };

  const applyScientific = () => {
    const unitPart = sciUnit.trim() ? ` ${sciUnit.trim()}` : '';
    setCurrentLatex(`${sciCoeff.trim() || '1.0'} \\times 10^{${sciExp.trim() || '1'}}${unitPart}`);
  };

  const applyChemistry = () => {
    setCurrentLatex(`${chemReactants.trim()} ${chemArrow} ${chemProducts.trim()}`);
  };

  // Final insertion to question or option
  const handleFinalInsert = () => {
    if (!currentLatex.trim()) return;
    const formatted = displayMode === 'block' ? `$$${currentLatex.trim()}$$` : `$${currentLatex.trim()}$`;
    onInsert(formatted, selectedTarget);
    onClose();
  };

  const handleCopyLatex = () => {
    const formatted = displayMode === 'block' ? `$$${currentLatex.trim()}$$` : `$${currentLatex.trim()}$`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tool Equation & Rumus Ilmiah
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                  Matematika · Fisika · Kimia
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Pembuat rumus matematika, fisika, reaksi kimia, dan notasi ilmiah untuk butir soal asesmen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('math')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeCategory === 'math'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Matematika (Aljabar, Kalkulus, Geometri)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('physics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeCategory === 'physics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Fisika (Mekanika, Listrik, Kalor, Gelombang)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('chemistry')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeCategory === 'chemistry'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Kimia (Reaksi, Senyawa, Ion, Isotop)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('scientific')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeCategory === 'scientific'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Notasi Ilmiah & Konstanta Baku</span>
          </button>
        </div>

        {/* Quick Symbols Strip */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Simbol & Operator Cepat (Klik untuk menyisipkan):
            </span>
            <span className="text-[10px] text-slate-400">
              Format LaTeX otomatis dirender ke teks ujian
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUICK_SYMBOLS.map((qs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInsertSymbol(qs.symbol)}
                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-800 text-xs font-mono font-bold rounded border border-slate-200 transition-all shrink-0 cursor-pointer"
                title={`${qs.desc} (${qs.symbol})`}
              >
                {qs.display}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Section: LIVE PREVIEW BANNER */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Preview (Tampilan Riil yang Dilihat Siswa):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMode(displayMode === 'inline' ? 'block' : 'inline')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-indigo-200 cursor-pointer border border-white/20"
                >
                  Mode: {displayMode === 'inline' ? 'Inline (Sejajar Teks)' : 'Display Block (Terpusat)'}
                </button>
              </div>
            </div>

            <div className="min-h-18 p-4 bg-slate-950/70 rounded-xl border border-indigo-500/30 flex items-center justify-center overflow-x-auto text-center">
              {currentLatex.trim() ? (
                <div className="text-xl sm:text-2xl font-serif tracking-wide text-white py-1">
                  <MathRenderer
                    content={displayMode === 'block' ? `$$${currentLatex}$$` : `$${currentLatex}$`}
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Belum ada rumus yang diketik atau dipilih. Silakan pilih rumus dari template di bawah.
                </span>
              )}
            </div>
          </div>

          {/* Middle Section: Template & Generator Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Formula Templates Grid (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Koleksi Rumus Standar ({filteredPresets.length} Template)
                </h4>
                <span className="text-[11px] text-slate-500">Klik untuk memuat ke editor</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-76 overflow-y-auto pr-1">
                {filteredPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentLatex(preset.latex)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                      currentLatex === preset.latex
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">
                          {preset.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs text-slate-800">
                      <MathRenderer content={`$${preset.latex}$`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Interactive Visual Builder & Raw LaTeX Input (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Quick Visual Form Generator */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Generator Rumus Cepat
                  </h5>
                  <select
                    value={builderType}
                    onChange={(e) => setBuilderType(e.target.value as any)}
                    className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 cursor-pointer"
                  >
                    <option value="custom">Edit Kode Manual</option>
                    <option value="fraction">Pecahan (a/b)</option>
                    <option value="power">Pangkat (xⁿ)</option>
                    <option value="root">Bentuk Akar (ⁿ√x)</option>
                    <option value="scientific">Notasi Ilmiah (a×10ⁿ)</option>
                    <option value="chemistry">Persamaan Reaksi Kimia</option>
                  </select>
                </div>

                {/* Sub-form 1: Fraction */}
                {builderType === 'fraction' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Pembilang (atas):</label>
                        <input
                          type="text"
                          value={fracNum}
                          onChange={(e) => setFracNum(e.target.value)}
                          placeholder="Contoh: -b \pm \sqrt{D}"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Penyebut (bawah):</label>
                        <input
                          type="text"
                          value={fracDen}
                          onChange={(e) => setFracDen(e.target.value)}
                          placeholder="Contoh: 2a"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyFraction}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Bentuk Pecahan
                    </button>
                  </div>
                )}

                {/* Sub-form 2: Power */}
                {builderType === 'power' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Bilangan Pokok (Basis):</label>
                        <input
                          type="text"
                          value={powerBase}
                          onChange={(e) => setPowerBase(e.target.value)}
                          placeholder="Contoh: x atau (a+b)"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Eksponen (Pangkat):</label>
                        <input
                          type="text"
                          value={powerExp}
                          onChange={(e) => setPowerExp(e.target.value)}
                          placeholder="Contoh: 2 atau -3"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyPower}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Bentuk Bilangan Berpangkat
                    </button>
                  </div>
                )}

                {/* Sub-form 3: Root */}
                {builderType === 'root' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Indeks Akar (Kosongkan jika √):</label>
                        <input
                          type="text"
                          value={rootDegree}
                          onChange={(e) => setRootDegree(e.target.value)}
                          placeholder="Contoh: 3 untuk kubik"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Nilai di Dalam Akar:</label>
                        <input
                          type="text"
                          value={rootRadicand}
                          onChange={(e) => setRootRadicand(e.target.value)}
                          placeholder="Contoh: b^2 - 4ac"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyRoot}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Bentuk Simbol Akar
                    </button>
                  </div>
                )}

                {/* Sub-form 4: Scientific Notation */}
                {builderType === 'scientific' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Koefisien (a):</label>
                        <input
                          type="text"
                          value={sciCoeff}
                          onChange={(e) => setSciCoeff(e.target.value)}
                          placeholder="3.00"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Pangkat 10 (n):</label>
                        <input
                          type="text"
                          value={sciExp}
                          onChange={(e) => setSciExp(e.target.value)}
                          placeholder="8"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Satuan:</label>
                        <input
                          type="text"
                          value={sciUnit}
                          onChange={(e) => setSciUnit(e.target.value)}
                          placeholder="\text{m/s}"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyScientific}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Bentuk Notasi Ilmiah
                    </button>
                  </div>
                )}

                {/* Sub-form 5: Chemistry */}
                {builderType === 'chemistry' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Reaktan (Zat Sebelum Reaksi):</label>
                      <input
                        type="text"
                        value={chemReactants}
                        onChange={(e) => setChemReactants(e.target.value)}
                        placeholder="2\text{H}_2(g) + \text{O}_2(g)"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Tanda Panah:</label>
                        <select
                          value={chemArrow}
                          onChange={(e) => setChemArrow(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        >
                          <option value="\rightarrow">→ (Reaksi Searah)</option>
                          <option value="\rightleftharpoons">⇌ (Kesetimbangan Bolak-Balik)</option>
                          <option value="\xrightarrow{\Delta}">→ (dengan Pemanasan Δ)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Produk (Hasil Reaksi):</label>
                        <input
                          type="text"
                          value={chemProducts}
                          onChange={(e) => setChemProducts(e.target.value)}
                          placeholder="2\text{H}_2\text{O}(l)"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyChemistry}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Bentuk Reaksi Kimia
                    </button>
                  </div>
                )}
              </div>

              {/* Raw LaTeX Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Sintaks LaTeX Rumus Aktif:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyLatex}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={currentLatex}
                  onChange={(e) => setCurrentLatex(e.target.value)}
                  placeholder="Ketik kode LaTeX di sini atau pilih rumus dari koleksi..."
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tips: Gunakan <code>\text{'{nama}'}</code> untuk nama unsur kimia, <code>_</code> untuk indeks bawah, dan <code>^</code> untuk pangkat atas.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Target Placement Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700 shrink-0">
              Target Penyisipan:
            </span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 shadow-2xs cursor-pointer w-full sm:w-56"
            >
              {availableTargets.map((tgt) => (
                <option key={tgt.id} value={tgt.id}>
                  {tgt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleFinalInsert}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Sisipkan Rumus ke Soal</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
