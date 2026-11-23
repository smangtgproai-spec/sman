/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'pg' | 'mcma' | 'true_false_matrix';

export interface MatrixStatement {
  id: string;
  statement: string;
  correctValue: boolean; // true = Benar, false = Salah
}

export interface QuestionOption {
  id: string;
  label: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  imageCaption?: string;
  score: number;
  // For PG & MCMA:
  options?: QuestionOption[];
  correctOptions?: string[]; // PG has 1 item, MCMA has 1+ items
  showOptionLabels?: boolean; // true = tampilkan label ABCDE, false = sembunyikan label ABCDE
  // For True/False Matrix with 4 statements:
  matrixStatements?: MatrixStatement[];
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  durationMinutes: number;
  token: string;
  status: 'draft' | 'published' | 'closed';
  questions: Question[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  randomizeOptionsPG?: boolean; // Acak butir pilihan jawaban untuk soal pilihan ganda (PG)
  randomizeOptionsMCMA?: boolean; // Acak butir pilihan jawaban untuk soal MCMA (pilihan ganda kompleks)
  randomizeStatementsMatrix?: boolean; // Acak pernyataan pada soal tabel benar/salah
  showResultsImmediately: boolean;
  createdAt: string;
  academicYear: string;
  // Pengaturan Jadwal Tanggal dan Jam Ujian
  enableSchedule?: boolean; // True jika asesmen dibatasi tanggal & jam tertentu
  startDate?: string; // Tanggal & Jam Mulai Ujian (format input datetime-local: YYYY-MM-DDTHH:mm)
  endDate?: string; // Tanggal & Jam Berakhir Ujian (format input datetime-local: YYYY-MM-DDTHH:mm)
}

export const AVAILABLE_EXAM_ROOMS: string[] = Array.from({ length: 30 }, (_, i) => `Ruang ${i + 1}`);

export interface Student {
  id: string;
  nisn: string;
  name: string;
  className: string;
  school: string;
  room?: string; // Penempatan ruang ujian: 'Ruang 1' s.d 'Ruang 30'
  token: string; // Token unik login siswa, contoh: SISWA-7821
  avatarUrl?: string;
  status: 'ready' | 'working' | 'finished' | 'blocked';
  isLockedOut?: boolean; // True jika akun terkunci karena melebihi batasan pelanggaran
  lockoutReason?: string; // Alasan penguncian
  isAccountDisabled?: boolean; // True jika akun dinonaktifkan oleh Operator pada ruangan tertentu
  accountDisabledReason?: string; // Catatan alasan penonaktifan akun
  completedExamIds?: string[]; // ID ujian yang sudah pernah dikumpulkan (1x kesempatan pengerjaan)
  activeExamId?: string;
  lastLogin?: string;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  subject: string;
  email: string;
  token: string;
  avatarUrl?: string;
}

export interface Operator {
  id: string;
  username: string;
  name: string;
  role: 'master_operator' | 'proctor';
  email: string;
}

export type ViolationType = 
  | 'tab_switch' 
  | 'split_screen' 
  | 'fullscreen_exit' 
  | 'copy_attempt' 
  | 'floating_window_blur' 
  | 'screenshot_attempt';

export interface ViolationRecord {
  id: string;
  timestamp: string;
  type: ViolationType;
  title: string;
  details: string;
}

export interface StudentAnswerPayload {
  // For PG: option id 'A' | 'B' ...
  // For MCMA: array of option ids ['A', 'C']
  // For true_false_matrix: Record<statementId, boolean> e.g. { 's1': true, 's2': false }
  value: any;
  isDoubtful: boolean;
  answeredAt: string;
}

export interface ExamSession {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  className: string;
  examId: string;
  examTitle: string;
  subject: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
  remainingSeconds: number;
  answers: Record<string, StudentAnswerPayload>;
  status: 'working' | 'submitted' | 'force_submitted' | 'blocked';
  violations: ViolationRecord[];
  currentQuestionIndex: number;
  score?: number;
  maxScore?: number;
  totalAnswered: number;
  deviceInfo?: string;
}

export interface ExamResultSummary {
  sessionId: string;
  studentName: string;
  nisn: string;
  className: string;
  examTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  violationsCount: number;
  status: 'passed' | 'remedial' | 'evaluated';
}
