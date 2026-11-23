/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exam, Student, Teacher, Operator, Question } from '../types/exam';
import { toDateTimeLocalString } from '../utils/examSchedule';

// High quality embedded SVG diagrams for science & computer exams
export const CELL_DIAGRAM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%23f8fafc" rx="8"/><rect x="40" y="30" width="520" height="280" rx="140" fill="%23e0f2fe" stroke="%230284c7" stroke-width="4"/><circle cx="300" cy="170" r="60" fill="%23fef08a" stroke="%23ca8a04" stroke-width="3"/><circle cx="300" cy="170" r="25" fill="%23fde047" stroke="%23a16207" stroke-width="2"/><text x="300" y="176" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23854d0e">Nukleus</text><ellipse cx="180" cy="120" rx="35" ry="18" fill="%23fecdd3" stroke="%23e11d48" stroke-width="2" transform="rotate(-20 180 120)"/><text x="180" y="125" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="%239f1239">Mitokondria [X]</text><ellipse cx="420" cy="210" rx="40" ry="18" fill="%23fecdd3" stroke="%23e11d48" stroke-width="2" transform="rotate(30 420 210)"/><path d="M 230,220 Q 260,250 300,235 T 370,240" fill="none" stroke="%2310b981" stroke-width="4"/><text x="300" y="270" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23047857">Aparatus Golgi</text><text x="300" y="25" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="%230f172a">STRUKTUR SEL EUKARIOTIK DAN ORGANEL PENGHASIL ENERGI (ATP)</text></svg>`;

export const NETWORK_DIAGRAM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230f172a" rx="8"/><rect x="50" y="120" width="120" height="80" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="110" y="155" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">Client PC (A)</text><text x="110" y="175" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%2394a3b8">192.168.1.10</text><rect x="250" y="110" width="100" height="100" rx="8" fill="%23dc2626" stroke="%23f87171" stroke-width="3"/><text x="300" y="155" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23ffffff">FIREWALL</text><text x="300" y="175" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23fee2e2">Port Filter & WAF</text><rect x="430" y="120" width="120" height="80" rx="8" fill="%231e293b" stroke="%234ade80" stroke-width="2"/><text x="490" y="155" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">Web Server</text><text x="490" y="175" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%2386efac">Port 443 (HTTPS)</text><line x1="170" y1="160" x2="250" y2="160" stroke="%2338bdf8" stroke-width="3" stroke-dasharray="6,4"/><line x1="350" y1="160" x2="430" y2="160" stroke="%234ade80" stroke-width="3"/><text x="300" y="60" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="%23e2e8f0">SKEMA FILTERING PAKET DATA DENGAN PROTOKOL ENKRIPSI TLS/SSL</text></svg>`;

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-1',
    nip: '19870312 201101 1 003',
    name: 'Ibu Ratna Dewi, M.Pd',
    subject: 'Biologi & Ilmu Hayati',
    email: 'ratna.dewi@sekolah.sch.id',
    token: 'GURU-7712',
  },
  {
    id: 't-2',
    nip: '19920824 201802 2 006',
    name: 'Budi Santoso, S.Kom, M.T',
    subject: 'Informatika & Cyber Security',
    email: 'budi.santoso@sekolah.sch.id',
    token: 'GURU-9421',
  },
];

export const INITIAL_OPERATOR: Operator = {
  id: 'op-1',
  username: 'admin.cbt',
  name: 'Hendra Kusuma, S.ST (Master Operator)',
  role: 'master_operator',
  email: 'operator.pusat@cbt-secure.sch.id',
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    nisn: '0078912340',
    name: 'Fajar Hidayatullah',
    className: 'XII-MIPA-1',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 1',
    token: 'SISWA-7821',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-2',
    nisn: '0084567891',
    name: 'Zahra Amalia',
    className: 'XII-MIPA-1',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 1',
    token: 'SISWA-4419',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-3',
    nisn: '0073216549',
    name: 'Bagas Wicaksono',
    className: 'XII-MIPA-2',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 2',
    token: 'SISWA-6023',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-4',
    nisn: '0069874512',
    name: 'Tiara Maharani',
    className: 'XII-IPS-1',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 3',
    token: 'SISWA-9150',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-5',
    nisn: '0075512399',
    name: 'Rizky Ramadhan',
    className: 'XII-MIPA-1',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 1',
    token: 'SISWA-3382',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-6',
    nisn: '0081234567',
    name: 'Siti Nurhaliza',
    className: 'XII-MIPA-2',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 2',
    token: 'SISWA-5541',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-7',
    nisn: '0079988776',
    name: 'Dimas Prasetyo',
    className: 'XII-MIPA-2',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 2',
    token: 'SISWA-1129',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
  {
    id: 's-8',
    nisn: '0087766554',
    name: 'Amanda Putri',
    className: 'XII-IPS-1',
    school: 'SMA Negeri Unggulan 1',
    room: 'Ruang 3',
    token: 'SISWA-8873',
    status: 'ready',
    lastLogin: 'Belum Pernah Login',
  },
];

