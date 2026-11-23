/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, QuestionType } from '../types/exam';
import * as XLSX from 'xlsx';

export interface ParseResult {
  questions: Question[];
  successCount: number;
  errors: string[];
}

export function parseDocxText(rawText: string): ParseResult {
  const questions: Question[] = [];
  const errors: string[] = [];

  // Split by question delimiter (e.g., [SOAL] or 1., 2., 3.)
  const rawBlocks = rawText.split(/(?:\[SOAL\]|---soal---|^\d+[\.\)])/gim).filter(b => b.trim().length > 0);

  if (rawBlocks.length === 0) {
    return {
      questions: [],
      successCount: 0,
      errors: ['Format dokumen tidak dikenali. Pastikan menggunakan penanda [SOAL] atau penomoran 1., 2., dst.'],
    };
  }

  rawBlocks.forEach((block, idx) => {
    try {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) return;

      const questionText = lines[0];
      const optionLines = lines.filter(l => /^[A-E][\.\)]/i.test(l));
      const keyLine = lines.find(l => /(?:kunci|jawaban)\s*[:=]\s*([A-E,\s]+)/i.test(l));
      const typeLine = lines.find(l => /tipe\s*[:=]\s*(pg|mcma|tabel|matrix)/i.test(l));

      const typeStr = typeLine ? typeLine.toLowerCase() : 'pg';
      let type: QuestionType = 'pg';
      if (typeStr.includes('mcma')) type = 'mcma';
      if (typeStr.includes('tabel') || typeStr.includes('matrix')) type = 'true_false_matrix';

      let correctOptions: string[] = [];
      if (keyLine) {
        const match = keyLine.match(/(?:kunci|jawaban)\s*[:=]\s*([A-E,\s]+)/i);
        if (match && match[1]) {
          correctOptions = match[1].split(/[,|\s]+/).map(s => s.trim().toUpperCase()).filter(s => ['A','B','C','D','E'].includes(s));
        }
      }

      if (type === 'true_false_matrix') {
        questions.push({
          id: `imp-docx-${Date.now()}-${idx}`,
          type: 'true_false_matrix',
          text: questionText,
          score: 10,
          matrixStatements: [
            { id: 'st-1', statement: lines[1] || 'Pernyataan 1 contoh analisis', correctValue: true },
            { id: 'st-2', statement: lines[2] || 'Pernyataan 2 contoh hipotesis', correctValue: false },
            { id: 'st-3', statement: lines[3] || 'Pernyataan 3 contoh parameter', correctValue: true },
            { id: 'st-4', statement: lines[4] || 'Pernyataan 4 contoh verifikasi data', correctValue: false },
          ],
        });
      } else {
        const options = optionLines.length > 0
          ? optionLines.map((opt) => {
              const label = opt.charAt(0).toUpperCase();
              const text = opt.replace(/^[A-E][\.\)]\s*/i, '').trim();
              return { id: label, label, text };
            })
          : [
              { id: 'A', label: 'A', text: 'Pilihan Jawaban A' },
              { id: 'B', label: 'B', text: 'Pilihan Jawaban B' },
              { id: 'C', label: 'C', text: 'Pilihan Jawaban C' },
              { id: 'D', label: 'D', text: 'Pilihan Jawaban D' },
            ];

        questions.push({
          id: `imp-docx-${Date.now()}-${idx}`,
          type: type === 'mcma' ? 'mcma' : 'pg',
          text: questionText,
          score: 10,
          options,
          correctOptions: correctOptions.length > 0 ? correctOptions : ['A'],
        });
      }
    } catch (err: any) {
      errors.push(`Gagal memproses butir ke-${idx + 1}: ${err.message}`);
    }
  });

  return {
    questions,
    successCount: questions.length,
    errors,
  };
}

