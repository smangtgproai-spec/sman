/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExamSession, ExamResultSummary, Exam, Student, Teacher } from '../types/exam';
import * as XLSX from 'xlsx';

export function exportStudentsToXlsx(students: Student[], filterTitle?: string) {
  const data = students.map((s, index) => ({
    'No': index + 1,
    'NISN': String(s.nisn || ''),
    'Nama Siswa': s.name || '',
    'Kelas': s.className || '',
    'Ruang Ujian': s.room || 'Ruang 1',
    'Sekolah': s.school || '',
    'Token Siswa': s.token || '',
    'Status Pengerjaan': s.status === 'working' ? 'Sedang Ujian' : s.status === 'finished' ? 'Selesai' : s.status === 'blocked' ? 'Terkunci' : 'Siap Ujian',
    'Status Kunci': s.isLockedOut ? 'Terkunci Pelanggaran' : 'Normal',
    'Terakhir Login': s.lastLogin || 'Belum Login',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set explicit column widths for readability in Excel
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // NISN
    { wch: 28 }, // Nama Siswa
    { wch: 16 }, // Kelas
    { wch: 16 }, // Ruang Ujian
    { wch: 28 }, // Sekolah
    { wch: 18 }, // Token Siswa
    { wch: 18 }, // Status Pengerjaan
    { wch: 22 }, // Status Kunci
    { wch: 22 }, // Terakhir Login
  ];

  // Ensure NISN and Token cells are string type to prevent leading zero truncation in Excel
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const nisnCell = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (worksheet[nisnCell]) {
      worksheet[nisnCell].t = 's';
    }
    const tokenCell = XLSX.utils.encode_cell({ r: R, c: 6 });
    if (worksheet[tokenCell]) {
      worksheet[tokenCell].t = 's';
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Akun Siswa');

  const safeFilter = filterTitle ? filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Semua';
  const fileName = `Data_Akun_Siswa_${safeFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportTeachersToXlsx(teachers: Teacher[]) {
  const data = teachers.map((t, index) => ({
    'No': index + 1,
    'NIP': String(t.nip || ''),
    'Nama Guru': t.name || '',
    'Mata Pelajaran': t.subject || '',
    'Email': t.email || '',
    'Token Akses': t.token || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 26 }, // NIP
    { wch: 30 }, // Nama Guru
    { wch: 28 }, // Mata Pelajaran
    { wch: 32 }, // Email
    { wch: 18 }, // Token Akses
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const nipCell = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (worksheet[nipCell]) {
      worksheet[nipCell].t = 's';
    }
    const tokenCell = XLSX.utils.encode_cell({ r: R, c: 5 });
    if (worksheet[tokenCell]) {
      worksheet[tokenCell].t = 's';
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Akun Guru');

  const fileName = `Data_Akun_Guru_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportResultsToXlsx(
  examTitle: string,
  subject: string,
  results: {
    no: number;
    studentName: string;
    nisn: string;
    className: string;
    score: number;
    maxScore: number;
    percentage: number;
    violationsCount: number;
    status: string;
    submittedAt: string;
  }[]
) {
  const data = results.map(r => ({
    'No': r.no,
    'NISN': String(r.nisn || ''),
    'Nama Siswa': r.studentName,
    'Kelas': r.className,
    'Mata Pelajaran': subject,
    'Skor Diperoleh': r.score,
    'Skor Maksimal': r.maxScore,
    'Nilai Akhir (100)': Number(r.percentage.toFixed(1)),
    'Jumlah Pelanggaran': r.violationsCount,
    'Status Pengerjaan': r.status,
    'Waktu Selesai': r.submittedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const nisnCell = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (worksheet[nisnCell]) {
      worksheet[nisnCell].t = 's';
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Hasil Ujian');

  const safeName = examTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Rekap_Nilai_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportResultsToCsv(
  examTitle: string,
  subject: string,
  results: {
    no: number;
    studentName: string;
    nisn: string;
    className: string;
    score: number;
    maxScore: number;
    percentage: number;
    violationsCount: number;
    status: string;
    submittedAt: string;
  }[]
) {
  const headers = [
    'No',
    'NISN',
    'Nama Siswa',
    'Kelas',
    'Mata Pelajaran',
    'Skor Diperoleh',
    'Skor Maksimal',
    'Nilai Akhir (100)',
    'Jumlah Pelanggaran Keamanan',
    'Status Pengerjaan',
    'Waktu Selesai'
  ];

  const rows = results.map(r => [
    r.no,
    `"${r.nisn}"`,
    `"${r.studentName}"`,
    `"${r.className}"`,
    `"${subject}"`,
    r.score,
    r.maxScore,
    r.percentage.toFixed(1),
    r.violationsCount,
    `"${r.status}"`,
    `"${r.submittedAt}"`,
  ]);

  const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const safeName = examTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.download = `Rekap_Nilai_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printBeritaAcara(
  exam: Exam,
  operatorName: string,
  totalParticipants: number,
  completedCount: number,
  violationsList: { studentName: string; reason: string; time: string }[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Berita Acara Pelaksanaan Ujian - ${exam.title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.5; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 24px; }
        .header h2 { margin: 0; font-size: 18pt; text-transform: uppercase; }
        .header h3 { margin: 4px 0; font-size: 14pt; }
        .header p { margin: 0; font-size: 11pt; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12pt; }
        .meta-table td { padding: 4px 8px; vertical-align: top; }
        .log-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11pt; }
        .log-table th, .log-table td { border: 1px solid #000; padding: 6px 10px; text-align: left; }
        .log-table th { background-color: #f3f4f6; }
        .signatures { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12pt; }
        .sign-box { text-align: center; width: 45%; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>BERITA ACARA PELAKSANAAN ASESMEN / UJIAN BERBASIS CBT</h2>
        <h3>SISTEM KEAMANAN TERPROTEKSI SMANGT EDUSECURE CBT</h3>
        <p>Tahun Ajaran: ${exam.academicYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <p>Pada hari ini, telah dilaksanakan asesmen berbasis komputer secara online dengan rincian kegiatan sebagai berikut:</p>

      <table class="meta-table">
        <tr>
          <td width="28%"><strong>Judul Ujian</strong></td>
          <td width="2%">:</td>
          <td>${exam.title}</td>
        </tr>
        <tr>
          <td><strong>Mata Pelajaran</strong></td>
          <td>:</td>
          <td>${exam.subject} (${exam.grade})</td>
        </tr>
        <tr>
          <td><strong>Guru Penyusun</strong></td>
          <td>:</td>
          <td>${exam.teacherName}</td>
        </tr>
        <tr>
          <td><strong>Durasi Ujian</strong></td>
          <td>:</td>
          <td>${exam.durationMinutes} Menit (Token: ${exam.token})</td>
        </tr>
        <tr>
          <td><strong>Jumlah Peserta Terdaftar</strong></td>
          <td>:</td>
          <td>${totalParticipants} Siswa</td>
        </tr>
        <tr>
          <td><strong>Peserta Telah Selesai</strong></td>
          <td>:</td>
          <td>${completedCount} Siswa</td>
        </tr>
      </table>

      <h4>CATATAN INSIDEN & INTEGRITAS KEAMANAN UJIAN:</h4>
      ${
        violationsList.length === 0
          ? '<p style="font-style: italic;">Tidak ada catatan pelanggaran keamanan terdeteksi. Seluruh siswa mengerjakan dalam mode aman terproteksi.</p>'
          : `
        <table class="log-table">
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="30%">Nama Siswa</th>
              <th width="45%">Jenis Pelanggaran</th>
              <th width="20%">Waktu Deteksi</th>
            </tr>
          </thead>
          <tbody>
            ${violationsList.map((v, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${v.studentName}</td>
                <td>${v.reason}</td>
                <td>${v.time}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      }

      <div class="signatures">
        <div class="sign-box">
          <p>Guru Pengampu Mata Pelajaran,</p>
          <br><br><br>
          <p><strong>( ${exam.teacherName} )</strong></p>
        </div>
        <div class="sign-box">
          <p>Master Operator CBT,</p>
          <br><br><br>
          <p><strong>( ${operatorName} )</strong></p>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
