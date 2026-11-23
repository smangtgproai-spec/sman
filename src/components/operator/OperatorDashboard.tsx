/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Operator, 
  Student, 
  Teacher, 
  Exam, 
  ExamSession, 
  ViolationRecord,
  AVAILABLE_EXAM_ROOMS
} from '../../types/exam';
import { 
  exportResultsToCsv, 
  exportResultsToXlsx, 
  exportStudentsToXlsx, 
  exportTeachersToXlsx, 
  printBeritaAcara 
} from '../../utils/export';
import { generateUniqueTeacherToken, generateUniqueStudentToken } from '../../utils/importer';
import { ImportAccountsModal } from './ImportAccountsModal';
import { AccountEditorModal } from './AccountEditorModal';
import { ExamReviewModal } from '../teacher/ExamReviewModal';
import { EditOperatorModal } from './EditOperatorModal';
import { ExamCardsModal } from './ExamCardsModal';
import { StudentResultsRecapView } from './StudentResultsRecapView';
import { 
  Settings, 
  ShieldCheck, 
  Users, 
  Clock, 
  Lock, 
  Unlock, 
  RefreshCw, 
  AlertTriangle, 
  Printer, 
  FileSpreadsheet, 
  Activity, 
  Search, 
  Power, 
  Eye, 
  CheckCircle2, 
  XCircle,
  KeyRound,
  Upload,
  UserPlus,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Check,
  LogIn,
  Download,
  DoorOpen,
  Building2,
  PowerOff,
  UserX,
  UserCheck,
  UserMinus,
  ShieldOff,
  Zap,
  CheckSquare,
  Square,
  Calendar,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Award
} from 'lucide-react';
import { 
  toDateTimeLocalString, 
  formatExamDateTime, 
  formatExamDateTimeShort, 
  getExamScheduleStatus, 
  calculateScheduleDuration 
} from '../../utils/examSchedule';