export function parseXlsxCsvText(csvText: string): ParseResult {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return {
      questions: [],
      successCount: 0,
      errors: ['File CSV/Excel kosong atau tidak memiliki baris data setelah header.'],
    };
  }

  const questions: Question[] = [];
  const errors: string[] = [];

  // Skip header if first line contains header keywords
  const startIndex = /nomor|tipe|pertanyaan|soal/i.test(lines[0]) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    try {
      // Split by semicolon or comma (support Indonesian Excel export which uses ;)
      const delimiter = lines[i].includes(';') ? ';' : ',';
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length < 3) continue;

      const qType = (cols[1] || 'PG').toUpperCase();
      const qText = cols[2] || `Pertanyaan Soal #${i}`;
      const rawScore = Number(cols[cols.length - 1]);
      const score = !isNaN(rawScore) && rawScore > 0 ? (rawScore > 10 ? Math.min(10, Math.max(1, Math.round(rawScore / 10))) : rawScore) : 10;

      if (qType === 'TABEL' || qType === 'MATRIX') {
        questions.push({
          id: `imp-csv-${Date.now()}-${i}`,
          type: 'true_false_matrix',
          text: qText,
          score,
          matrixStatements: [
            { id: 's1', statement: cols[3] || 'Pernyataan 1', correctValue: cols[4]?.toLowerCase() === 'b' || cols[4]?.toLowerCase() === 'true' },
            { id: 's2', statement: cols[5] || 'Pernyataan 2', correctValue: cols[6]?.toLowerCase() === 'b' || cols[6]?.toLowerCase() === 'true' },
            { id: 's3', statement: cols[7] || 'Pernyataan 3', correctValue: cols[8]?.toLowerCase() === 'b' || cols[8]?.toLowerCase() === 'true' },
            { id: 's4', statement: cols[9] || 'Pernyataan 4', correctValue: cols[10]?.toLowerCase() === 'b' || cols[10]?.toLowerCase() === 'true' },
          ],
        });
      } else {
        const optA = cols[3] || 'Opsi A';
        const optB = cols[4] || 'Opsi B';
        const optC = cols[5] || 'Opsi C';
        const optD = cols[6] || 'Opsi D';
        const optE = cols[7] || '';
        const key = (cols[8] || 'A').toUpperCase().split(/[\s,]+/);

        const options = [
          { id: 'A', label: 'A', text: optA },
          { id: 'B', label: 'B', text: optB },
          { id: 'C', label: 'C', text: optC },
          { id: 'D', label: 'D', text: optD },
        ];
        if (optE) {
          options.push({ id: 'E', label: 'E', text: optE });
        }

        questions.push({
          id: `imp-csv-${Date.now()}-${i}`,
          type: qType === 'MCMA' ? 'mcma' : 'pg',
          text: qText,
          score,
          options,
          correctOptions: key,
        });
      }
    } catch (err: any) {
      errors.push(`Baris ${i + 1} tidak valid: ${err.message}`);
    }
  }

  return {
    questions,
    successCount: questions.length,
    errors,
  };
}

export function parseGoogleFormContent(input: string): ParseResult {
  // If JSON structure or raw question block from Google Form
  try {
    if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
      const parsed = JSON.parse(input);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.questions || []);
      const questions: Question[] = items.map((item: any, idx: number) => {
        const isMultiple = item.type === 'CHECKBOX' || item.type === 'MCMA';
        const isMatrix = item.type === 'GRID' || item.type === 'MATRIX';

        if (isMatrix && item.statements) {
          return {
            id: `gform-${Date.now()}-${idx}`,
            type: 'true_false_matrix' as QuestionType,
            text: item.title || item.question || `Soal Analisis Tabel #${idx+1}`,
            score: 10,
            matrixStatements: item.statements.map((st: any, sIdx: number) => ({
              id: `g-st-${sIdx}`,
              statement: typeof st === 'string' ? st : st.text,
              correctValue: Boolean(st.isCorrect ?? true),
            })),
          };
        }

        const options = (item.options || ['Opsi 1', 'Opsi 2', 'Opsi 3', 'Opsi 4']).map((opt: any, oIdx: number) => {
          const label = String.fromCharCode(65 + oIdx);
          const text = typeof opt === 'string' ? opt : opt.text;
          return { id: label, label, text };
        });

        return {
          id: `gform-${Date.now()}-${idx}`,
          type: (isMultiple ? 'mcma' : 'pg') as QuestionType,
          text: item.title || item.question || `Pertanyaan Google Form #${idx+1}`,
          score: 10,
          options,
          correctOptions: item.correctOptions || ['A'],
        };
      });

      return {
        questions,
        successCount: questions.length,
        errors: [],
      };
    }
  } catch {}

  // Fallback to text parser
  return parseDocxText(input);
}