export const SAMPLE_QUESTIONS_BIO: Question[] = [
  {
    id: 'q-bio-1',
    type: 'pg',
    text: 'Perhatikan diagram struktur sel berikut. Organel yang ditandai dengan huruf [X] memiliki lipatan membran dalam (krista) dan bertanggung jawab dalam proses respirasi selular untuk menghasilkan Adenosin Trifosfat (ATP). Apakah nama dan fungsi utama organel tersebut?',
    imageUrl: CELL_DIAGRAM_SVG,
    imageCaption: 'Gambar 1.1: Diagram Organel Sel Eukariotik',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Ribosom - Tempat translasi dan sintesis polipeptida' },
      { id: 'B', label: 'B', text: 'Mitokondria - Siklus Krebs dan fosforilasi oksidatif penghasil energi ATP' },
      { id: 'C', label: 'C', text: 'Retikulum Endoplasma Kasar - Transpor protein intrasel' },
      { id: 'D', label: 'D', text: 'Lisosom - Autofagi dan pencernaan makromolekul intrasel' },
      { id: 'E', label: 'E', text: 'Badan Golgi - Modifikasi glikoprotein dan pembentukan vesikel' },
    ],
    correctOptions: ['B'],
    explanation: 'Organel X adalah Mitokondria yang memiliki matriks dan krista untuk respirasi aerob.',
  },
  {
    id: 'q-bio-2',
    type: 'mcma',
    text: 'Dalam suatu praktikum uji enzim katalase pada ekstrak hati ayam yang ditetesi larutan H2O2 (hidrogen peroksida), manakah dari pernyataan-pernyataan berikut yang BENAR mengenai karakteristik dan faktor yang mempengaruhi kerja enzim tersebut? (Pilih LEBIH DARI SATU jawaban)',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Enzim katalase menguraikan H2O2 menjadi molekul air (H2O) dan gas oksigen (O2) yang aman bagi tubuh.' },
      { id: 'B', label: 'B', text: 'Aktivitas enzim mencapai titik optimum pada pemanasan suhu di atas 90°C karena energi kinetik maksimum.' },
      { id: 'C', label: 'C', text: 'Pada suasana pH yang sangat asam (pH 2) atau sangat basa (pH 12), enzim mengalami denaturasi struktural sehingga kehilangan fungsi katalitiknya.' },
      { id: 'D', label: 'D', text: 'Penambahan substrat secara terus-menerus akan selalu meningkatkan kecepatan reaksi tanpa batas jenuh.' },
      { id: 'E', label: 'E', text: 'Enzim bersifat biokatalisator spesifik yang tidak ikut habis bereaksi dalam mekanisme katalisis.' },
    ],
    correctOptions: ['A', 'C', 'E'],
    explanation: 'Enzim terdenaturasi pada suhu/pH ekstrem dan memiliki titik jenuh substrat (Vmax). Opsi A, C, dan E benar.',
  },
  {
    id: 'q-bio-3',
    type: 'true_false_matrix',
    text: 'Berikut disajikan 4 (empat) pernyataan mengenai Dogma Sentral Biologi Molekuler dan Sintesis Protein dalam sel. Analisis setiap pernyataan dengan teliti dan tentukan apakah pernyataan tersebut BENAR atau SALAH pada tabel:',
    score: 10,
    matrixStatements: [
      {
        id: 'stmt-1',
        statement: '1. Proses transkripsi pada sel eukariotik berlangsung di dalam nukleus dan menghasilkan molekul pre-mRNA.',
        correctValue: true,
      },
      {
        id: 'stmt-2',
        statement: '2. Molekul tRNA bertugas membawa kodon dari DNA untuk dicocokkan dengan antikodon pada ribosom.',
        correctValue: false, // tRNA membawa antikodon dan asam amino spesifik, bukan kodon
      },
      {
        id: 'stmt-3',
        statement: '3. Kodon start universal pada mRNA yang menginisiasi proses translasi adalah AUG yang mengode asam amino metionin.',
        correctValue: true,
      },
      {
        id: 'stmt-4',
        statement: '4. Satu jenis asam amino hanya dapat dikodekan oleh tepat satu jenis kodon triplet (tidak memiliki sifat degenerasi).',
        correctValue: false, // Kode genetik bersifat degeneratif/redundant
      },
    ],
    explanation: 'Pernyataan 1: Benar. Pernyataan 2: Salah (tRNA membawa antikodon). Pernyataan 3: Benar (AUG = start). Pernyataan 4: Salah (kode genetik bersifat degenerate/redundant).',
  },
  {
    id: 'q-bio-4',
    type: 'pg',
    text: 'Pada persilangan tanaman ercis berbiji bulat kuning (BbKk) dengan sesamanya, jika alel bulat (B) dominan terhadap keriput (b) dan kuning (K) dominan terhadap hijau (k), berapakah rasio fenotipe keturunan yang memiliki biji keriput hijau pada generasi F2?',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: '9 / 16' },
      { id: 'B', label: 'B', text: '3 / 16' },
      { id: 'C', label: 'C', text: '1 / 16' },
      { id: 'D', label: 'D', text: '4 / 16' },
      { id: 'E', label: 'E', text: '16 / 16' },
    ],
    correctOptions: ['C'],
    explanation: 'Rasio dihibrid F2 adalah 9 Bulat Kuning : 3 Bulat Hijau : 3 Keriput Kuning : 1 Keriput Hijau. Peluang keriput hijau (bbkk) adalah 1/16.',
  },
];