interface OperatorDashboardProps {
  operator: Operator;
  students: Student[];
  teachers: Teacher[];
  exams: Exam[];
  examSessions: ExamSession[];
  disabledRooms?: string[];
  onToggleRoomStatus?: (room: string) => void;
  onUpdateDisabledRooms?: (rooms: string[]) => void;
  disabledStudentIds?: string[];
  onToggleStudentStatus?: (studentId: string) => void;
  onBatchToggleStudents?: (studentIds: string[], shouldDisable: boolean) => void;
  onEnableAllStudents?: () => void;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateExams: (exams: Exam[]) => void;
  onUpdateSessions: (sessions: ExamSession[]) => void;
  onBackToPortal: () => void;
  onEnterTeacherPortal?: (teacher: Teacher) => void;
  onLockOperator?: () => void;
  onUpdateOperator?: (operator: Operator) => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  operator,
  students,
  teachers,
  exams,
  examSessions,
  disabledRooms = [],
  onToggleRoomStatus,
  onUpdateDisabledRooms,
  disabledStudentIds = [],
  onToggleStudentStatus,
  onBatchToggleStudents,
  onEnableAllStudents,
  onUpdateStudents,
  onUpdateTeachers,
  onUpdateExams,
  onUpdateSessions,
  onBackToPortal,
  onEnterTeacherPortal,
  onLockOperator,
  onUpdateOperator,
}) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'sessions_control' | 'accounts_reset' | 'results_summary' | 'audit_log'>('monitoring');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'all');
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importInitialMode, setImportInitialMode] = useState<'students' | 'teachers'>('students');

  // Account Editor state
  const [editingStudent, setEditingStudent] = useState<Student | null | 'new'>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null | 'new'>(null);

  // Edit Master Operator Modal state
  const [showEditOperatorModal, setShowEditOperatorModal] = useState<boolean>(false);

  const handleSaveOperator = (updated: Operator) => {
    if (onUpdateOperator) {
      onUpdateOperator(updated);
    }
    showNotification(`Nama Master Operator berhasil diperbarui menjadi "${updated.name}"`);
  };

  // Exam Cards Modal state
  const [showExamCardsModal, setShowExamCardsModal] = useState<boolean>(false);
  const [examCardInitialStudentId, setExamCardInitialStudentId] = useState<string | undefined>(undefined);

  // In-app Delete & Force Submit Confirmation state (replaces browser confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'student' | 'teacher' | 'force_submit' | 'exam' | 'batch_exams';
    id: string;
    name: string;
    subtitle?: string;
  } | null>(null);

  // Exam selection and search state for Tab 2
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examSearchFilter, setExamSearchFilter] = useState<string>('');
  const [reviewingExam, setReviewingExam] = useState<Exam | null>(null);

  // Search queries & Class/Room filter for accounts
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [monitoringRoomFilter, setMonitoringRoomFilter] = useState<string>('all');
  const [copiedTeacherTokenId, setCopiedTeacherTokenId] = useState<string | null>(null);
  const [copiedStudentTokenId, setCopiedStudentTokenId] = useState<string | null>(null);

  // Bulk Exam Room Management Modal State
  const [showBulkRoomModal, setShowBulkRoomModal] = useState<boolean>(false);
  const [bulkRoomClass, setBulkRoomClass] = useState<string>('all');
  const [bulkTargetRoom, setBulkTargetRoom] = useState<string>('Ruang 1');
  const [bulkCapacity, setBulkCapacity] = useState<number>(20);
  const [bulkDistributionMode, setBulkDistributionMode] = useState<'by_class' | 'auto_distribute' | 'filter_match'>('by_class');

  // Room Question Access Control State (Aksi Matikan / Aktifkan Soal per Ruang)
  const [localDisabledRooms, setLocalDisabledRooms] = useState<string[]>([]);
  const currentDisabledRooms = disabledRooms !== undefined ? disabledRooms : localDisabledRooms;
  const [showRoomControlModal, setShowRoomControlModal] = useState<boolean>(false);
  const [roomControlSearchQuery, setRoomControlSearchQuery] = useState<string>('');
  const [roomFilterStatus, setRoomFilterStatus] = useState<'all' | 'with_students' | 'disabled_only' | 'active_only'>('all');
  const [selectedRoomsForBatchToggle, setSelectedRoomsForBatchToggle] = useState<string[]>([]);

  const handleToggleRoom = (roomName: string) => {
    if (onToggleRoomStatus) {
      onToggleRoomStatus(roomName);
    } else {
      setLocalDisabledRooms(prev => 
        prev.includes(roomName) ? prev.filter(r => r !== roomName) : [...prev, roomName]
      );
    }
    const isNowDisabled = !currentDisabledRooms.includes(roomName);
    showNotification(
      isNowDisabled
        ? `Akses soal di "${roomName}" berhasil DIMATIKAN/DINONAKTIFKAN.`
        : `Akses soal di "${roomName}" berhasil DIAKTIFKAN kembali.`
    );
  };

  const handleDisableMultipleRooms = (roomsToDisable: string[]) => {
    const combined = Array.from(new Set([...currentDisabledRooms, ...roomsToDisable]));
    if (onUpdateDisabledRooms) {
      onUpdateDisabledRooms(combined);
    } else {
      setLocalDisabledRooms(combined);
    }
    showNotification(`Akses soal pada ${roomsToDisable.length} ruangan berhasil DIMATIKAN.`);
    setSelectedRoomsForBatchToggle([]);
  };

  const handleEnableMultipleRooms = (roomsToEnable: string[]) => {
    const filtered = currentDisabledRooms.filter(r => !roomsToEnable.includes(r));
    if (onUpdateDisabledRooms) {
      onUpdateDisabledRooms(filtered);
    } else {
      setLocalDisabledRooms(filtered);
    }
    showNotification(`Akses soal pada ${roomsToEnable.length} ruangan berhasil DIAKTIFKAN kembali.`);
    setSelectedRoomsForBatchToggle([]);
  };

  const handleEnableAllRooms = () => {
    if (onUpdateDisabledRooms) {
      onUpdateDisabledRooms([]);
    } else {
      setLocalDisabledRooms([]);
    }
    showNotification('Seluruh ruang ujian telah DIAKTIFKAN kembali.');
  };

  // Individual & Multi-Student Question Access Control State
  const [localDisabledStudentIds, setLocalDisabledStudentIds] = useState<string[]>([]);
  const currentDisabledStudents = disabledStudentIds !== undefined ? disabledStudentIds : localDisabledStudentIds;
  const [showStudentControlModal, setShowStudentControlModal] = useState<boolean>(false);
  const [studentControlSearchQuery, setStudentControlSearchQuery] = useState<string>('');
  const [studentControlFilterStatus, setStudentControlFilterStatus] = useState<'all' | 'working_only' | 'disabled_only' | 'active_only'>('all');
  const [studentControlClassFilter, setStudentControlClassFilter] = useState<string>('all');
  const [studentControlRoomFilter, setStudentControlRoomFilter] = useState<string>('all');
  const [selectedStudentsForBatchAction, setSelectedStudentsForBatchAction] = useState<string[]>([]);

  // Selected sessions in Tab 1 live monitoring table
  const [selectedSessionStudentIds, setSelectedSessionStudentIds] = useState<string[]>([]);

  const handleToggleStudent = (studentId: string) => {
    if (onToggleStudentStatus) {
      onToggleStudentStatus(studentId);
    } else {
      setLocalDisabledStudentIds(prev =>
        prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
      );
    }
    const isNowDisabled = !currentDisabledStudents.includes(studentId);
    const targetStudent = students.find(s => s.id === studentId);
    showNotification(
      isNowDisabled
        ? `Akses soal untuk siswa "${targetStudent?.name || 'Siswa'}" berhasil DIMATIKAN secara khusus. Siswa lain tetap normal.`
        : `Akses soal untuk siswa "${targetStudent?.name || 'Siswa'}" berhasil DIAKTIFKAN kembali.`
    );
  };

  const handleBatchToggleStudentsAction = (studentIds: string[], shouldDisable: boolean) => {
    if (onBatchToggleStudents) {
      onBatchToggleStudents(studentIds, shouldDisable);
    } else {
      setLocalDisabledStudentIds(prev => {
        if (shouldDisable) {
          return Array.from(new Set([...prev, ...studentIds]));
        } else {
          return prev.filter(id => !studentIds.includes(id));
        }
      });
    }
    showNotification(
      shouldDisable
        ? `Akses soal untuk ${studentIds.length} siswa berhasil DIMATIKAN. Siswa lain tidak terganggu.`
        : `Akses soal untuk ${studentIds.length} siswa berhasil DIAKTIFKAN kembali.`
    );
    setSelectedSessionStudentIds([]);
    setSelectedStudentsForBatchAction([]);
  };

  const handleEnableAllStudentsAction = () => {
    if (onEnableAllStudents) {
      onEnableAllStudents();
    } else {
      setLocalDisabledStudentIds([]);
    }
    showNotification('Seluruh akses soal untuk semua peserta didik telah DIAKTIFKAN kembali.');
  };

  const handleBatchResetTokens = (studentIds: string[]) => {
    studentIds.forEach(id => {
      const newToken = generateUniqueStudentToken();
      onUpdateStudents(
        students.map(st => st.id === id ? {
          ...st,
          token: newToken,
          status: 'ready',
          isLockedOut: false,
          lockoutReason: undefined,
          completedExamIds: [],
        } : st)
      );
      onUpdateSessions(
        examSessions.filter(sess => sess.studentId !== id)
      );
    });
    showNotification(`Token ${studentIds.length} siswa berhasil direset dan batasan 1x ujian dibuka kembali.`);
    setSelectedSessionStudentIds([]);
  };

  // Individual & Room-Targeted Student Account Control State
  const [showRoomAccountControlModal, setShowRoomAccountControlModal] = useState<boolean>(false);
  const [selectedRoomForAccountControl, setSelectedRoomForAccountControl] = useState<string>('Ruang 1');
  const [accountControlSearchQuery, setAccountControlSearchQuery] = useState<string>('');
  const [accountControlFilterStatus, setAccountControlFilterStatus] = useState<'all' | 'active_only' | 'disabled_only'>('all');
  const [selectedStudentIdsForAccountAction, setSelectedStudentIdsForAccountAction] = useState<string[]>([]);

  // Count & list of deactivated accounts
  const disabledStudentAccounts = useMemo(() => {
    return students.filter(s => Boolean(s.isAccountDisabled));
  }, [students]);

  // Handler for single student account deactivation/activation
  const handleToggleSingleStudentAccount = (studentId: string, shouldDisable: boolean) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;
    const targetRoom = target.room || 'Ruang 1';

    onUpdateStudents(
      students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            isAccountDisabled: shouldDisable,
            status: shouldDisable ? 'blocked' : 'ready',
            lockoutReason: shouldDisable 
              ? `Akun dinonaktifkan oleh Operator pada ${targetRoom}` 
              : undefined,
          };
        }
        return s;
      })
    );

    // If disabled, also update active session status if present
    if (shouldDisable) {
      onUpdateSessions(
        examSessions.map(sess => 
          sess.studentId === studentId && sess.status === 'working'
            ? { ...sess, status: 'blocked' }
            : sess
        )
      );
    }

    showNotification(
      shouldDisable
        ? `Akun siswa "${target.name}" (${targetRoom}) berhasil DINONAKTIFKAN. Akun siswa lainnya tidak terganggu.`
        : `Akun siswa "${target.name}" (${targetRoom}) berhasil DIAKTIFKAN kembali.`
    );
  };

  // Handler for batch student account deactivation/activation (by selected IDs or in specific room)
  const handleBatchToggleStudentAccounts = (studentIds: string[], shouldDisable: boolean, customRoomLabel?: string) => {
    if (studentIds.length === 0) return;

    onUpdateStudents(
      students.map(s => {
        if (studentIds.includes(s.id)) {
          return {
            ...s,
            isAccountDisabled: shouldDisable,
            status: shouldDisable ? 'blocked' : 'ready',
            lockoutReason: shouldDisable 
              ? `Akun dinonaktifkan oleh Operator pada ${s.room || 'ruangan ini'}` 
              : undefined,
          };
        }
        return s;
      })
    );

    if (shouldDisable) {
      onUpdateSessions(
        examSessions.map(sess => 
          studentIds.includes(sess.studentId) && sess.status === 'working'
            ? { ...sess, status: 'blocked' }
            : sess
        )
      );
    }

    const roomInfo = customRoomLabel ? ` di "${customRoomLabel}"` : '';
    showNotification(
      shouldDisable
        ? `Akun ${studentIds.length} siswa${roomInfo} berhasil DINONAKTIFKAN. Akun siswa lainnya tidak terganggu.`
        : `Akun ${studentIds.length} siswa${roomInfo} berhasil DIAKTIFKAN kembali.`
    );

    setSelectedStudentIdsForAccountAction([]);
    setSelectedSessionStudentIds([]);
  };

  // Handler to toggle all student accounts in a specific room
  const handleToggleAllStudentsInRoom = (roomName: string, shouldDisable: boolean) => {
    const studentsInRoom = students.filter(s => (s.room || 'Ruang 1') === roomName);
    if (studentsInRoom.length === 0) {
      showNotification(`Tidak ada akun siswa yang terdaftar di ${roomName}.`);
      return;
    }

    const studentIds = studentsInRoom.map(s => s.id);
    handleBatchToggleStudentAccounts(studentIds, shouldDisable, roomName);
  };

  // Handler to enable all disabled student accounts across all rooms
  const handleEnableAllStudentAccounts = () => {
    onUpdateStudents(
      students.map(s => ({
        ...s,
        isAccountDisabled: false,
        status: s.status === 'blocked' && s.isAccountDisabled ? 'ready' : s.status,
        lockoutReason: s.isAccountDisabled ? undefined : s.lockoutReason,
      }))
    );
    showNotification('Seluruh akun siswa yang dinonaktifkan telah DIAKTIFKAN kembali di semua ruangan.');
    setSelectedStudentIdsForAccountAction([]);
  };

  // Schedule Management Modal State & Handlers for Operator
  const [editingScheduleExam, setEditingScheduleExam] = useState<Exam | null>(null);
  const [scheduleModalStart, setScheduleModalStart] = useState<string>('');
  const [scheduleModalEnd, setScheduleModalEnd] = useState<string>('');
  const [scheduleModalEnabled, setScheduleModalEnabled] = useState<boolean>(true);

  const handleOpenScheduleModal = (exam: Exam) => {
    setEditingScheduleExam(exam);
    const now = new Date();
    setScheduleModalStart(exam.startDate || toDateTimeLocalString(now));
    setScheduleModalEnd(exam.endDate || toDateTimeLocalString(new Date(now.getTime() + (exam.durationMinutes || 60) * 60 * 1000 + 3600000)));
    setScheduleModalEnabled(exam.enableSchedule !== false);
  };

  const handleSaveExamSchedule = () => {
    if (!editingScheduleExam) return;
    onUpdateExams(
      exams.map(e => e.id === editingScheduleExam.id ? {
        ...e,
        enableSchedule: scheduleModalEnabled,
        startDate: scheduleModalStart,
        endDate: scheduleModalEnd,
      } : e)
    );
    showNotification(`Jadwal tanggal & jam ujian "${editingScheduleExam.title}" berhasil diperbarui oleh Operator.`);
    setEditingScheduleExam(null);
  };

  const handleQuickExtendExam = (exam: Exam, additionalMinutes: number) => {
    const baseEnd = exam.endDate ? new Date(exam.endDate).getTime() : Date.now();
    const newEndTime = new Date(Math.max(Date.now(), baseEnd) + additionalMinutes * 60 * 1000);
    const newEndStr = toDateTimeLocalString(newEndTime);

    onUpdateExams(
      exams.map(e => e.id === exam.id ? {
        ...e,
        enableSchedule: true,
        startDate: e.startDate || toDateTimeLocalString(new Date()),
        endDate: newEndStr,
      } : e)
    );
    showNotification(`Waktu berakhir ujian "${exam.title}" berhasil diperpanjang +${additionalMinutes} menit (s.d ${formatExamDateTimeShort(newEndStr)}).`);
  };

  // Available classes for filtering
  const availableClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleCopyToken = (teacherId: string, token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedTeacherTokenId(teacherId);
    showNotification(`Token guru "${token}" disalin ke clipboard.`);
    setTimeout(() => {
      setCopiedTeacherTokenId(null);
    }, 2000);
  };

  const handleCopyStudentToken = (studentId: string, token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedStudentTokenId(studentId);
    showNotification(`Token siswa "${token}" disalin ke clipboard.`);
    setTimeout(() => {
      setCopiedStudentTokenId(null);
    }, 2000);
  };

  const handleOpenImport = (mode: 'students' | 'teachers') => {
    setImportInitialMode(mode);
    setShowImportModal(true);
  };

  // Reset Student Lock / Account (Buka Kunci Pelanggaran)
  const handleResetStudentLockout = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    onUpdateStudents(
      students.map((st) => (st.id === studentId ? { ...st, status: 'ready', isLockedOut: false, lockoutReason: undefined } : st))
    );
    // Also update any blocked session
    onUpdateSessions(
      examSessions.map((sess) =>
        sess.studentId === studentId && sess.status === 'blocked'
          ? { ...sess, status: 'submitted' }
          : sess
      )
    );
    showNotification(`Kunci pelanggaran akun "${student?.name || 'Siswa'}" berhasil dibuka. Akses ujian kini dipulihkan.`);
  };

  const handleResetStudent = handleResetStudentLockout;

  // Reset Student Token to new random token & unlock 1x attempt limitation
  const handleResetStudentToken = (studentId: string) => {
    const newToken = generateUniqueStudentToken();
    const student = students.find(s => s.id === studentId);
    onUpdateStudents(
      students.map((st) => (st.id === studentId ? { 
        ...st, 
        token: newToken,
        status: 'ready',
        isLockedOut: false,
        lockoutReason: undefined,
        completedExamIds: [], // Reset batas 1x kesempatan pengerjaan
      } : st))
    );
    // Hapus sesi lama yang sudah disubmit/diblokir agar siswa dapat memulai 1x kesempatan baru
    onUpdateSessions(
      examSessions.filter(sess => sess.studentId !== studentId && sess.nisn !== student?.nisn)
    );
    showNotification(
      `Kode token siswa "${student?.name || 'Siswa'}" berhasil direset ke: ${newToken}. Batasan 1x ujian dibuka kembali untuk ujian ulang.`
    );
  };

  // Save / Update Student
  const handleSaveStudent = (savedStudent: Student) => {
    const exists = students.some(s => s.id === savedStudent.id);
    const updated = exists
      ? students.map(s => s.id === savedStudent.id ? savedStudent : s)
      : [savedStudent, ...students];
    onUpdateStudents(updated);
    showNotification(`Data akun siswa "${savedStudent.name}" berhasil disimpan.`);
    setEditingStudent(null);
  };

  // Save / Update Teacher
  const handleSaveTeacher = (savedTeacher: Teacher) => {
    const exists = teachers.some(t => t.id === savedTeacher.id);
    const updated = exists
      ? teachers.map(t => t.id === savedTeacher.id ? savedTeacher : t)
      : [savedTeacher, ...teachers];
    onUpdateTeachers(updated);
    showNotification(`Data akun guru "${savedTeacher.name}" berhasil disimpan.`);
    setEditingTeacher(null);
  };

  // Execution handler for confirmed in-app deletes
  const handleExecuteConfirmedAction = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'student') {
      const studentId = deleteConfirmTarget.id;
      const name = deleteConfirmTarget.name;
      onUpdateStudents(students.filter(s => s.id !== studentId));
      onUpdateSessions(examSessions.filter(sess => sess.studentId !== studentId));
      showNotification(`Akun siswa "${name}" berhasil dihapus.`);
    } else if (deleteConfirmTarget.type === 'teacher') {
      const teacherId = deleteConfirmTarget.id;
      const name = deleteConfirmTarget.name;
      onUpdateTeachers(teachers.filter(t => t.id !== teacherId));
      showNotification(`Akun guru "${name}" berhasil dihapus.`);
    } else if (deleteConfirmTarget.type === 'force_submit') {
      const sessionId = deleteConfirmTarget.id;
      onUpdateSessions(
        examSessions.map(sess =>
          sess.id === sessionId
            ? { ...sess, status: 'force_submitted', endTime: Date.now() }
            : sess
        )
      );
      showNotification(`Ujian siswa "${deleteConfirmTarget.name}" telah diselesaikan secara paksa.`);
    } else if (deleteConfirmTarget.type === 'exam') {
      const examId = deleteConfirmTarget.id;
      const name = deleteConfirmTarget.name;
      onUpdateExams(exams.filter(e => e.id !== examId));
      onUpdateSessions(examSessions.filter(sess => sess.examId !== examId));
      setSelectedExamIds(prev => prev.filter(id => id !== examId));
      if (selectedExamId === examId) setSelectedExamId('all');
      showNotification(`Jenis ujian "${name}" berhasil dihapus.`);
    } else if (deleteConfirmTarget.type === 'batch_exams') {
      const count = selectedExamIds.length;
      onUpdateExams(exams.filter(e => !selectedExamIds.includes(e.id)));
      onUpdateSessions(examSessions.filter(sess => !selectedExamIds.includes(sess.examId)));
      if (selectedExamIds.includes(selectedExamId)) setSelectedExamId('all');
      setSelectedExamIds([]);
      showNotification(`Berhasil menghapus ${count} jenis ujian terpilih beserta riwayat pengerjaannya.`);
    }

    setDeleteConfirmTarget(null);
  };

  // Reset Teacher Login Token
  const handleResetTeacherToken = (teacherId: string) => {
    const newToken = generateUniqueTeacherToken();
    const teacher = teachers.find(t => t.id === teacherId);
    onUpdateTeachers(
      teachers.map(t => t.id === teacherId ? { ...t, token: newToken } : t)
    );
    showNotification(`Token login untuk ${teacher?.name || 'Guru'} berhasil direset menjadi: ${newToken}`);
  };

  // Toggle Exam Status (Buka / Tutup / Kunci)
  const handleToggleExamStatus = (examId: string, newStatus: 'published' | 'closed' | 'draft') => {
    onUpdateExams(
      exams.map((ex) => (ex.id === examId ? { ...ex, status: newStatus } : ex))
    );
    showNotification(`Status ujian ${examId} diubah menjadi: ${newStatus.toUpperCase()}`);
  };

  // Regenerate Token
  const handleRegenerateToken = (examId: string) => {
    const newToken = `CBT-${Math.floor(1000 + Math.random() * 9000)}`;
    onUpdateExams(
      exams.map((ex) => (ex.id === examId ? { ...ex, token: newToken } : ex))
    );
    showNotification(`Token baru dibuat: ${newToken}`);
  };

  // Print Official Berita Acara
  const handlePrintBeritaAcara = (exam: Exam) => {
    const sessions = examSessions.filter(s => s.examId === exam.id);
    const violationsList: { studentName: string; reason: string; time: string }[] = [];

    sessions.forEach(s => {
      s.violations.forEach(v => {
        violationsList.push({
          studentName: s.studentName,
          reason: `${v.title} (${v.details})`,
          time: v.timestamp,
        });
      });
    });

    printBeritaAcara(
      exam,
      operator.name,
      students.length,
      sessions.filter(s => s.status === 'submitted' || s.status === 'force_submitted').length,
      violationsList
    );
  };

  // Export full results to XLSX
  const handleExportFullResults = (exam: Exam) => {
    const sessions = examSessions.filter(s => s.examId === exam.id);
    const formatted = sessions.map((s, idx) => ({
      no: idx + 1,
      studentName: s.studentName,
      nisn: s.nisn,
      className: s.className,
      score: s.score || 0,
      maxScore: s.maxScore || 100,
      percentage: s.maxScore ? (s.score! / s.maxScore) * 100 : 0,
      violationsCount: s.violations.length,
      status: s.status === 'submitted' ? 'Selesai' : s.status === 'force_submitted' ? 'Disubmit Paksa' : s.status === 'blocked' ? 'Terkunci' : 'Sedang Mengerjakan',
      submittedAt: s.endTime ? new Date(s.endTime).toLocaleTimeString('id-ID') : 'Aktif',
    }));
    exportResultsToXlsx(exam.title, exam.subject, formatted);
    showNotification(`Hasil ujian "${exam.title}" berhasil diekspor ke file Excel XLSX.`);
  };

  // Quick Change Student Room (Ruang 1 s.d Ruang 30)
  const handleQuickChangeStudentRoom = (studentId: string, newRoom: string) => {
    const student = students.find(s => s.id === studentId);
    onUpdateStudents(
      students.map(s => s.id === studentId ? { ...s, room: newRoom } : s)
    );
    showNotification(`Ruang ujian "${student?.name || 'Siswa'}" dialihkan ke ${newRoom}.`);
  };

  // Bulk Exam Room Assignment Handler
  const handleApplyBulkRoom = () => {
    if (bulkDistributionMode === 'by_class') {
      if (bulkRoomClass === 'all') {
        onUpdateStudents(students.map(s => ({ ...s, room: bulkTargetRoom })));
        showNotification(`Semua ${students.length} siswa berhasil dialokasikan ke ${bulkTargetRoom}.`);
      } else {
        const count = students.filter(s => s.className === bulkRoomClass).length;
        onUpdateStudents(
          students.map(s => s.className === bulkRoomClass ? { ...s, room: bulkTargetRoom } : s)
        );
        showNotification(`Sebanyak ${count} siswa kelas ${bulkRoomClass} berhasil dialokasikan ke ${bulkTargetRoom}.`);
      }
    } else if (bulkDistributionMode === 'auto_distribute') {
      const cap = Math.max(1, bulkCapacity);
      const updated = students.map((s, idx) => {
        const roomIndex = Math.min(Math.floor(idx / cap), AVAILABLE_EXAM_ROOMS.length - 1);
        return {
          ...s,
          room: AVAILABLE_EXAM_ROOMS[roomIndex] || 'Ruang 1',
        };
      });
      onUpdateStudents(updated);
      const roomsUsed = Math.min(Math.ceil(students.length / cap), AVAILABLE_EXAM_ROOMS.length);
      showNotification(`Berhasil mendistribusikan ${students.length} siswa ke dalam ${roomsUsed} ruang ujian (kapasitas ~${cap} siswa/ruang).`);
    } else if (bulkDistributionMode === 'filter_match') {
      const filteredStudentIds = students
        .filter((st) => {
          if (selectedClassFilter !== 'all' && st.className !== selectedClassFilter) return false;
          if (selectedRoomFilter !== 'all' && (st.room || 'Ruang 1') !== selectedRoomFilter) return false;
          if (!studentSearchQuery) return true;
          const q = studentSearchQuery.toLowerCase();
          return (
            st.name.toLowerCase().includes(q) ||
            st.nisn.toLowerCase().includes(q) ||
            st.className.toLowerCase().includes(q) ||
            (st.token && st.token.toLowerCase().includes(q))
          );
        })
        .map(s => s.id);

      if (filteredStudentIds.length === 0) {
        showNotification('Tidak ada siswa yang sesuai kriteria filter saat ini.');
        return;
      }

      onUpdateStudents(
        students.map(s => filteredStudentIds.includes(s.id) ? { ...s, room: bulkTargetRoom } : s)
      );
      showNotification(`Sebanyak ${filteredStudentIds.length} siswa terfilter berhasil dialihkan ke ${bulkTargetRoom}.`);
    }

    setShowBulkRoomModal(false);
  };

  // Export Students to XLSX
  const handleExportStudentsXlsx = () => {
    const studentsToExport = students.filter((st) => {
      if (selectedClassFilter !== 'all' && st.className !== selectedClassFilter) {
        return false;
      }
      if (selectedRoomFilter !== 'all' && (st.room || 'Ruang 1') !== selectedRoomFilter) {
        return false;
      }
      if (!studentSearchQuery) return true;
      const q = studentSearchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.nisn.toLowerCase().includes(q) ||
        st.className.toLowerCase().includes(q) ||
        (st.token && st.token.toLowerCase().includes(q))
      );
    });

    if (studentsToExport.length === 0) {
      showNotification('Tidak ada data siswa untuk diekspor.');
      return;
    }

    let filterName = 'Semua_Siswa';
    if (selectedClassFilter !== 'all' && selectedRoomFilter !== 'all') {
      filterName = `Kelas_${selectedClassFilter}_${selectedRoomFilter.replace(/\s+/g, '_')}`;
    } else if (selectedClassFilter !== 'all') {
      filterName = `Kelas_${selectedClassFilter}`;
    } else if (selectedRoomFilter !== 'all') {
      filterName = selectedRoomFilter.replace(/\s+/g, '_');
    }

    exportStudentsToXlsx(studentsToExport, filterName);
    showNotification(`Berhasil mengekspor ${studentsToExport.length} data akun siswa ke file XLSX.`);
  };

  // Export Teachers to XLSX
  const handleExportTeachersXlsx = () => {
    const teachersToExport = teachers.filter((t) => {
      if (!teacherSearchQuery) return true;
      const q = teacherSearchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.nip.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.token && t.token.toLowerCase().includes(q))
      );
    });

    if (teachersToExport.length === 0) {
      showNotification('Tidak ada data guru untuk diekspor.');
      return;
    }

    exportTeachersToXlsx(teachersToExport);
    showNotification(`Berhasil mengekspor ${teachersToExport.length} data akun guru ke file XLSX.`);
  };

  // Filtered sessions
  const filteredSessions = examSessions.filter((sess) => {
    if (selectedExamId !== 'all' && sess.examId !== selectedExamId) return false;
    if (monitoringRoomFilter !== 'all') {
      const studentObj = students.find(s => s.id === sess.studentId || s.nisn === sess.nisn);
      if ((studentObj?.room || 'Ruang 1') !== monitoringRoomFilter) {
        return false;
      }
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        sess.studentName.toLowerCase().includes(q) ||
        sess.nisn.toLowerCase().includes(q) ||
        sess.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live stats
  const totalActiveParticipants = examSessions.filter(s => s.status === 'working').length;
  const totalViolationsCount = examSessions.reduce((acc, s) => acc + s.violations.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Operator Header Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-800/80 p-2 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <img 
              src="https://iili.io/f0D1nQs.png" 
              alt="Logo SmanGt EduSecure CBT" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{operator.name}</h1>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                Akses Penuh Seluruh Sistem
              </span>
              <button
                type="button"
                onClick={() => setShowEditOperatorModal(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ganti / Edit Nama Master Operator"
              >
                <Edit3 className="w-3 h-3 text-emerald-400" />
                <span>Ganti Nama Operator</span>
              </button>
              {onLockOperator && (
                <button
                  type="button"
                  onClick={onLockOperator}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-2"
                  title="Kunci kembali akses operator dengan kode aktivasi"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Kunci Laman Operator</span>
                </button>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{operator.email}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Server CBT Live & Terproteksi
              </span>
            </div>
          </div>
        </div>

        {/* Global Quick Action Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center">
            <span className="text-slate-400 block text-[11px]">Siswa Sedang Ujian</span>
            <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {totalActiveParticipants}
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center">
            <span className="text-slate-400 block text-[11px]">Catatan Pelanggaran</span>
            <span className="text-lg font-bold font-mono text-rose-400 tabular-nums">
              {totalViolationsCount}
            </span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[11px]">Total Ujian Aktif</span>
            <span className="text-lg font-bold font-mono text-blue-400 tabular-nums">
              {exams.filter(e => e.status === 'published').length}
            </span>
          </div>
        </div>
      </div>

      {/* Operator Main Tabs */}
      <div className="border-b border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto no-scrollbar whitespace-nowrap pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'monitoring' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Pemantauan <span className="hidden sm:inline">Jalannya Ujian</span></span>
          </button>
          <button
            onClick={() => setActiveTab('sessions_control')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sessions_control' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Power className="w-4 h-4 text-blue-600" />
            <span>Sesi & Rilis Token</span>
          </button>
          <button
            onClick={() => setActiveTab('accounts_reset')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'accounts_reset' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>Manajemen Akun</span>
          </button>
          <button
            onClick={() => setActiveTab('results_summary')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'results_summary' ? 'text-emerald-700 border-emerald-700' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Rekap Hasil Ujian</span>
          </button>
        </div>

        <div className="pb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('results_summary')}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Buka Dokumen Rekap Hasil Ujian Seluruh Siswa & Semua Mapel"
          >
            <Award className="w-4 h-4 text-amber-950" />
            <span>Rekap Hasil Ujian</span>
          </button>
          <button
            onClick={() => handleOpenImport('students')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tool Import Akun (Format XLSX)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PEMANTAUAN JALANNYA UJIAN REAL-TIME */}
      {activeTab === 'monitoring' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari nama, NISN, atau kelas..."
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 w-60"
                />
              </div>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
              >
                <option value="all">Semua Ujian yang Aktif</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <select
                value={monitoringRoomFilter}
                onChange={(e) => setMonitoringRoomFilter(e.target.value)}
                className="px-3 py-2 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-semibold cursor-pointer"
              >
                <option value="all">Semua Ruang Ujian (1-30)</option>
                {AVAILABLE_EXAM_ROOMS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Action Button: Matikan / Aktifkan Soal per Ruang */}
              <button
                type="button"
                onClick={() => setShowRoomControlModal(true)}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  currentDisabledRooms.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
                title="Aksi untuk mematikan/nonaktifkan atau menyalakan soal pada ruang-ruang tertentu"
              >
                <PowerOff className="w-3.5 h-3.5 text-amber-300" />
                <span>Matikan/Aktifkan Soal per Ruang</span>
                {currentDisabledRooms.length > 0 && (
                  <span className="bg-rose-900 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-black border border-rose-400">
                    {currentDisabledRooms.length} Nonaktif
                  </span>
                )}
              </button>

              {/* Action Button: Matikan / Aktifkan Soal per Siswa */}
              <button
                type="button"
                onClick={() => setShowStudentControlModal(true)}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  currentDisabledStudents.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                }`}
                title="Aksi untuk mematikan/nonaktifkan soal yang sedang dikerjakan seorang siswa atau beberapa siswa tanpa mengganggu akses siswa lainnya"
              >
                <UserX className="w-3.5 h-3.5 text-amber-300" />
                <span>Matikan/Aktifkan Soal per Siswa</span>
                {currentDisabledStudents.length > 0 && (
                  <span className="bg-rose-900 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-black border border-rose-400">
                    {currentDisabledStudents.length} Siswa Nonaktif
                  </span>
                )}
              </button>

              {/* Action Button: Nonaktifkan / Kelola Akun Siswa per Ruangan */}
              <button
                type="button"
                onClick={() => setShowRoomAccountControlModal(true)}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  disabledStudentAccounts.length > 0
                    ? 'bg-rose-700 hover:bg-rose-800 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title="Aksi untuk menonaktifkan akun siswa, atau beberapa akun siswa pada ruangan tertentu tanpa mengganggu akun siswa lainnya"
              >
                <ShieldOff className="w-3.5 h-3.5 text-rose-300" />
                <span>Nonaktifkan Akun Siswa per Ruangan</span>
                {disabledStudentAccounts.length > 0 && (
                  <span className="bg-rose-950 text-rose-200 text-[10px] px-1.5 py-0.2 rounded-full font-black border border-rose-500">
                    {disabledStudentAccounts.length} Akun Nonaktif
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Terdeteksi: <strong>{filteredSessions.length} Sesi Partisipan</strong>
              </span>
            </div>
          </div>

          {/* Active Disabled Accounts Alert Banner */}
          {disabledStudentAccounts.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-rose-950">
                      Terdapat {disabledStudentAccounts.length} Akun Siswa yang Dinonaktifkan di Ruangan Tertentu:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {disabledStudentAccounts.map(st => (
                        <span key={st.id} className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-semibold text-[11px] border border-rose-300 flex items-center gap-1">
                          <span>{st.name}</span>
                          <span className="text-[10px] text-rose-700 font-bold">({st.room || 'Ruang 1'})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hanya akun-akun siswa tersebut yang dinonaktifkan. Akun siswa lainnya pada ruangan bersangkutan maupun ruangan lain tetap aktif secara normal tanpa terganggu.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowRoomAccountControlModal(true)}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Kelola Akun per Ruang
                </button>
                <button
                  type="button"
                  onClick={handleEnableAllStudentAccounts}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Aktifkan Semua Akun
                </button>
              </div>
            </div>
          )}

          {/* Active Disabled Students Alert Banner */}
          {currentDisabledStudents.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-rose-950">
                      Akses Soal Dinonaktifkan Khusus untuk {currentDisabledStudents.length} Siswa:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {currentDisabledStudents.map(stId => {
                        const stObj = students.find(s => s.id === stId);
                        return (
                          <span key={stId} className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-semibold text-[11px] border border-rose-300 flex items-center gap-1">
                            <span>{stObj?.name || stId}</span>
                            <span className="text-[10px] text-rose-700 font-mono">({stObj?.className || '-'})</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hanya siswa-siswa tersebut yang tampilan soalnya dibekukan. Peserta didik lainnya tetap mengerjakan soal secara normal tanpa terganggu.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowStudentControlModal(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Kelola Siswa Nonaktif
                </button>
                <button
                  type="button"
                  onClick={handleEnableAllStudentsAction}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Aktifkan Semua Siswa
                </button>
              </div>
            </div>
          )}

          {/* Active Disabled Rooms Alert Banner */}
          {currentDisabledRooms.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <PowerOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-rose-950">
                      Akses Soal Dinonaktifkan pada {currentDisabledRooms.length} Ruang:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {currentDisabledRooms.map(rm => (
                        <span key={rm} className="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded font-mono font-bold text-[11px] border border-rose-300">
                          {rm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Peserta didik pada ruangan tersebut sedang dijeda sementara dan tampilan soal dibekukan di layar mereka.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowRoomControlModal(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Kelola Ruangan
                </button>
                <button
                  type="button"
                  onClick={handleEnableAllRooms}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Aktifkan Semua
                </button>
              </div>
            </div>
          )}

          {/* Live Monitoring Table with Transparent Timers */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Monitor Durasi & Integritas Siswa Real-Time
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pengawas dapat mematikan soal seorang siswa atau memilih beberapa siswa sekaligus tanpa mengganggu peserta lain.
                </p>
              </div>

              {/* Quick Summary Counts */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {currentDisabledStudents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-300 flex items-center gap-1">
                    <UserX className="w-3 h-3 text-rose-600" />
                    <span>{currentDisabledStudents.length} Soal Siswa Mati</span>
                  </span>
                )}
                {currentDisabledRooms.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300 flex items-center gap-1">
                    <DoorOpen className="w-3 h-3 text-amber-600" />
                    <span>{currentDisabledRooms.length} Ruang Mati</span>
                  </span>
                )}
              </div>
            </div>

            {/* Batch Action Bar for Selected Sessions */}
            {selectedSessionStudentIds.length > 0 && (
              <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 rounded-md font-bold text-[11px] shadow-2xs">
                    {selectedSessionStudentIds.length} Siswa Terpilih
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    Aksi massal untuk siswa yang diceklis (tanpa mengganggu siswa lainnya):
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleBatchToggleStudentsAction(selectedSessionStudentIds, true)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Matikan pengerjaan soal untuk siswa terpilih tanpa mengganggu siswa lain"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Matikan Soal ({selectedSessionStudentIds.length} Siswa)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleStudentsAction(selectedSessionStudentIds, false)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Aktifkan kembali pengerjaan soal untuk siswa terpilih"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" />
                    <span>Aktifkan Soal ({selectedSessionStudentIds.length} Siswa)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleStudentAccounts(selectedSessionStudentIds, true)}
                    className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Nonaktifkan akun siswa terpilih (hanya akun mereka, siswa lain tidak terganggu)"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    <span>Nonaktifkan Akun ({selectedSessionStudentIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleStudentAccounts(selectedSessionStudentIds, false)}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Aktifkan kembali akun siswa terpilih"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Aktifkan Akun ({selectedSessionStudentIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchResetTokens(selectedSessionStudentIds)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Reset token dan beri kesempatan 1x ujian baru untuk siswa terpilih"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Token ({selectedSessionStudentIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSessionStudentIds([])}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer text-[11px]"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredSessions.length > 0 && selectedSessionStudentIds.length === filteredSessions.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessionStudentIds(filteredSessions.map(s => s.studentId));
                          } else {
                            setSelectedSessionStudentIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Pilih semua sesi peserta yang tampil"
                      />
                    </th>
                    <th className="py-3 px-4">Nama Siswa / NISN</th>
                    <th className="py-3 px-4">Ujian & Kelas / Ruang</th>
                    <th className="py-3 px-4">Status Layar</th>
                    <th className="py-3 px-4">Sisa Durasi (Live)</th>
                    <th className="py-3 px-4">Jawaban Terisi</th>
                    <th className="py-3 px-4">Pelanggaran</th>
                    <th className="py-3 px-4 text-right">Aksi Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        Tidak ada aktivitas siswa yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((sess) => {
                      const examObj = exams.find(e => e.id === sess.examId);
                      const studentObj = students.find(s => s.id === sess.studentId || s.nisn === sess.nisn);
                      const studentRoom = studentObj?.room || 'Ruang 1';
                      const isRoomDisabled = currentDisabledRooms.includes(studentRoom);
                      const isStudentDisabled = currentDisabledStudents.includes(sess.studentId);
                      const isRowSelected = selectedSessionStudentIds.includes(sess.studentId);
                      const totalQ = examObj?.questions.length || 4;
                      const answeredQ = Object.keys(sess.answers || {}).length;
                      const minsLeft = Math.floor(sess.remainingSeconds / 60);
                      const secsLeft = sess.remainingSeconds % 60;

                      return (
                        <tr key={sess.id} className={`transition-colors ${isRowSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSessionStudentIds(prev => [...prev, sess.studentId]);
                                } else {
                                  setSelectedSessionStudentIds(prev => prev.filter(id => id !== sess.studentId));
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{sess.studentName}</span>
                              {isStudentDisabled && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-600 text-white font-extrabold uppercase shadow-2xs">
                                  Soal Mati
                                </span>
                              )}
                              {studentObj?.isAccountDisabled && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-700 text-white font-extrabold uppercase shadow-2xs flex items-center gap-0.5">
                                  <ShieldOff className="w-2.5 h-2.5" /> Akun Nonaktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">{sess.nisn}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-medium truncate max-w-xs">{sess.examTitle}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span>{sess.className}</span>
                              <span>·</span>
                              <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border ${
                                isRoomDisabled
                                  ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                <DoorOpen className="w-3 h-3" />
                                {studentRoom}
                                {isRoomDisabled && (
                                  <span className="text-[9px] bg-rose-600 text-white px-1 rounded uppercase font-black">
                                    Ruang Mati
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isStudentDisabled && sess.status === 'working' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-900 font-bold border border-rose-300 shadow-2xs">
                                <UserX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                Soal Dimatikan (Khusus Siswa)
                              </span>
                            ) : isRoomDisabled && sess.status === 'working' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs">
                                <PowerOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                                Soal Dimatikan (Ruang)
                              </span>
                            ) : sess.status === 'working' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Sedang Mengerjakan
                              </span>
                            ) : null}
                            {sess.status === 'submitted' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Selesai
                              </span>
                            )}
                            {sess.status === 'force_submitted' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                Disubmit Paksa
                              </span>
                            )}
                            {sess.status === 'blocked' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                <Lock className="w-3.5 h-3.5" />
                                Terkunci / Pelanggaran
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {sess.status === 'working' ? (
                              <span className="text-slate-900 tabular-nums">
                                {minsLeft.toString().padStart(2, '0')}:{secsLeft.toString().padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="text-slate-800">{answeredQ}</span> / <span className="text-slate-500">{totalQ}</span>
                          </td>
                          <td className="py-3 px-4">
                            {sess.violations.length > 0 ? (
                              <div className="flex items-center gap-1 text-rose-600 font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{sess.violations.length}x teguran</span>
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-[11px]">Normal</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            {/* Toggle Question Access for THIS SPECIFIC STUDENT */}
                            {isStudentDisabled ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStudent(sess.studentId)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Aktifkan kembali pengerjaan soal khusus untuk siswa ini"
                              >
                                <Zap className="w-3 h-3 text-amber-200 fill-current" />
                                <span>Aktifkan Soal</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStudent(sess.studentId)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Matikan/nonaktifkan pengerjaan soal khusus siswa ini tanpa mengganggu akses siswa lainnya"
                              >
                                <UserX className="w-3 h-3 text-rose-600" />
                                <span>Matikan Soal</span>
                              </button>
                            )}

                            {/* Toggle Student Account Status */}
                            {studentObj?.isAccountDisabled ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSingleStudentAccount(sess.studentId, false)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-teal-600 hover:bg-teal-700 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Aktifkan kembali akun siswa ini"
                              >
                                <UserCheck className="w-3 h-3 text-teal-100" />
                                <span>Aktifkan Akun</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSingleStudentAccount(sess.studentId, true)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-700 hover:bg-rose-800 text-white inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Nonaktifkan akun siswa ini secara khusus (siswa lain tidak terganggu)"
                              >
                                <ShieldOff className="w-3 h-3 text-rose-200" />
                                <span>Nonaktifkan Akun</span>
                              </button>
                            )}

                            {/* Toggle Question Access for This Room */}
                            <button
                              type="button"
                              onClick={() => handleToggleRoom(studentRoom)}
                              className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                                isRoomDisabled
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                              title={isRoomDisabled ? `Aktifkan soal seluruh siswa di ${studentRoom}` : `Matikan soal seluruh siswa di ${studentRoom}`}
                            >
                              <DoorOpen className="w-3 h-3 text-indigo-600" />
                              <span>{isRoomDisabled ? 'Aktifkan Ruang' : 'Ruang'}</span>
                            </button>

                            {sess.status === 'working' && (
                              <button
                                onClick={() => setDeleteConfirmTarget({ 
                                   type: 'force_submit', 
                                   id: sess.id, 
                                   name: sess.studentName, 
                                   subtitle: `Mata Pelajaran: ${sess.subject}` 
                                })}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                                title="Paksa selesaikan ujian siswa ini sekarang"
                              >
                                Force Submit
                              </button>
                            )}
                            <button
                              onClick={() => handleResetStudent(sess.studentId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                              title="Buka kunci dan reset status pengerjaan siswa"
                            >
                              Reset Sesi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetStudentToken(sess.studentId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Reset kode token siswa baru & izinkan 1x pengerjaan ujian ulang"
                            >
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              <span>Reset Token</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUKA / TUTUP SESI & TOKEN */}
      {activeTab === 'sessions_control' && (() => {
        const filteredExams = exams.filter(e => {
          if (!examSearchFilter.trim()) return true;
          const q = examSearchFilter.toLowerCase();
          return (
            e.title.toLowerCase().includes(q) ||
            e.subject.toLowerCase().includes(q) ||
            e.teacherName.toLowerCase().includes(q) ||
            e.token.toLowerCase().includes(q) ||
            (e.grade && e.grade.toLowerCase().includes(q))
          );
        });

        const isAllSelected = filteredExams.length > 0 && filteredExams.every(e => selectedExamIds.includes(e.id));
        const isSomeSelected = selectedExamIds.length > 0 && !isAllSelected;

        return (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs">
              {/* Header with Title and Batch Delete Tool */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Master Control Sesi Ujian & Distribusi Token
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {exams.length} Ujian Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Buka/tutup sesi pengerjaan, rilis token baru, atau gunakan tool ceklist untuk menghapus sebagian maupun seluruh paket ujian yang pernah dibuat.
                  </p>
                </div>

                {/* Batch Delete Button */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedExamIds.length === 0) return;
                      setDeleteConfirmTarget({
                        type: 'batch_exams',
                        id: 'batch',
                        name: `${selectedExamIds.length} Jenis Ujian Terpilih`,
                        subtitle: `Menghapus ${selectedExamIds.length} jenis paket ujian beserta seluruh riwayat pengerjaannya. Tindakan ini permanen.`,
                      });
                    }}
                    disabled={selectedExamIds.length === 0}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      selectedExamIds.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                    title={
                      selectedExamIds.length > 0
                        ? `Hapus ${selectedExamIds.length} ujian terpilih`
                        : 'Pilih minimal satu jenis ujian melalui ceklist untuk mengaktifkan tombol hapus'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Ujian Terpilih</span>
                    {selectedExamIds.length > 0 && (
                      <span className="ml-1 bg-white text-rose-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {selectedExamIds.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Toolbar: Select All Checkbox Tool + Search Input */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-slate-100">
                {/* Select All Tool */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={() => {
                        if (isAllSelected) {
                          setSelectedExamIds([]);
                        } else {
                          setSelectedExamIds(filteredExams.map(e => e.id));
                        }
                      }}
                      disabled={filteredExams.length === 0}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-50"
                    />
                    <span>
                      Pilih Semua ({filteredExams.length})
                    </span>
                  </label>

                  {selectedExamIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        {selectedExamIds.length} ujian dicentang
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedExamIds([])}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Batal Pilih
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={examSearchFilter}
                    onChange={(e) => setExamSearchFilter(e.target.value)}
                    placeholder="Cari ujian, mapel, guru, token..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Exam Cards List */}
              <div className="divide-y divide-slate-100 pt-1">
                {filteredExams.map((exam) => {
                  const isChecked = selectedExamIds.includes(exam.id);
                  const totalQuestions = exam.questions?.length || 0;

                  return (
                    <div
                      key={exam.id}
                      className={`py-4 px-3 my-1 rounded-xl transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 border ${
                        isChecked
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      {/* Left: Checkbox + Exam Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="pt-1 shrink-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedExamIds(prev =>
                                prev.includes(exam.id)
                                  ? prev.filter(id => id !== exam.id)
                                  : [...prev, exam.id]
                              );
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            title={`Centang untuk memilih ujian ${exam.title}`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {exam.title}
                            </h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                exam.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {exam.status === 'published' ? 'TERBUKA / AKTIF' : 'TERKUNCI / DITUTUP'}
                            </span>
                            {(() => {
                              const scheduleInfo = getExamScheduleStatus(exam);
                              return (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border flex items-center gap-1 ${scheduleInfo.badgeBg} ${scheduleInfo.badgeText} ${scheduleInfo.badgeBorder}`}>
                                  <CalendarClock className="w-3 h-3" />
                                  <span>{scheduleInfo.label}</span>
                                </span>
                              );
                            })()}
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              {exam.subject}
                            </span>
                            {exam.grade && (
                              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {exam.grade}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>Guru: <strong className="text-slate-700">{exam.teacherName}</strong></span>
                            <span>·</span>
                            <span>Durasi: <strong className="text-slate-700">{exam.durationMinutes} Menit</strong></span>
                            <span>·</span>
                            <span>Total Soal: <strong className="text-slate-700">{totalQuestions} Butir</strong></span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-indigo-600" />
                              Token Akses: <strong className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 select-all">{exam.token}</strong>
                            </span>
                            {exam.enableSchedule !== false && exam.startDate && exam.endDate && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                  <Calendar className="w-3 h-3 text-indigo-600" />
                                  <span>Jadwal: <strong>{formatExamDateTimeShort(exam.startDate)} s.d {formatExamDateTimeShort(exam.endDate)}</strong></span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end lg:self-center">
                        {/* Atur Jadwal Tanggal & Jam Button */}
                        <button
                          onClick={() => handleOpenScheduleModal(exam)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Atur tanggal dan jam mulai serta berakhir ujian"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Atur Jadwal</span>
                        </button>

                        {/* Quick +15 Menit button if schedule enabled */}
                        {exam.enableSchedule !== false && exam.endDate && (
                          <button
                            onClick={() => handleQuickExtendExam(exam, 15)}
                            className="px-2 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            title="Perpanjang jam berakhir ujian +15 menit"
                          >
                            <span>+15m</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleRegenerateToken(exam.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Rilis kode token ujian baru"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                          <span>Rilis Token Baru</span>
                        </button>

                        {exam.status === 'published' ? (
                          <button
                            onClick={() => handleToggleExamStatus(exam.id, 'closed')}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Tutup akses ujian ini bagi siswa"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Tutup Sesi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleExamStatus(exam.id, 'published')}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Buka akses ujian ini agar siswa dapat login"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Buka Sesi</span>
                          </button>
                        )}

                        <button
                          onClick={() => handlePrintBeritaAcara(exam)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Cetak Berita Acara Ujian"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Berita Acara</span>
                        </button>

                        <button
                          onClick={() => handleExportFullResults(exam)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Ekspor Rekap Hasil ke Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Excel</span>
                        </button>

                        {/* Review Questions Button */}
                        <button
                          onClick={() => setReviewingExam(exam)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Review tampilan soal ujian"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Review Soal</span>
                        </button>

                        {/* Individual Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmTarget({
                            type: 'exam',
                            id: exam.id,
                            name: exam.title,
                            subtitle: `Guru: ${exam.teacherName} · Kode Akses: ${exam.token} · ${exam.subject}`
                          })}
                          className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Hapus ujian ${exam.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {exams.length === 0 && (
                  <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-2">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h5 className="text-sm font-bold text-slate-800">Belum Ada Jenis Ujian yang Dibuat</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Seluruh paket ujian yang dibuat oleh guru akan tampil di sini. Operator juga dapat masuk ke Laman Guru untuk membuat paket ujian baru.
                    </p>
                  </div>
                )}

                {exams.length > 0 && filteredExams.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ada ujian yang cocok dengan kata kunci <strong>"{examSearchFilter}"</strong>.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: RESET AKUN SISWA & GURU */}
      {activeTab === 'accounts_reset' && (
        <div className="space-y-6">
          {/* Master Operator Profile Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 p-1.5 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <img src="https://iili.io/f0D1nQs.png" alt="Logo SmanGt" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">{operator.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    MASTER OPERATOR
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span>Username: <strong className="text-slate-300 font-mono">{operator.username}</strong></span>
                  <span>·</span>
                  <span>Email: <strong className="text-slate-300 font-mono">{operator.email}</strong></span>
                  <span>·</span>
                  <span className="text-emerald-400">Penanggung Jawab Berita Acara & CBT</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEditOperatorModal(true)}
              className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ganti / Edit Nama Operator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Siswa Accounts Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Manajemen Akun Siswa ({students.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar akun peserta didik, status login, edit data, dan reset blokir.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      setExamCardInitialStudentId(undefined);
                      setShowExamCardsModal(true);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Menu Cetak Kartu Peserta Ujian (Sebagian atau Semua Siswa)"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kartu Ujian</span>
                  </button>
                  <button
                    onClick={() => setEditingStudent('new')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Siswa</span>
                  </button>
                  <button
                    onClick={() => setShowBulkRoomModal(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Pengaturan dan distribusi ruang ujian siswa (Ruang 1 s.d Ruang 30)"
                  >
                    <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Atur Ruang Ujian</span>
                  </button>
                  <button
                    onClick={() => handleOpenImport('students')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Import data siswa dari file Excel / Spreadsheet"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Import XLSX</span>
                  </button>
                  <button
                    onClick={handleExportStudentsXlsx}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Ekspor seluruh data akun siswa dan token login ke file Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export XLSX</span>
                  </button>
                </div>
              </div>

              {/* Filter Kelas, Ruang & Pencarian Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                <div>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">Semua Kelas ({students.length})</option>
                    {availableClasses.map((cls) => {
                      const count = students.filter(s => s.className === cls).length;
                      return (
                        <option key={cls} value={cls}>
                          Kelas {cls} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">Semua Ruang (1-30)</option>
                    {AVAILABLE_EXAM_ROOMS.map((rm) => {
                      const count = students.filter(s => (s.room || 'Ruang 1') === rm).length;
                      return (
                        <option key={rm} value={rm}>
                          {rm} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Cari siswa berdasarkan nama, NISN, token..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {students
                  .filter((st) => {
                    if (selectedClassFilter !== 'all' && st.className !== selectedClassFilter) {
                      return false;
                    }
                    if (selectedRoomFilter !== 'all' && (st.room || 'Ruang 1') !== selectedRoomFilter) {
                      return false;
                    }
                    if (!studentSearchQuery) return true;
                    const q = studentSearchQuery.toLowerCase();
                    return (
                      st.name.toLowerCase().includes(q) ||
                      st.nisn.toLowerCase().includes(q) ||
                      st.className.toLowerCase().includes(q) ||
                      (st.token && st.token.toLowerCase().includes(q))
                    );
                  })
                  .map((st) => {
                    const isLocked = st.isLockedOut || st.status === 'blocked';
                    return (
                      <div 
                        key={st.id} 
                        className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                          isLocked 
                            ? 'bg-rose-50/70 border-rose-300' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{st.name}</span>
                            {currentDisabledStudents.includes(st.id) && (
                              <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                <UserX className="w-3 h-3" /> SOAL DINONAKTIFKAN
                              </span>
                            )}
                            {isLocked ? (
                              <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                <Lock className="w-3 h-3" /> TERKUNCI PELANGGARAN
                              </span>
                            ) : st.status === 'working' ? (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                SEDANG UJIAN
                              </span>
                            ) : st.status === 'finished' || (st.completedExamIds && st.completedExamIds.length > 0) ? (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" /> UJIAN SELESAI (1x DIGUNAKAN)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                SIAP UJIAN
                              </span>
                            )}
                          </div>

                          <div className="text-slate-500 font-mono mt-0.5">
                            NISN: <strong className="text-slate-700">{st.nisn}</strong> · <span className="bg-slate-200/80 px-1 rounded text-slate-800 font-semibold">{st.className}</span> · {st.school}
                          </div>

                          {/* Ruang Ujian & Token Unik Siswa */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <DoorOpen className="w-3 h-3 text-indigo-600" /> Ruang:
                              </span>
                              <select
                                value={st.room || 'Ruang 1'}
                                onChange={(e) => handleQuickChangeStudentRoom(st.id, e.target.value)}
                                className="font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded px-1.5 py-0.5 cursor-pointer transition-colors focus:ring-1 focus:ring-indigo-500"
                                title="Ubah penempatan ruang ujian siswa (Ruang 1 s.d Ruang 30)"
                              >
                                {AVAILABLE_EXAM_ROOMS.map((rm) => (
                                  <option key={rm} value={rm}>
                                    {rm}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <KeyRound className="w-3 h-3 text-blue-600" /> Token Siswa:
                              </span>
                              <span className="font-mono font-bold text-xs bg-white border border-blue-300 text-blue-700 px-2 py-0.5 rounded tracking-wider select-all shadow-2xs">
                                {st.token || 'BELUM ADA TOKEN'}
                              </span>
                              <button
                                onClick={() => handleCopyStudentToken(st.id, st.token)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Salin Token Siswa"
                              >
                                {copiedStudentTokenId === st.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {isLocked ? (
                            <button
                              onClick={() => handleResetStudentLockout(st.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                              title="Buka kunci akun siswa akibat pelanggaran"
                            >
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>Buka Kunci</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResetStudentLockout(st.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors flex items-center gap-1"
                              title="Reset status sesi ujian"
                            >
                              <RefreshCw className="w-3 h-3 text-slate-600" />
                              <span>Reset Status</span>
                            </button>
                          )}

                          {/* Toggle Question Access for This Student */}
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(st.id)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer ${
                              currentDisabledStudents.includes(st.id)
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                            title={
                              currentDisabledStudents.includes(st.id)
                                ? 'Aktifkan kembali akses soal untuk siswa ini'
                                : 'Matikan/nonaktifkan akses soal khusus untuk siswa ini tanpa mengganggu siswa lain'
                            }
                          >
                            {currentDisabledStudents.includes(st.id) ? (
                              <>
                                <Zap className="w-3 h-3 text-amber-200 fill-current" />
                                <span>Aktifkan Soal</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 text-rose-600" />
                                <span>Matikan Soal</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleResetStudentToken(st.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Acak token login baru & izinkan 1x pengerjaan ujian ulang"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-600" />
                            <span>Reset Token</span>
                          </button>

                          <button
                            onClick={() => {
                              setExamCardInitialStudentId(st.id);
                              setShowExamCardsModal(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Cetak kartu ujian siswa ini"
                          >
                            <CreditCard className="w-3 h-3 text-amber-700" />
                            <span>Kartu</span>
                          </button>

                          <button
                            onClick={() => setEditingStudent(st)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors flex items-center gap-1"
                            title="Edit data akun siswa"
                          >
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmTarget({
                              type: 'student',
                              id: st.id,
                              name: st.name,
                              subtitle: `NISN: ${st.nisn} · ${st.className}`
                            })}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-colors"
                            title="Hapus akun siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {students.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    Belum ada akun siswa. Gunakan tombol <strong>+ Tambah Siswa</strong> atau <strong>Import XLSX</strong> di atas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guru Accounts Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Manajemen Akun Guru ({teachers.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar akun pendidik pengampu mata pelajaran, edit kredensial, dan hak akses.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => setEditingTeacher('new')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Guru</span>
                  </button>
                  <button
                    onClick={() => handleOpenImport('teachers')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Import data guru dari file Excel / Spreadsheet"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Import XLSX</span>
                  </button>
                  <button
                    onClick={handleExportTeachersXlsx}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Ekspor seluruh data akun guru dan token akses ke file Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export XLSX</span>
                  </button>
                </div>
              </div>

              {/* Teacher Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  placeholder="Cari guru berdasarkan nama, NIP, atau mata pelajaran..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Teacher List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {teachers
                  .filter((tc) => {
                    if (!teacherSearchQuery) return true;
                    const q = teacherSearchQuery.toLowerCase();
                    return (
                      tc.name.toLowerCase().includes(q) ||
                      tc.nip.toLowerCase().includes(q) ||
                      tc.subject.toLowerCase().includes(q)
                    );
                  })
                  .map((tc) => (
                    <div key={tc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{tc.name}</div>
                        <div className="text-slate-500 mt-0.5">
                          NIP: <strong className="font-mono text-slate-700">{tc.nip}</strong> · {tc.subject}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-indigo-600" /> Token:
                          </span>
                          <span className="font-mono font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded tracking-wider select-all">
                            {tc.token || 'BELUM ADA TOKEN'}
                          </span>
                          <button
                            onClick={() => handleCopyToken(tc.id, tc.token)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Salin token ke clipboard"
                          >
                            {copiedTeacherTokenId === tc.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-1">{tc.email}</div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => onEnterTeacherPortal?.(tc)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title={`Masuk langsung ke laman guru ${tc.name}`}
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Masuk</span>
                        </button>
                        <button
                          onClick={() => handleResetTeacherToken(tc.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded transition-colors flex items-center gap-1"
                          title="Reset & acak token baru untuk guru ini"
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-600" />
                          <span>Reset Token</span>
                        </button>
                        <button
                          onClick={() => setEditingTeacher(tc)}
                          className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors flex items-center gap-1"
                          title="Edit data & token akun guru"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTarget({
                            type: 'teacher',
                            id: tc.id,
                            name: tc.name,
                            subtitle: `NIP: ${tc.nip} · ${tc.subject}`
                          })}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-colors"
                          title="Hapus akun guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                {teachers.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    Belum ada akun guru. Gunakan tombol <strong>+ Tambah Guru</strong> atau <strong>Import XLSX</strong> di atas.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 4: REKAP HASIL UJIAN MULTI-MAPEL SISWA */}
      {activeTab === 'results_summary' && (
        <StudentResultsRecapView
          students={students}
          exams={exams}
          examSessions={examSessions}
          operatorName={operator.name}
          teachers={teachers}
        />
      )}

      {/* Account Editor Modal (Student) */}
      {editingStudent && (
        <AccountEditorModal
          type="student"
          student={editingStudent === 'new' ? null : editingStudent}
          onSaveStudent={handleSaveStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {/* Account Editor Modal (Teacher) */}
      {editingTeacher && (
        <AccountEditorModal
          type="teacher"
          teacher={editingTeacher === 'new' ? null : editingTeacher}
          onSaveTeacher={handleSaveTeacher}
          onClose={() => setEditingTeacher(null)}
        />
      )}

      {/* In-app Delete & Force Submit Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              {deleteConfirmTarget.type === 'student' && 'Hapus Akun Siswa?'}
              {deleteConfirmTarget.type === 'teacher' && 'Hapus Akun Guru?'}
              {deleteConfirmTarget.type === 'force_submit' && 'Paksa Selesaikan Ujian?'}
              {deleteConfirmTarget.type === 'exam' && 'Hapus Jenis Ujian?'}
              {deleteConfirmTarget.type === 'batch_exams' && 'Hapus Ujian Terpilih?'}
            </h3>

            <p className="text-xs text-slate-600 text-center mt-2 mb-5 leading-relaxed">
              Apakah Anda yakin ingin{' '}
              {deleteConfirmTarget.type === 'force_submit'
                ? 'menyelesaikan secara paksa pengerjaan ujian untuk'
                : 'menghapus'}{' '}
              <strong>{deleteConfirmTarget.name}</strong>?
              {deleteConfirmTarget.subtitle && (
                <span className="block font-mono text-[11px] text-slate-400 mt-1">{deleteConfirmTarget.subtitle}</span>
              )}
              <span className="block text-[11px] text-rose-600 font-semibold mt-2">
                {deleteConfirmTarget.type === 'force_submit'
                  ? 'Lembar jawaban saat ini akan langsung dikumpulkan.'
                  : 'Tindakan ini permanen dan tidak dapat dibatalkan.'}
              </span>
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                {deleteConfirmTarget.type === 'force_submit' ? 'Ya, Selesaikan' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Accounts Modal */}
      {showImportModal && (
        <ImportAccountsModal
          initialMode={importInitialMode}
          existingStudents={students}
          existingTeachers={teachers}
          onImportStudents={(newStudents) => {
            onUpdateStudents(newStudents);
            showNotification(`Berhasil memperbarui data siswa. Total saat ini: ${newStudents.length} siswa terdaftar.`);
          }}
          onImportTeachers={(newTeachers) => {
            onUpdateTeachers(newTeachers);
            showNotification(`Berhasil memperbarui data guru. Total saat ini: ${newTeachers.length} guru terdaftar.`);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Exam Review Modal */}
      {reviewingExam && (
        <ExamReviewModal
          exam={reviewingExam}
          onClose={() => setReviewingExam(null)}
          onPublishExam={() => {
            handleToggleExamStatus(reviewingExam.id, 'published');
          }}
        />
      )}

      {/* Modal Distribusi & Pengaturan Ruang Ujian (Ruang 1 s.d Ruang 30) */}
      {showBulkRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <DoorOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pengaturan Ruang Ujian Massal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penempatan ruang 1 s.d ruang 30 untuk peserta didik ({students.length} Siswa)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkRoomModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Metode Pengaturan */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pilih Metode Penempatan Ruang:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkDistributionMode('by_class')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bulkDistributionMode === 'by_class'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">Berdasarkan Kelas</span>
                    <span className="text-[10px] text-slate-500 font-normal">Satu kelas ke satu ruang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkDistributionMode('auto_distribute')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bulkDistributionMode === 'auto_distribute'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">Bagi Rata Otomatis</span>
                    <span className="text-[10px] text-slate-500 font-normal">Urut Ruang 1 - 30</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkDistributionMode('filter_match')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bulkDistributionMode === 'filter_match'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs">Siswa Terfilter</span>
                    <span className="text-[10px] text-slate-500 font-normal">Hasil filter aktif</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: By Class */}
              {bulkDistributionMode === 'by_class' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pilih Kelas Sasaran
                      </label>
                      <select
                        value={bulkRoomClass}
                        onChange={(e) => setBulkRoomClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="all">Semua Kelas ({students.length} siswa)</option>
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            Kelas {cls} ({students.filter(s => s.className === cls).length} siswa)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ditempatkan di Ruang
                      </label>
                      <select
                        value={bulkTargetRoom}
                        onChange={(e) => setBulkTargetRoom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-indigo-900 font-bold cursor-pointer"
                      >
                        {AVAILABLE_EXAM_ROOMS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Semua siswa pada kelas yang dipilih akan langsung dipindahkan ke <strong>{bulkTargetRoom}</strong>.
                  </p>
                </div>
              )}

              {/* Mode 2: Auto Distribute */}
              {bulkDistributionMode === 'auto_distribute' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kapasitas Maksimal Per Ruangan (Siswa)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={bulkCapacity}
                      onChange={(e) => setBulkCapacity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    Sistem akan membagi total <strong>{students.length} siswa</strong> secara berurutan:
                    <ul className="list-disc pl-4 mt-1 text-slate-500 space-y-0.5">
                      <li>Siswa 1 s/d {Math.min(students.length, bulkCapacity)} → <strong>Ruang 1</strong></li>
                      {students.length > bulkCapacity && (
                        <li>Siswa {bulkCapacity + 1} s/d {Math.min(students.length, bulkCapacity * 2)} → <strong>Ruang 2</strong></li>
                      )}
                      <li>Hingga maksimal <strong>Ruang 30</strong> sesuai ketersediaan ruangan.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Mode 3: Filtered */}
              {bulkDistributionMode === 'filter_match' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ditempatkan di Ruang Ujian
                    </label>
                    <select
                      value={bulkTargetRoom}
                      onChange={(e) => setBulkTargetRoom(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-indigo-900 font-bold cursor-pointer"
                    >
                      {AVAILABLE_EXAM_ROOMS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Akan diterapkan ke seluruh siswa yang sedang sesuai dengan kriteria filter aktif di layar saat ini.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkRoomModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyBulkRoom}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Penempatan Ruang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kontrol Akses Soal per Ruang Ujian (Matikan / Nonaktifkan Soal per Ruang) */}
      {showRoomControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs border border-rose-200">
                  <PowerOff className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Kontrol Akses Soal per Ruang Ujian
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Ruang 1 s.d Ruang 30
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Aksi ini memungkinkan pengawas pusat untuk <strong>mematikan / menonaktifkan tampilan soal</strong> pada ruangan-ruangan tertentu secara langsung. Sesi ujian peserta didik di ruangan tersebut akan dijeda dan jawaban mereka tersimpan aman.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRoomControlModal(false);
                  setSelectedRoomsForBatchToggle([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 border-b border-slate-100 shrink-0 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Ruang Ujian</span>
                <span className="text-base font-bold font-mono text-slate-800">30 Ruangan</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block font-medium">Ruangan Soal Aktif</span>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {30 - currentDisabledRooms.length} Ruangan
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[11px] text-rose-700 block font-medium">Ruangan Soal Dimatikan</span>
                <span className="text-base font-bold font-mono text-rose-800">
                  {currentDisabledRooms.length} Ruangan
                </span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-800 block font-medium">Siswa Terdampak Nonaktif</span>
                <span className="text-base font-bold font-mono text-amber-900">
                  {students.filter(s => currentDisabledRooms.includes(s.room || 'Ruang 1')).length} Siswa
                </span>
              </div>
            </div>

            {/* Toolbar Filters & Batch Operations */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={roomControlSearchQuery}
                    onChange={(e) => setRoomControlSearchQuery(e.target.value)}
                    placeholder="Cari ruang..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 w-40 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <select
                  value={roomFilterStatus}
                  onChange={(e) => setRoomFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">Semua Ruang (30)</option>
                  <option value="with_students">Hanya Ada Siswanya</option>
                  <option value="disabled_only">Hanya yang Dinonaktifkan ({currentDisabledRooms.length})</option>
                  <option value="active_only">Hanya yang Aktif ({30 - currentDisabledRooms.length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedRoomsForBatchToggle.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDisableMultipleRooms(selectedRoomsForBatchToggle)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Matikan ({selectedRoomsForBatchToggle.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnableMultipleRooms(selectedRoomsForBatchToggle)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktifkan ({selectedRoomsForBatchToggle.length})</span>
                    </button>
                  </>
                )}

                {currentDisabledRooms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEnableAllRooms}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Nyalakan Semua Ruang
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mematikan/menonaktifkan akses soal pada SELURUH 30 ruang ujian?')) {
                      handleDisableMultipleRooms(AVAILABLE_EXAM_ROOMS);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  Matikan Semua Ruang
                </button>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              {(() => {
                const displayedRooms = AVAILABLE_EXAM_ROOMS.filter((rm) => {
                  if (roomControlSearchQuery && !rm.toLowerCase().includes(roomControlSearchQuery.toLowerCase())) {
                    return false;
                  }
                  const studentCount = students.filter(s => (s.room || 'Ruang 1') === rm).length;
                  const isDisabled = currentDisabledRooms.includes(rm);

                  if (roomFilterStatus === 'with_students' && studentCount === 0) return false;
                  if (roomFilterStatus === 'disabled_only' && !isDisabled) return false;
                  if (roomFilterStatus === 'active_only' && isDisabled) return false;
                  return true;
                });

                if (displayedRooms.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Tidak ada ruangan yang cocok dengan filter.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedRooms.map((rm) => {
                      const isDisabled = currentDisabledRooms.includes(rm);
                      const assignedStudents = students.filter(s => (s.room || 'Ruang 1') === rm);
                      const workingCount = examSessions.filter(sess => {
                        const st = students.find(s => s.id === sess.studentId || s.nisn === sess.nisn);
                        return (st?.room || 'Ruang 1') === rm && sess.status === 'working';
                      }).length;
                      const isSelected = selectedRoomsForBatchToggle.includes(rm);

                      return (
                        <div
                          key={rm}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isDisabled
                              ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRoomsForBatchToggle(prev => [...prev, rm]);
                                  } else {
                                    setSelectedRoomsForBatchToggle(prev => prev.filter(r => r !== rm));
                                  }
                                }}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                  <DoorOpen className={`w-4 h-4 ${isDisabled ? 'text-rose-600' : 'text-indigo-600'}`} />
                                  <span>{rm}</span>
                                </h4>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {assignedStudents.length} Siswa Terdaftar
                                  {workingCount > 0 && (
                                    <strong className="text-emerald-700 ml-1">({workingCount} Ujian Aktif)</strong>
                                  )}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isDisabled
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isDisabled ? 'Nonaktif' : 'Aktif'}
                            </span>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-500">
                              {isDisabled ? 'Soal dibekukan' : 'Soal dapat diakses'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleRoom(rm)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isDisabled
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                              }`}
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                              <span>{isDisabled ? 'Nyalakan Soal' : 'Matikan Soal'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Perubahan langsung berefek ke layar pengerjaan ujian peserta didik secara instan.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowRoomControlModal(false);
                  setSelectedRoomsForBatchToggle([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KELOLA NONAKTIFKAN SOAL PERORANGAN & MULTI-SISWA */}
      {showStudentControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Kelola Nonaktifkan Soal Peserta Didik (Individu & Multi-Siswa)
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Tanpa Mengganggu Siswa Lain
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Matikan atau aktifkan akses soal untuk seorang siswa tertentu atau beberapa siswa sekaligus. Siswa lain yang berada di ruang yang sama tetap dapat mengerjakan ujian secara normal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowStudentControlModal(false);
                  setSelectedStudentsForBatchAction([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 border-b border-slate-100 shrink-0 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Siswa Terdaftar</span>
                <span className="text-base font-bold font-mono text-slate-800">{students.length} Siswa</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block font-medium">Sedang Ujian Aktif</span>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {examSessions.filter(s => s.status === 'working').length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[11px] text-rose-700 block font-medium">Soal Siswa Dimatikan</span>
                <span className="text-base font-bold font-mono text-rose-800">
                  {currentDisabledStudents.length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-700 block font-medium">Soal Siswa Aktif</span>
                <span className="text-base font-bold font-mono text-blue-800">
                  {students.length - currentDisabledStudents.length} Siswa
                </span>
              </div>
            </div>

            {/* Toolbar Filters & Batch Operations */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={studentControlSearchQuery}
                    onChange={(e) => setStudentControlSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NISN..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 w-48 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <select
                  value={studentControlFilterStatus}
                  onChange={(e) => setStudentControlFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">Semua Status ({students.length})</option>
                  <option value="working_only">Sedang Ujian Saja</option>
                  <option value="disabled_only">Hanya Soal Dimatikan ({currentDisabledStudents.length})</option>
                  <option value="active_only">Hanya Soal Aktif</option>
                </select>

                <select
                  value={studentControlClassFilter}
                  onChange={(e) => setStudentControlClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>

                <select
                  value={studentControlRoomFilter}
                  onChange={(e) => setStudentControlRoomFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 font-semibold cursor-pointer"
                >
                  <option value="all">Semua Ruang</option>
                  {AVAILABLE_EXAM_ROOMS.map(rm => (
                    <option key={rm} value={rm}>{rm}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedStudentsForBatchAction.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleStudentsAction(selectedStudentsForBatchAction, true)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Matikan pengerjaan soal siswa yang diceklis"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Matikan Soal ({selectedStudentsForBatchAction.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleStudentsAction(selectedStudentsForBatchAction, false)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Aktifkan kembali pengerjaan soal siswa yang diceklis"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" />
                      <span>Aktifkan Soal ({selectedStudentsForBatchAction.length})</span>
                    </button>
                  </>
                )}

                {currentDisabledStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEnableAllStudentsAction}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Aktifkan Semua Siswa
                  </button>
                )}
              </div>
            </div>

            {/* Students List Container */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              {(() => {
                const displayedStudents = students.filter((st) => {
                  if (studentControlClassFilter !== 'all' && st.className !== studentControlClassFilter) return false;
                  if (studentControlRoomFilter !== 'all' && (st.room || 'Ruang 1') !== studentControlRoomFilter) return false;
                  
                  const isWorking = examSessions.some(sess => (sess.studentId === st.id || sess.nisn === st.nisn) && sess.status === 'working');
                  const isStudentDisabled = currentDisabledStudents.includes(st.id);

                  if (studentControlFilterStatus === 'working_only' && !isWorking) return false;
                  if (studentControlFilterStatus === 'disabled_only' && !isStudentDisabled) return false;
                  if (studentControlFilterStatus === 'active_only' && isStudentDisabled) return false;

                  if (!studentControlSearchQuery) return true;
                  const q = studentControlSearchQuery.toLowerCase();
                  return (
                    st.name.toLowerCase().includes(q) ||
                    st.nisn.toLowerCase().includes(q) ||
                    st.className.toLowerCase().includes(q) ||
                    (st.room && st.room.toLowerCase().includes(q))
                  );
                });

                if (displayedStudents.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data siswa yang cocok dengan filter.
                    </div>
                  );
                }

                const allDisplayedSelected = displayedStudents.length > 0 && displayedStudents.every(st => selectedStudentsForBatchAction.includes(st.id));

                return (
                  <div className="space-y-3">
                    {/* Select All Checkbox Bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={allDisplayedSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentsForBatchAction(Array.from(new Set([...selectedStudentsForBatchAction, ...displayedStudents.map(s => s.id)])));
                            } else {
                              const displayedIds = new Set(displayedStudents.map(s => s.id));
                              setSelectedStudentsForBatchAction(prev => prev.filter(id => !displayedIds.has(id)));
                            }
                          }}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span>Pilih Semua Siswa yang Ditampilkan ({displayedStudents.length} siswa)</span>
                      </label>
                      <span className="text-slate-500 text-[11px]">
                        {selectedStudentsForBatchAction.length} siswa terpilih
                      </span>
                    </div>

                    {/* Students Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {displayedStudents.map((st) => {
                        const isStudentDisabled = currentDisabledStudents.includes(st.id);
                        const isRoomDisabled = currentDisabledRooms.includes(st.room || 'Ruang 1');
                        const isSelected = selectedStudentsForBatchAction.includes(st.id);
                        const activeSession = examSessions.find(sess => (sess.studentId === st.id || sess.nisn === st.nisn) && sess.status === 'working');

                        return (
                          <div
                            key={st.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isStudentDisabled
                                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentsForBatchAction(prev => [...prev, st.id]);
                                    } else {
                                      setSelectedStudentsForBatchAction(prev => prev.filter(id => id !== st.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                                    {isStudentDisabled && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-600 text-white font-extrabold uppercase">
                                        Soal Mati
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    NISN: <strong className="text-slate-700">{st.nisn}</strong> · {st.className}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px] border border-indigo-200">
                                      {st.room || 'Ruang 1'}
                                    </span>
                                    {activeSession ? (
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Sedang Ujian: {activeSession.examTitle}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Tidak sedang ujian</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                isStudentDisabled
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : isRoomDisabled
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isStudentDisabled ? 'Soal Mati' : isRoomDisabled ? 'Ruang Mati' : 'Soal Aktif'}
                              </span>
                            </div>

                            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                              <span className="text-[11px] text-slate-500">
                                {isStudentDisabled 
                                  ? 'Tampilan soal dibekukan untuk siswa ini' 
                                  : 'Siswa dapat mengerjakan soal secara normal'}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleStudent(st.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isStudentDisabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                                }`}
                              >
                                {isStudentDisabled ? (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" />
                                    <span>Aktifkan Soal</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Matikan Soal</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-500">
                Mematikan soal siswa hanya menangguhkan pengerjaan siswa yang bersangkutan. Peserta didik lain tetap mengerjakan soal secara normal.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowStudentControlModal(false);
                  setSelectedStudentsForBatchAction([]);
                }}
                className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KELOLA NONAKTIFKAN AKUN SISWA PER RUANGAN */}
      {showRoomAccountControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                  <ShieldOff className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      Nonaktifkan / Kelola Akun Siswa di Ruangan Tertentu
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Hanya Siswa Terpilih (Siswa Lain Tidak Terganggu)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Pilih ruangan tertentu, lalu nonaktifkan satu atau beberapa akun siswa yang bermasalah atau memerlukan verifikasi khusus. Akun peserta didik lainnya di ruangan ini maupun di ruangan lain <strong>tetap aktif secara normal dan tidak terpengaruh</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRoomAccountControlModal(false);
                  setSelectedStudentIdsForAccountAction([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Room Selector Tab Bar */}
            <div className="py-3 px-2 border-b border-slate-100 shrink-0 bg-slate-50/70 rounded-xl my-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                  <DoorOpen className="w-4 h-4 text-indigo-600" />
                  <span>Target Ruang Ujian:</span>
                </label>
                <select
                  value={selectedRoomForAccountControl}
                  onChange={(e) => {
                    setSelectedRoomForAccountControl(e.target.value);
                    setSelectedStudentIdsForAccountAction([]);
                  }}
                  className="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-indigo-950 font-bold shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Semua Ruangan (1 - 30)</option>
                  {AVAILABLE_EXAM_ROOMS.map(rm => {
                    const stInRoom = students.filter(s => (s.room || 'Ruang 1') === rm);
                    const disabledInRoom = stInRoom.filter(s => s.isAccountDisabled).length;
                    return (
                      <option key={rm} value={rm}>
                        {rm} ({stInRoom.length} Siswa{disabledInRoom > 0 ? ` · ${disabledInRoom} Nonaktif` : ''})
                      </option>
                    );
                  })}
                </select>

                <div className="flex items-center gap-1 overflow-x-auto max-w-md py-1">
                  {AVAILABLE_EXAM_ROOMS.slice(0, 6).map(rm => {
                    const isActive = selectedRoomForAccountControl === rm;
                    const stInRoom = students.filter(s => (s.room || 'Ruang 1') === rm);
                    const disabledInRoom = stInRoom.filter(s => s.isAccountDisabled).length;
                    return (
                      <button
                        key={rm}
                        type="button"
                        onClick={() => {
                          setSelectedRoomForAccountControl(rm);
                          setSelectedStudentIdsForAccountAction([]);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>{rm}</span>
                        {disabledInRoom > 0 && (
                          <span className={`px-1 rounded-full text-[9px] font-black ${isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'}`}>
                            {disabledInRoom}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Summary in Room */}
              {(() => {
                const roomStudents = selectedRoomForAccountControl === 'all'
                  ? students
                  : students.filter(s => (s.room || 'Ruang 1') === selectedRoomForAccountControl);
                const disabledInSelected = roomStudents.filter(s => s.isAccountDisabled).length;
                const activeInSelected = roomStudents.length - disabledInSelected;

                return (
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]">
                      Total: <strong>{roomStudents.length} Siswa</strong>
                    </span>
                    <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      Aktif: {activeInSelected}
                    </span>
                    {disabledInSelected > 0 && (
                      <span className="px-2 py-1 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-extrabold animate-pulse">
                        Nonaktif: {disabledInSelected}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Filter & Batch Actions Toolbar */}
            <div className="py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={accountControlSearchQuery}
                    onChange={(e) => setAccountControlSearchQuery(e.target.value)}
                    placeholder={`Cari nama, NISN, atau kelas...`}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 w-52 text-xs focus:bg-white"
                  />
                </div>

                <select
                  value={accountControlFilterStatus}
                  onChange={(e) => setAccountControlFilterStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium cursor-pointer"
                >
                  <option value="all">Semua Status Akun</option>
                  <option value="active_only">Hanya Akun Aktif</option>
                  <option value="disabled_only">Hanya Akun Nonaktif</option>
                </select>
              </div>

              {/* Room Specific Batch Operations */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedStudentIdsForAccountAction.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleStudentAccounts(selectedStudentIdsForAccountAction, true, selectedRoomForAccountControl === 'all' ? undefined : selectedRoomForAccountControl)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Nonaktifkan akun siswa terpilih di ruangan ini tanpa mengganggu akun siswa lainnya"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>Nonaktifkan Terpilih ({selectedStudentIdsForAccountAction.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchToggleStudentAccounts(selectedStudentIdsForAccountAction, false, selectedRoomForAccountControl === 'all' ? undefined : selectedRoomForAccountControl)}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Aktifkan kembali akun siswa terpilih"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Aktifkan Terpilih ({selectedStudentIdsForAccountAction.length})</span>
                    </button>
                  </>
                )}

                {selectedRoomForAccountControl !== 'all' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAllStudentsInRoom(selectedRoomForAccountControl, true)}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title={`Nonaktifkan seluruh siswa di ${selectedRoomForAccountControl}`}
                    >
                      <ShieldOff className="w-3 h-3 text-rose-600" />
                      <span>Nonaktifkan Semua di {selectedRoomForAccountControl}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllStudentsInRoom(selectedRoomForAccountControl, false)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title={`Aktifkan seluruh siswa di ${selectedRoomForAccountControl}`}
                    >
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>Aktifkan Semua di {selectedRoomForAccountControl}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Students List in Selected Room */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              {(() => {
                const targetStudents = students.filter((st) => {
                  const studentRoom = st.room || 'Ruang 1';
                  if (selectedRoomForAccountControl !== 'all' && studentRoom !== selectedRoomForAccountControl) {
                    return false;
                  }
                  if (accountControlSearchQuery) {
                    const q = accountControlSearchQuery.toLowerCase();
                    const matchName = st.name.toLowerCase().includes(q);
                    const matchNisn = st.nisn.toLowerCase().includes(q);
                    const matchClass = st.className.toLowerCase().includes(q);
                    if (!matchName && !matchNisn && !matchClass) return false;
                  }
                  if (accountControlFilterStatus === 'active_only' && st.isAccountDisabled) return false;
                  if (accountControlFilterStatus === 'disabled_only' && !st.isAccountDisabled) return false;
                  return true;
                });

                if (targetStudents.length === 0) {
                  return (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada akun siswa yang sesuai kriteria.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedRoomForAccountControl !== 'all'
                          ? `Belum ada siswa yang ditempatkan di ${selectedRoomForAccountControl} atau tidak cocok dengan filter pencarian.`
                          : 'Coba ubah kata kunci pencarian.'}
                      </p>
                    </div>
                  );
                }

                const allTargetIds = targetStudents.map(s => s.id);
                const isAllSelected = targetStudents.length > 0 && allTargetIds.every(id => selectedStudentIdsForAccountAction.includes(id));

                return (
                  <div className="space-y-3">
                    {/* Header Select-All Bar */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIdsForAccountAction(Array.from(new Set([...selectedStudentIdsForAccountAction, ...allTargetIds])));
                            } else {
                              setSelectedStudentIdsForAccountAction(selectedStudentIdsForAccountAction.filter(id => !allTargetIds.includes(id)));
                            }
                          }}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span>Pilih Semua ({targetStudents.length} Siswa di Tampilan Ini)</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {selectedStudentIdsForAccountAction.length} siswa dipilih
                      </span>
                    </div>

                    {/* Student Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {targetStudents.map((st) => {
                        const isAccountDisabled = Boolean(st.isAccountDisabled);
                        const isSelected = selectedStudentIdsForAccountAction.includes(st.id);
                        const activeSession = examSessions.find(sess => (sess.studentId === st.id || sess.nisn === st.nisn) && sess.status === 'working');

                        return (
                          <div
                            key={st.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isAccountDisabled
                                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIdsForAccountAction(prev => [...prev, st.id]);
                                    } else {
                                      setSelectedStudentIdsForAccountAction(prev => prev.filter(id => id !== st.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer mt-0.5"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    NISN: <strong className="text-slate-700">{st.nisn}</strong> · {st.className}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px] border border-indigo-200 flex items-center gap-1">
                                      <DoorOpen className="w-3 h-3" />
                                      {st.room || 'Ruang 1'}
                                    </span>
                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="Token Login Siswa">
                                      {st.token}
                                    </span>
                                  </div>
                                  {activeSession && (
                                    <div className="mt-1">
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Sedang Mengerjakan: {activeSession.examTitle}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                isAccountDisabled
                                  ? 'bg-rose-700 text-white shadow-2xs animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isAccountDisabled ? 'Nonaktif' : 'Aktif'}
                              </span>
                            </div>

                            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                              <span className="text-[11px] text-slate-500">
                                {isAccountDisabled 
                                  ? 'Akun dibekukan / ditolak masuk' 
                                  : 'Akun normal & diizinkan masuk'}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleSingleStudentAccount(st.id, !isAccountDisabled)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isAccountDisabled
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                    : 'bg-rose-700 hover:bg-rose-800 text-white'
                                }`}
                                title={isAccountDisabled ? 'Aktifkan kembali akun siswa ini' : 'Nonaktifkan akun siswa ini (siswa lain tidak terganggu)'}
                              >
                                {isAccountDisabled ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-teal-100" />
                                    <span>Aktifkan Akun</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldOff className="w-3.5 h-3.5 text-rose-200" />
                                    <span>Nonaktifkan Akun</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
              <div className="text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Sistem menjamin hanya akun siswa yang dipilih yang dinonaktifkan. Akun siswa lainnya tetap aktif secara normal.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {disabledStudentAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEnableAllStudentAccounts}
                    className="px-3 py-2 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Aktifkan Semua Akun
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomAccountControlModal(false);
                    setSelectedStudentIdsForAccountAction([]);
                  }}
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PENGATURAN TANGGAL & JAM UJIAN OLEH OPERATOR */}
      {editingScheduleExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan Jadwal Tanggal & Jam Ujian
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                    {editingScheduleExam.title} ({editingScheduleExam.subject})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingScheduleExam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Toggle Enable Schedule */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scheduleModalEnabled}
                  onChange={(e) => setScheduleModalEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Batasi Waktu Akses dengan Jadwal Tanggal & Jam
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {scheduleModalEnabled
                      ? 'Siswa hanya dapat login dan mengerjakan soal di antara waktu mulai dan berakhir.'
                      : 'Bebas akses (siswa dapat masuk kapan saja selama status ujian Dibuka/Aktif).'}
                  </span>
                </div>
              </label>
            </div>

            {scheduleModalEnabled ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tanggal & Jam Mulai */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tanggal & Jam Mulai</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setScheduleModalStart(toDateTimeLocalString(new Date()))}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        Set Sekarang
                      </button>
                    </div>

                    <input
                      type="datetime-local"
                      value={scheduleModalStart}
                      onChange={(e) => setScheduleModalStart(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {scheduleModalStart ? (
                        <span className="text-slate-700">Mulai: {formatExamDateTime(scheduleModalStart)}</span>
                      ) : (
                        <span className="text-amber-600">Belum disetel</span>
                      )}
                    </div>
                  </div>

                  {/* Tanggal & Jam Berakhir */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarX className="w-3.5 h-3.5 text-rose-600" />
                        <span>Tanggal & Jam Berakhir</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const base = scheduleModalStart ? new Date(scheduleModalStart) : new Date();
                            setScheduleModalEnd(toDateTimeLocalString(new Date(base.getTime() + 15 * 60 * 1000)));
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="+15 Menit"
                        >
                          +15m
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const base = scheduleModalStart ? new Date(scheduleModalStart) : new Date();
                            setScheduleModalEnd(toDateTimeLocalString(new Date(base.getTime() + 30 * 60 * 1000)));
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="+30 Menit"
                        >
                          +30m
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const base = scheduleModalStart ? new Date(scheduleModalStart) : new Date();
                            setScheduleModalEnd(toDateTimeLocalString(new Date(base.getTime() + 60 * 60 * 1000)));
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="+1 Jam"
                        >
                          +1j
                        </button>
                      </div>
                    </div>

                    <input
                      type="datetime-local"
                      value={scheduleModalEnd}
                      onChange={(e) => setScheduleModalEnd(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {scheduleModalEnd ? (
                        <span className="text-slate-700">Berakhir: {formatExamDateTime(scheduleModalEnd)}</span>
                      ) : (
                        <span className="text-amber-600">Belum disetel</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset Cepat */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Preset Waktu:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setScheduleModalStart(toDateTimeLocalString(now));
                      setScheduleModalEnd(toDateTimeLocalString(new Date(now.getTime() + 2 * 3600 * 1000)));
                    }}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Sekarang s.d +2 Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30);
                      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0);
                      setScheduleModalStart(toDateTimeLocalString(start));
                      setScheduleModalEnd(toDateTimeLocalString(end));
                    }}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Hari Ini (07:30 - 10:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30);
                      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0);
                      setScheduleModalStart(toDateTimeLocalString(start));
                      setScheduleModalEnd(toDateTimeLocalString(end));
                    }}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
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
                      setScheduleModalStart(toDateTimeLocalString(start));
                      setScheduleModalEnd(toDateTimeLocalString(end));
                    }}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Besok Pagi (08:00 - 11:00)
                  </button>
                </div>

                {/* Status Evaluation */}
                {(() => {
                  const isInvalid =
                    Boolean(scheduleModalStart && scheduleModalEnd) &&
                    new Date(scheduleModalEnd).getTime() <= new Date(scheduleModalStart).getTime();
                  const durationStr = calculateScheduleDuration(scheduleModalStart, scheduleModalEnd);
                  const previewStatus = getExamScheduleStatus({
                    enableSchedule: scheduleModalEnabled,
                    startDate: scheduleModalStart,
                    endDate: scheduleModalEnd,
                    title: editingScheduleExam.title,
                  });

                  if (isInvalid) {
                    return (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2 text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Tanggal & jam berakhir harus lebih lambat dari tanggal & jam mulai!</span>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Jendela Akses: <strong className="text-slate-900">{durationStr}</strong></span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${previewStatus.badgeBg} ${previewStatus.badgeText} ${previewStatus.badgeBorder}`}>
                        {previewStatus.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Ujian akan disetel ke <strong>Bebas Akses</strong>. Siswa dapat login kapan saja selama status sesi Terbuka.
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingScheduleExam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveExamSchedule}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengaturan Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Master Operator */}
      <EditOperatorModal
        isOpen={showEditOperatorModal}
        operator={operator}
        onClose={() => setShowEditOperatorModal(false)}
        onSave={handleSaveOperator}
      />

      {/* Modal Cetak Kartu Peserta Ujian */}
      <ExamCardsModal
        isOpen={showExamCardsModal}
        onClose={() => {
          setShowExamCardsModal(false);
          setExamCardInitialStudentId(undefined);
        }}
        students={students}
        operatorName={operator.name}
        initialSelectedStudentId={examCardInitialStudentId}
      />
    </div>
  );
};