export function downloadSampleExcel() {
  const csvContent = 
`No;Tipe;Pertanyaan;Opsi A;Opsi B;Opsi C;Opsi D;Opsi E;Kunci;Skor
1;PG;Organel sel yang berfungsi sebagai pusat respirasi dan energi adalah?;Ribosom;Mitokondria;Lisosom;Nukleolus;Badan Golgi;B;10
2;MCMA;Pilihlah karakteristik utama dari sistem operasi Linux (jawaban lebih dari satu):;Open Source;Hanya berjalan di prosesor Intel;Multi-user dan Multi-tasking;Kode program bersifat tertutup rahasia;Mendukung antarmuka CLI dan GUI;A,C,E;10
3;TABEL;Tentukan kebenaran 4 pernyataan berikut mengenai teknologi web modern:;HTML5 mendukung elemen video dan audio secara native;B;JavaScript hanya dapat dijalankan di sisi browser klien;S;Protokol HTTPS menggunakan enkripsi TLS untuk mengamankan transmisi;B;CSS Grid tidak dapat digabungkan dengan Flexbox;S;-;10
`;

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Template_Bank_Soal_SmanGt_EduSecure_CBT.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ========================
// OPERATOR ACCOUNT IMPORTERS (XLSX / CSV)
// ========================

export interface ParsedStudentItem {
  nisn: string;
  name: string;
  className: string;
  school: string;
  room?: string;
  token?: string;
}

export function generateUniqueStudentToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SISWA-${rand}`;
}

export interface StudentParseResult {
  students: ParsedStudentItem[];
  successCount: number;
  errors: string[];
}

export function parseStudentsFromXlsx(csvText: string): StudentParseResult {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return {
      students: [],
      successCount: 0,
      errors: ['File CSV/Excel kosong atau tidak memiliki baris data siswa setelah header.'],
    };
  }

  const students: ParsedStudentItem[] = [];
  const errors: string[] = [];
  const startIndex = /no|nisn|nama|kelas/i.test(lines[0]) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    try {
      const delimiter = lines[i].includes(';') ? ';' : lines[i].includes('\t') ? '\t' : ',';
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length < 3) continue;

      // Format: No; NISN; Nama; Kelas; Ruang (Opsional); Sekolah; Token Siswa (Opsional)
      let nisn = cols[1] || '';
      let name = cols[2] || '';
      let className = cols[3] || 'Kelas XII';
      let school = cols[4] || 'SMA Negeri Unggulan 1';
      let token = cols[5] ? cols[5].trim().toUpperCase() : generateUniqueStudentToken();

      // Check if any column contains 'Ruang'
      let room = 'Ruang 1';
      const detectedRoom = cols.find(c => /ruang\s*\d+/i.test(c));
      if (detectedRoom) {
        room = detectedRoom.replace(/^ruang\s*/i, 'Ruang ');
      }

      // Fallback if no "No" column
      if (nisn.length < 5 && cols[0].length >= 5) {
        nisn = cols[0];
        name = cols[1];
        className = cols[2] || 'Kelas XII';
        school = cols[3] || 'SMA Negeri Unggulan 1';
        token = cols[4] ? cols[4].trim().toUpperCase() : generateUniqueStudentToken();
      }

      if (!nisn || !name) {
        errors.push(`Baris ${i + 1}: NISN atau Nama Siswa kosong.`);
        continue;
      }

      students.push({
        nisn: nisn.replace(/\D/g, '').padStart(10, '0') || nisn,
        name,
        className,
        school,
        room,
        token: token.startsWith('SISWA-') ? token : `SISWA-${token}`,
      });
    } catch (err: any) {
      errors.push(`Baris ${i + 1} tidak valid: ${err.message}`);
    }
  }

  return {
    students,
    successCount: students.length,
    errors,
  };
}

export interface ParsedTeacherItem {
  nip: string;
  name: string;
  subject: string;
  email: string;
  token?: string;
}

export function generateUniqueTeacherToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GURU-${rand}`;
}

export interface TeacherParseResult {
  teachers: ParsedTeacherItem[];
  successCount: number;
  errors: string[];
}