export const SAMPLE_QUESTIONS_IT: Question[] = [
  {
    id: 'q-it-1',
    type: 'pg',
    text: 'Perhatikan bagan arsitektur pengamanan jaringan berikut. Ketika sebuah paket data dari klien luar menuju ke server internal melewati Firewall dengan port 443 yang terenkripsi SSL/TLS, mekanisme keamanan apa yang paling efektif untuk memvalidasi identitas server dan mencegah serangan Man-In-The-Middle (MITM)?',
    imageUrl: NETWORK_DIAGRAM_SVG,
    imageCaption: 'Gambar 2.1: Skema Arsitektur Jaringan Terproteksi Firewall & TLS',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Menggunakan alamat IP Private statis pada sisi client' },
      { id: 'B', label: 'B', text: 'Verifikasi Sertifikat Digital X.509 dari Certificate Authority (CA) terpercaya' },
      { id: 'C', label: 'C', text: 'Membuka seluruh range port UDP di firewall' },
      { id: 'D', label: 'D', text: 'Menonaktifkan protokol TCP handshaking' },
      { id: 'E', label: 'E', text: 'Melakukan routing ulang melalui server proxy tanpa enkripsi' },
    ],
    correctOptions: ['B'],
    explanation: 'Sertifikat digital X.509 yang ditandatangani CA terpercaya memverifikasi keaslian kunci publik server.',
  },
  {
    id: 'q-it-2',
    type: 'mcma',
    text: 'Manakah di antara praktik rekayasa perangkat lunak berikut yang merupakan langkah efektif untuk mencegah celah keamanan SQL Injection dan Cross-Site Scripting (XSS)? (Pilih LEBIH DARI SATU jawaban)',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Menggunakan Prepared Statements dan Parameterized Queries pada pemanggilan database' },
      { id: 'B', label: 'B', text: 'Menggabungkan input langsung pengguna ke dalam string query SQL mentah' },
      { id: 'C', label: 'C', text: 'Melakukan sanitasi dan HTML entity encoding terhadap semua output yang dirender ke browser' },
      { id: 'D', label: 'D', text: 'Menerapkan Content Security Policy (CSP) pada response headers' },
      { id: 'E', label: 'E', text: 'Menyimpan password pengguna dalam format teks biasa (plain text)' },
    ],
    correctOptions: ['A', 'C', 'D'],
    explanation: 'Prepared statements mencegah SQLi. HTML sanitization dan CSP mencegah eksekusi skrip jahat XSS.',
  },
  {
    id: 'q-it-3',
    type: 'true_false_matrix',
    text: 'Tentukan kebenaran dari 4 (empat) pernyataan mengenai prinsip integritas data dan protokol jaringan komputer pada tabel berikut:',
    score: 10,
    matrixStatements: [
      {
        id: 'it-s1',
        statement: '1. Fungsi Hash Kriptografi seperti SHA-256 bersifat satu arah (one-way) dan menghasilkan output panjang tetap.',
        correctValue: true,
      },
      {
        id: 'it-s2',
        statement: '2. Protokol HTTP mengirimkan data kredensial dan kata sandi dalam bentuk terenkripsi secara otomatis tanpa konfigurasi SSL.',
        correctValue: false, // HTTP mengirim teks biasa tanpa enkripsi
      },
      {
        id: 'it-s3',
        statement: '3. Two-Factor Authentication (2FA) meningkatkan keamanan dengan mewajibkan verifikasi lebih dari satu faktor autentikasi.',
        correctValue: true,
      },
      {
        id: 'it-s4',
        statement: '4. Phishing adalah teknik serangan siber yang merusak fisik kabel serat optik di bawah laut.',
        correctValue: false, // Phishing adalah social engineering
      },
    ],
    explanation: 'Pernyataan 1: Benar. Pernyataan 2: Salah (HTTP polos). Pernyataan 3: Benar (2FA multi faktor). Pernyataan 4: Salah (Phishing adalah penipuan rekayasa sosial).',
  },
];

