/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Student } from '../../types/exam';
import { 
  CreditCard, 
  Printer, 
  CheckSquare, 
  Square, 
  Search, 
  Filter, 
  X, 
  Check, 
  DoorOpen, 
  Layers, 
  Eye, 
  ListFilter,
  User,
  ShieldCheck,
  Building
} from 'lucide-react';

interface ExamCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  operatorName: string;
  initialSelectedStudentId?: string;
}

export const ExamCardsModal: React.FC<ExamCardsModalProps> = ({
  isOpen,
  onClose,
  students,
  operatorName,
  initialSelectedStudentId,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedStudentId) {
      return [initialSelectedStudentId];
    }
    return students.map(s => s.id); // Default to all students selected
  });

  const [classFilter, setClassFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'selection'>('preview');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Available classes and rooms
  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();
  }, [students]);

  const availableRooms = useMemo(() => {
    return Array.from(new Set(students.map(s => s.room || 'Ruang 1').filter(Boolean))).sort();
  }, [students]);

  // Filtered students according to current dropdowns & search
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchClass = classFilter === 'all' || st.className === classFilter;
      const matchRoom = roomFilter === 'all' || (st.room || 'Ruang 1') === roomFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = 
        !query || 
        st.name.toLowerCase().includes(query) || 
        st.nisn.includes(query) || 
        (st.token && st.token.toLowerCase().includes(query));

      return matchClass && matchRoom && matchQuery;
    });
  }, [students, classFilter, roomFilter, searchQuery]);

  // Students that are currently selected AND match filtered view (or all selected)
  const selectedStudents = useMemo(() => {
    return students.filter(st => selectedIds.includes(st.id));
  }, [students, selectedIds]);

  if (!isOpen) return null;

  // Toggle selection for a single student
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all visible students in current filter
  const handleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map(s => s.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  // Deselect all visible students in current filter
  const handleDeselectVisible = () => {
    const visibleIdsSet = new Set(filteredStudents.map(s => s.id));
    setSelectedIds(prev => prev.filter(id => !visibleIdsSet.has(id)));
  };

  // Select ALL students across whole system
  const handleSelectAllGlobal = () => {
    setSelectedIds(students.map(s => s.id));
  };

  // Deselect ALL
  const handleDeselectAllGlobal = () => {
    setSelectedIds([]);
  };

  // Print function using invisible iframe to prevent popup blockers
  const handlePrint = () => {
    if (selectedStudents.length === 0) return;
    setIsPrinting(true);

    const logoUrl = 'https://iili.io/f0D1nQs.png';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const cardsHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kartu Peserta Ujian CBT - SmanGt EduSecure</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.35;
          }
          .cards-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .exam-card {
            border: 1.5px dashed #475569;
            border-radius: 8px;
            padding: 10px 12px;
            background: #ffffff;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            min-height: 250px;
          }
          .card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .card-logo {
            width: 44px;
            height: 44px;
            object-fit: contain;
            flex-shrink: 0;
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .header-title {
            font-size: 10.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
            color: #0f172a;
          }
          .header-subtitle {
            font-size: 8.5pt;
            font-weight: 700;
            color: #1e3a8a;
            margin: 1px 0 0 0;
            letter-spacing: 0.3px;
          }
          .header-meta {
            font-size: 7pt;
            color: #64748b;
            margin: 1px 0 0 0;
          }
          .card-body {
            display: flex;
            gap: 10px;
            margin-bottom: 6px;
          }
          .photo-box {
            width: 70px;
            height: 88px;
            border: 1px solid #94a3b8;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 7.5pt;
            color: #64748b;
            text-align: center;
            flex-shrink: 0;
            border-radius: 4px;
          }
          .info-table {
            flex: 1;
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
          }
          .info-table td {
            padding: 2.5px 3px;
            vertical-align: top;
          }
          .info-table td.label {
            width: 82px;
            font-weight: 600;
            color: #334155;
          }
          .info-table td.colon {
            width: 8px;
            text-align: center;
          }
          .info-table td.val {
            font-weight: 700;
            color: #0f172a;
          }
          .token-badge {
            display: inline-block;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 2px 7px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: 800;
            font-size: 9.5pt;
            letter-spacing: 1px;
            color: #0f172a;
          }
          .card-footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 7.5pt;
          }
          .instructions {
            max-width: 55%;
            color: #64748b;
            font-size: 6.8pt;
            line-height: 1.25;
          }
          .signature-box {
            text-align: center;
            width: 42%;
          }
          .signature-space {
            height: 28px;
          }
          .operator-name {
            font-weight: 700;
            border-bottom: 1px solid #0f172a;
            display: inline-block;
            padding: 0 4px;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="cards-container">
          ${selectedStudents.map(st => `
            <div class="exam-card">
              <div class="card-header">
                <img src="${logoUrl}" alt="Logo" class="card-logo" />
                <div class="header-text">
                  <h3 class="header-title">KARTU PESERTA UJIAN CBT</h3>
                  <p class="header-subtitle">SMANGT EDUSECURE CBT</p>
                  <p class="header-meta">Sistem Ujian Online Terproteksi Anti-Curang</p>
                </div>
              </div>

              <div class="card-body">
                <div class="photo-box">
                  <div style="font-size: 16px; margin-bottom: 2px;">👤</div>
                  <span>PASFOTO</span>
                  <span style="font-size: 6.5pt; color: #94a3b8;">2 x 3 cm</span>
                </div>

                <table class="info-table">
                  <tr>
                    <td class="label">Nama Peserta</td>
                    <td class="colon">:</td>
                    <td class="val">${st.name}</td>
                  </tr>
                  <tr>
                    <td class="label">NISN</td>
                    <td class="colon">:</td>
                    <td class="val"><span style="font-family: monospace;">${st.nisn}</span></td>
                  </tr>
                  <tr>
                    <td class="label">Kelas</td>
                    <td class="colon">:</td>
                    <td class="val">${st.className}</td>
                  </tr>
                  <tr>
                    <td class="label">Ruang Ujian</td>
                    <td class="colon">:</td>
                    <td class="val"><strong>${st.room || 'Ruang 1'}</strong></td>
                  </tr>
                  <tr>
                    <td class="label">Token Login</td>
                    <td class="colon">:</td>
                    <td class="val">
                      <span class="token-badge">${st.token || 'SISWA-0000'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">Asal Sekolah</td>
                    <td class="colon">:</td>
                    <td class="val" style="font-size: 7.5pt;">${st.school || 'SMA Negeri Unggulan'}</td>
                  </tr>
                </table>
              </div>

              <div class="card-footer">
                <div class="instructions">
                  <strong>Tata Tertib:</strong><br>
                  • Kartu wajib dibawa saat asesmen.<br>
                  • Token unik bersifat rahasia.<br>
                  • Dilarang bertukar token atau berbuat curang.
                </div>
                <div class="signature-box">
                  <div>Dicetak: ${currentDate}</div>
                  <div style="font-size: 7pt; color: #475569;">Master Operator / Proktor</div>
                  <div class="signature-space"></div>
                  <div class="operator-name">${operatorName}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

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
        <div class="no-print" style="position: sticky; top: 0; left: 0; right: 0; background: #0f172a; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoUrl}" alt="Logo" style="width: 32px; height: 32px; object-fit: contain;" />
            <div>
              <div style="font-weight: bold; font-size: 14px; letter-spacing: 0.3px;">SmanGt EduSecure CBT · Cetak Kartu Peserta Ujian</div>
              <div style="font-size: 11px; color: #94a3b8;">${selectedStudents.length} Kartu Siswa Siap Dicetak (Format Kertas A4)</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button onclick="window.print()" style="background: #f59e0b; color: #0f172a; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px;">
              <span>🖨️ Cetak / Simpan PDF</span>
            </button>
            <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px;">
              <span>✕ Tutup</span>
            </button>
          </div>
        </div>
        ${cardsHtml}
      `);
      printWindow.document.close();
      printWindow.focus();
      setIsPrinting(false);
    } else {
      // Fallback to hidden iframe if popups are completely blocked
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
        doc.write(cardsHtml);
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-cards-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="exam-cards-modal-title" className="text-base font-bold text-white">
                  Cetak Kartu Peserta Ujian CBT
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {selectedStudents.length} Siswa Terpilih
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SmanGt EduSecure CBT · Cetak kartu ujian fisik / PDF dengan identitas Nama, NISN, Token & Kelas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Tab switch */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau ({selectedStudents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('selection')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'selection' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Pilih Siswa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NISN, atau token..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium"
              />
            </div>

            {/* Class filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Semua Kelas ({availableClasses.length})</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>

            {/* Room filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Ruang ({availableRooms.length})</option>
              {availableRooms.map(rm => (
                <option key={rm} value={rm}>{rm}</option>
              ))}
            </select>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Centang semua siswa yang saat ini tampil pada filter"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih Ditampilkan ({filteredStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllGlobal}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Centang seluruh siswa yang terdaftar di sistem"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih Semua Siswa ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAllGlobal}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 font-semibold border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Hapus semua pilihan centang"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              <span>Batal Pilih</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {selectedStudents.length === 0 && activeTab === 'preview' ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Belum Ada Siswa yang Dipilih</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                Silakan pilih siswa yang ingin dicetak kartu ujiannya dengan mencentang daftar peserta. Anda dapat memilih sebagian siswa atau semua siswa sekaligus.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllGlobal}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Pilih Semua Siswa ({students.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('selection')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Buka Daftar Centang
                </button>
              </div>
            </div>
          ) : activeTab === 'preview' ? (
            /* TAB PREVIEW: Visual Kartu Ujian Realistis */
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600">
                  Pratinjau Lembar Kartu Ujian: <strong className="text-slate-900">{selectedStudents.length} Kartu</strong> siap dicetak.
                </span>
                <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  💡 Format cetak: A4 (Grid 2 Kolom, batas potong putus-putus)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStudents.map(st => (
                  <div 
                    key={st.id}
                    className="bg-white border-2 border-dashed border-slate-400 rounded-xl p-4 shadow-sm relative flex flex-col justify-between hover:border-amber-500 transition-colors"
                  >
                    {/* Header Kartu */}
                    <div>
                      <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2.5 mb-3">
                        <img 
                          src="https://iili.io/f0D1nQs.png" 
                          alt="Logo SmanGt" 
                          className="w-11 h-11 object-contain shrink-0" 
                        />
                        <div className="text-center flex-1">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                            KARTU PESERTA UJIAN CBT
                          </h4>
                          <p className="text-[11px] font-bold text-blue-900">
                            SMANGT EDUSECURE CBT
                          </p>
                          <p className="text-[9px] text-slate-500">
                            Sistem Asesmen Terproteksi Anti-Curang
                          </p>
                        </div>
                      </div>

                      {/* Body Kartu: Pasfoto + Identitas */}
                      <div className="flex gap-3 text-xs mb-3">
                        {/* Box Foto */}
                        <div className="w-18 h-22 rounded bg-slate-50 border border-slate-300 flex flex-col items-center justify-center shrink-0 text-slate-400 p-1">
                          <User className="w-7 h-7 text-slate-300 mb-1" />
                          <span className="text-[9px] font-bold text-slate-500 leading-tight">PASFOTO</span>
                          <span className="text-[8px] text-slate-400">2 x 3 cm</span>
                        </div>

                        {/* Rincian Identitas Siswa */}
                        <div className="flex-1 space-y-1.5 text-xs">
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">Nama Siswa</span>
                            <span className="col-span-2 font-extrabold text-slate-900 text-xs">
                              {st.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">NISN</span>
                            <span className="col-span-2 font-mono font-bold text-slate-800 text-[11px]">
                              {st.nisn}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">Kelas</span>
                            <span className="col-span-2 font-bold text-blue-700 text-xs">
                              {st.className}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-500 font-semibold text-[11px]">Ruang Ujian</span>
                            <span className="col-span-2">
                              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {st.room || 'Ruang 1'}
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 items-center">
                            <span className="text-slate-500 font-semibold text-[11px]">Token Siswa</span>
                            <span className="col-span-2">
                              <span className="bg-slate-900 text-amber-300 font-mono font-extrabold px-2 py-0.5 rounded text-xs tracking-wider border border-slate-800 shadow-2xs">
                                {st.token || 'SISWA-0000'}
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-slate-500 font-semibold text-[10px]">Asal Sekolah</span>
                            <span className="col-span-2 text-slate-600 text-[11px] truncate">
                              {st.school}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu & Tanda Tangan */}
                    <div className="pt-2 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-500">
                      <div className="max-w-[55%] text-[9px] leading-tight space-y-0.5">
                        <span className="font-bold text-slate-700 block">Tata Tertib Ringkas:</span>
                        <span>• Wajib membawa kartu saat ujian.</span>
                        <span>• Token unik bersifat rahasia.</span>
                      </div>

                      <div className="text-center">
                        <span className="text-[9px] block">Master Operator CBT,</span>
                        <div className="h-6"></div>
                        <span className="font-bold text-slate-900 underline text-[10px]">
                          {operatorName}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Hapus dari pilihan kartu */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(st.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Keluarkan siswa ini dari cetakan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB SELECTION: Checklist Siswa Lengkap */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>
                  Centang nama siswa yang ingin dicetak kartunya. Menampilkan <strong>{filteredStudents.length}</strong> siswa.
                </span>
                <span className="font-bold text-amber-700">
                  {selectedIds.length} Siswa Terpilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredStudents.map(st => {
                  const isChecked = selectedIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSelect(st.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {st.name}
                        </h5>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          NISN: {st.nisn}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap">
                          <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded">
                            {st.className}
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded">
                            {st.room || 'Ruang 1'}
                          </span>
                          <span className="bg-slate-900 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded ml-auto">
                            {st.token}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                  Tidak ada siswa yang cocok dengan filter atau pencarian Anda.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Total: <strong>{selectedStudents.length} dari {students.length} Siswa</strong> terpilih untuk dicetak.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedStudents.length === 0 || isPrinting}
              className={`px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>
                {isPrinting 
                  ? 'Menyiapkan Cetakan...' 
                  : `Cetak ${selectedStudents.length} Kartu Ujian (PDF/Print)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