export function parseTeachersFromXlsx(csvText: string): TeacherParseResult {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return {
      teachers: [],
      successCount: 0,
      errors: ['File CSV/Excel kosong atau tidak memiliki baris data guru setelah header.'],
    };
  }

  const teachers: ParsedTeacherItem[] = [];
  const errors: string[] = [];
  const startIndex = /no|nip|nama|mata pelajaran|email/i.test(lines[0]) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    try {
      const delimiter = lines[i].includes(';') ? ';' : lines[i].includes('\t') ? '\t' : ',';
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length < 3) continue;

      // Format: No; NIP; Nama Guru; Mata Pelajaran; Email; Token (Opsional)
      let nip = cols[1] || '';
      let name = cols[2] || '';
      let subject = cols[3] || 'Umum';
      let email = cols[4] || `${name.toLowerCase().replace(/\s+/g, '')}@sekolah.sch.id`;
      let token = cols[5] || '';

      if (nip.length < 5 && cols[0].length >= 5) {
        nip = cols[0];
        name = cols[1];
        subject = cols[2] || 'Umum';
        email = cols[3] || `${name.toLowerCase().replace(/\s+/g, '')}@sekolah.sch.id`;
        token = cols[4] || '';
      }

      if (!nip || !name) {
        errors.push(`Baris ${i + 1}: NIP atau Nama Guru kosong.`);
        continue;
      }

      if (!token || token.trim().length === 0) {
        token = generateUniqueTeacherToken();
      }

      teachers.push({
        nip,
        name,
        subject,
        email,
        token: token.trim().toUpperCase(),
      });
    } catch (err: any) {
      errors.push(`Baris ${i + 1} tidak valid: ${err.message}`);
    }
  }

  return {
    teachers,
    successCount: teachers.length,
    errors,
  };
}

export function downloadStudentTemplateExcel() {
  const sampleData = [
    { 'No': 1, 'NISN': '0078912340', 'Nama Siswa': 'Fajar Hidayatullah', 'Kelas': 'XII MIPA 3', 'Ruang Ujian': 'Ruang 1', 'Sekolah': 'SMA Negeri Unggulan 1', 'Token Siswa (Opsional)': 'SISWA-7821' },
    { 'No': 2, 'NISN': '0084567891', 'Nama Siswa': 'Zahra Amalia', 'Kelas': 'XII MIPA 3', 'Ruang Ujian': 'Ruang 1', 'Sekolah': 'SMA Negeri Unggulan 1', 'Token Siswa (Opsional)': 'SISWA-4419' },
    { 'No': 3, 'NISN': '0073216549', 'Nama Siswa': 'Bagas Wicaksono', 'Kelas': 'XI RPL 1', 'Ruang Ujian': 'Ruang 2', 'Sekolah': 'SMK Teknologi Informatika', 'Token Siswa (Opsional)': 'SISWA-6023' },
    { 'No': 4, 'NISN': '0069874512', 'Nama Siswa': 'Tiara Maharani', 'Kelas': 'XII IPS 2', 'Ruang Ujian': 'Ruang 2', 'Sekolah': 'SMA Negeri Unggulan 1', 'Token Siswa (Opsional)': 'SISWA-9150' },
    { 'No': 5, 'NISN': '0056123478', 'Nama Siswa': 'Dimas Aditya', 'Kelas': 'XI TKJ 2', 'Ruang Ujian': 'Ruang 3', 'Sekolah': 'SMK Teknologi Informatika', 'Token Siswa (Opsional)': 'SISWA-3382' },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 24 },
  ];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const c = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (ws[c]) ws[c].t = 's';
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'Template_Import_Akun_Siswa.xlsx');
}

export function downloadTeacherTemplateExcel() {
  const sampleData = [
    { 'No': 1, 'NIP': '19870312 201101 1 003', 'Nama Guru': 'Drs. Bambang Hidayat, M.Si', 'Mata Pelajaran': 'Fisika Terapan', 'Email': 'bambang.hidayat@sekolah.sch.id', 'Token Akses (Opsional)': 'GURU-7712' },
    { 'No': 2, 'NIP': '19920824 201802 2 006', 'Nama Guru': 'Anisa Wulandari, S.Pd', 'Mata Pelajaran': 'Bahasa Inggris', 'Email': 'anisa.wulandari@sekolah.sch.id', 'Token Akses (Opsional)': 'GURU-9421' },
    { 'No': 3, 'NIP': '19851110 200903 1 005', 'Nama Guru': 'Eko Prasetyo, M.Kom', 'Mata Pelajaran': 'Kecerdasan Buatan & Web', 'Email': 'eko.prasetyo@sekolah.sch.id', 'Token Akses (Opsional)': 'GURU-3180' },
    { 'No': 4, 'NIP': '19900415 201502 2 011', 'Nama Guru': 'Nurul Fatimah, S.Pd', 'Mata Pelajaran': 'Kimia Organik', 'Email': 'nurul.fatimah@sekolah.sch.id', 'Token Akses (Opsional)': 'GURU-5524' },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 30 },
    { wch: 28 },
    { wch: 34 },
    { wch: 24 },
  ];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const c = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (ws[c]) ws[c].t = 's';
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
  XLSX.writeFile(wb, 'Template_Import_Akun_Guru.xlsx');
}