export const SAMPLE_QUESTIONS_MATH_SCIENCE: Question[] = [
  {
    id: 'q-mat-1',
    type: 'pg',
    text: 'Diberikan persamaan kuadrat $2x^2 - 4x - 6 = 0$. Dengan menerapkan rumus kuadrat $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, tentukan himpunan akar-akar penyelesaian $(x_1, x_2)$ dari persamaan tersebut:',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: '$x_1 = 3$ dan $x_2 = -1$' },
      { id: 'B', label: 'B', text: '$x_1 = -3$ dan $x_2 = 1$' },
      { id: 'C', label: 'C', text: '$x_1 = 2$ dan $x_2 = -3$' },
      { id: 'D', label: 'D', text: '$x_1 = 6$ dan $x_2 = -2$' },
    ],
    correctOptions: ['A'],
    explanation: 'Nilai a = 2, b = -4, c = -6. D = (-4)^2 - 4(2)(-6) = 16 + 48 = 64. Maka x = (4 ± 8) / 4 -> x1 = 3 dan x2 = -1.',
  },
  {
    id: 'q-fis-2',
    type: 'mcma',
    text: 'Sebuah partikel bermuatan $q = 1.60 \\times 10^{-19} \\text{ C}$ bergerak dengan kecepatan $v = 2.0 \\times 10^6 \\text{ m/s}$ dalam medan magnetik serba sama $B = 0.50 \\text{ T}$. Manakah pernyataan berikut yang BENAR mengenai besaran dan rumus fisika yang berlaku? (Pilih LEBIH DARI SATU jawaban)',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Gaya Lorentz yang dialami muatan dinyatakan oleh rumus $\\vec{F} = q (\\vec{v} \\times \\vec{B})$.' },
      { id: 'B', label: 'B', text: 'Besar gaya magnet maksimum adalah $F = q \\cdot v \\cdot B = 1.60 \\times 10^{-13} \\text{ N}$.' },
      { id: 'C', label: 'C', text: 'Satuan induksi magnetik dalam SI adalah Ohm ($\\Omega$).' },
      { id: 'D', label: 'D', text: 'Energi kinetik partikel massa $m$ dihitung dengan rumus $E_k = \\frac{1}{2} m v^2$.' },
    ],
    correctOptions: ['A', 'B', 'D'],
    explanation: 'Opsi A, B, dan D benar. Opsi C salah karena satuan induksi magnet adalah Tesla (T), sedangkan Ohm adalah satuan hambatan listrik.',
  },
  {
    id: 'q-kim-3',
    type: 'pg',
    text: 'Pada reaksi sintesis amonia Haber-Bosch:\n$$\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g) \\quad (\\Delta H = -92.4 \\text{ kJ/mol})$$\nBerdasarkan Asas Le Chatelier, perlakuan apa yang paling tepat untuk menggeser arah kesetimbangan ke kanan sehingga produksi amonia $(\\text{NH}_3)$ meningkat?',
    score: 10,
    options: [
      { id: 'A', label: 'A', text: 'Menaikkan tekanan sistem dan menurunkan suhu reaksi' },
      { id: 'B', label: 'B', text: 'Menurunkan tekanan sistem dan menaikkan suhu reaksi' },
      { id: 'C', label: 'C', text: 'Mengurangi konsentrasi gas hidrogen $(\\text{H}_2)$' },
      { id: 'D', label: 'D', text: 'Menambahkan gas inert pada volume tetap' },
    ],
    correctOptions: ['A'],
    explanation: 'Reaksi ke kanan bersifat eksoterm (ΔH < 0) dan koefisien gas berkurang (4 mol -> 2 mol). Maka menaikkan tekanan dan menurunkan suhu akan menggeser kesetimbangan ke arah produk NH3.',
  },
  {
    id: 'q-kim-4',
    type: 'true_false_matrix',
    text: 'Analisis kebenaran 4 (empat) pernyataan mengenai rumus fisika, reaksi kimia, dan notasi ilmiah pada tabel berikut:',
    score: 10,
    matrixStatements: [
      {
        id: 'ms-1',
        statement: '1. Tetapan Avogadro adalah $N_A = 6.022 \\times 10^{23} \\text{ partikel/mol}$.',
        correctValue: true,
      },
      {
        id: 'ms-2',
        statement: '2. Reaksi pembakaran metana adalah $\\text{CH}_4(g) + 2\\text{O}_2(g) \\rightarrow \\text{CO}_2(g) + 2\\text{H}_2\\text{O}(g)$.',
        correctValue: true,
      },
      {
        id: 'ms-3',
        statement: '3. Rumus energi potensial gravitasi pada ketinggian $h$ adalah $E_p = m \\cdot g \\cdot h$.',
        correctValue: true,
      },
      {
        id: 'ms-4',
        statement: '4. Peluruhan isotop radioaktif $^{14}_{6}\\text{C}$ menghasilkan partikel alfa $^{4}_{2}\\alpha$ sebagai produk utamanya.',
        correctValue: false, // Peluruhan C-14 memancarkan partikel beta negatif, bukan alfa
      },
    ],
    explanation: 'Pernyataan 1: Benar. Pernyataan 2: Benar. Pernyataan 3: Benar. Pernyataan 4: Salah (C-14 meluruh via emisi beta menjadi N-14).',
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-bio-12',
    title: 'Asesmen Sumatif Akhir Semester: Biologi Terapan',
    subject: 'Biologi & Ilmu Hayati',
    grade: 'Kelas XII MIPA',
    teacherId: 't-1',
    teacherName: 'Ibu Ratna Dewi, M.Pd',
    durationMinutes: 45,
    token: 'BIO-2026',
    status: 'published',
    questions: SAMPLE_QUESTIONS_BIO,
    randomizeQuestions: false,
    randomizeOptions: false,
    randomizeOptionsPG: true,
    randomizeOptionsMCMA: true,
    randomizeStatementsMatrix: true,
    showResultsImmediately: true,
    createdAt: '2026-10-01',
    academicYear: '2025/2026 Semester Ganjil',
    enableSchedule: true,
    startDate: toDateTimeLocalString(new Date(Date.now() - 2 * 3600 * 1000)), // Sedang berlangsung
    endDate: toDateTimeLocalString(new Date(Date.now() + 6 * 3600 * 1000)),
  },
  {
    id: 'exam-mat-12',
    title: 'Penilaian Sumatif: Sains Terpadu (Matematika, Fisika & Kimia)',
    subject: 'Matematika & Ilmu Pengetahuan Alam (MIPA)',
    grade: 'Kelas XII MIPA',
    teacherId: 't-3',
    teacherName: 'Siti Rahma, S.Pd',
    durationMinutes: 60,
    token: 'MIPA-77',
    status: 'published',
    questions: SAMPLE_QUESTIONS_MATH_SCIENCE,
    randomizeQuestions: false,
    randomizeOptions: false,
    randomizeOptionsPG: false,
    randomizeOptionsMCMA: false,
    randomizeStatementsMatrix: false,
    showResultsImmediately: true,
    createdAt: '2026-10-03',
    academicYear: '2025/2026 Semester Ganjil',
    enableSchedule: true,
    startDate: toDateTimeLocalString(new Date(Date.now() + 18 * 3600 * 1000)), // Belum dimulai (besok)
    endDate: toDateTimeLocalString(new Date(Date.now() + 24 * 3600 * 1000)),
  },
  {
    id: 'exam-it-11',
    title: 'Penilaian Tengah Semester: Informatika & Keamanan Siber',
    subject: 'Informatika & Cyber Security',
    grade: 'Kelas XI RPL & TKJ',
    teacherId: 't-2',
    teacherName: 'Budi Santoso, S.Kom, M.T',
    durationMinutes: 30,
    token: 'CYBER-99',
    status: 'published',
    questions: SAMPLE_QUESTIONS_IT,
    randomizeQuestions: false,
    randomizeOptions: false,
    randomizeOptionsPG: false,
    randomizeOptionsMCMA: false,
    randomizeStatementsMatrix: false,
    showResultsImmediately: true,
    createdAt: '2026-10-02',
    academicYear: '2025/2026 Semester Ganjil',
    enableSchedule: false, // Bebas akses / tanpa batas jadwal
  },
];
