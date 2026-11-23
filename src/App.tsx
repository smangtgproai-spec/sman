/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Navbar 
} from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentLogin } from './components/student/StudentLogin';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ExamRoom } from './components/student/ExamRoom';
import { ExamResultView } from './components/student/ExamResultView';
import { TeacherLogin } from './components/teacher/TeacherLogin';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { OperatorActivationModal } from './components/operator/OperatorActivationModal';
import { Lock, KeyRound } from 'lucide-react';

import { 
  Student, 
  Teacher, 
  Operator, 
  Exam, 
  ExamSession, 
  ViolationRecord 
} from './types/exam';

import { 
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_OPERATOR, 
  INITIAL_EXAMS 
} from './data/initialData';

export default function App() {
  // Navigation Role
  const [currentRole, setCurrentRole] = useState<UserRole>('landing');

  // Operator Activation State (@10901018#777#)
  const [isOperatorAuthenticated, setIsOperatorAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('edusecure_operator_auth_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [showOperatorAuthModal, setShowOperatorAuthModal] = useState<boolean>(false);

  const handleRequestOperatorRole = () => {
    if (isOperatorAuthenticated) {
      setCurrentRole('operator');
    } else {
      setShowOperatorAuthModal(true);
    }
  };

  const handleOperatorAuthSuccess = () => {
    setIsOperatorAuthenticated(true);
    try {
      sessionStorage.setItem('edusecure_operator_auth_v1', 'true');
    } catch {}
    setShowOperatorAuthModal(false);
    setCurrentRole('operator');
  };

  const handleLockOperator = () => {
    setIsOperatorAuthenticated(false);
    try {
      sessionStorage.removeItem('edusecure_operator_auth_v1');
    } catch {}
    setCurrentRole('landing');
  };

  // One-time cleanup of old initial sample data keys
  useEffect(() => {
    try {
      localStorage.removeItem('edusecure_students');
      localStorage.removeItem('edusecure_teachers');
      localStorage.removeItem('edusecure_sessions');
    } catch {}
  }, []);

  // Core Data Stores with LocalStorage caching
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_students_v3');
      const loaded: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      return loaded.map((st, i) => ({
        ...st,
        token: st.token || `SISWA-${1000 + (i * 123) % 8999}`,
      }));
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_teachers_v3');
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [operator, setOperator] = useState<Operator>(() => {
    try {
      const saved = localStorage.getItem('smangt_operator_v1');
      return saved ? JSON.parse(saved) : INITIAL_OPERATOR;
    } catch {
      return INITIAL_OPERATOR;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smangt_operator_v1', JSON.stringify(operator));
    } catch {}
  }, [operator]);

  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_exams_v3');
      return saved ? JSON.parse(saved) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  });

  // Empty sessions initially
  const [examSessions, setExamSessions] = useState<ExamSession[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_sessions_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('edusecure_students_v3', JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('edusecure_teachers_v3', JSON.stringify(teachers));
    } catch {}
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem('edusecure_exams_v3', JSON.stringify(exams));
    } catch {}
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem('edusecure_sessions_v3', JSON.stringify(examSessions));
    } catch {}
  }, [examSessions]);

  // List of rooms where questions/exams are disabled: e.g. ['Ruang 3']
  const [disabledRooms, setDisabledRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_disabled_rooms_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('edusecure_disabled_rooms_v3', JSON.stringify(disabledRooms));
    } catch {}
  }, [disabledRooms]);

  const handleToggleRoomStatus = (roomName: string) => {
    setDisabledRooms(prev => {
      if (prev.includes(roomName)) {
        return prev.filter(r => r !== roomName);
      } else {
        return [...prev, roomName];
      }
    });
  };

  const handleUpdateDisabledRooms = (rooms: string[]) => {
    setDisabledRooms(rooms);
  };

  // List of specific students whose questions are disabled: e.g. ['student-1', 'student-3']
  const [disabledStudentIds, setDisabledStudentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edusecure_disabled_students_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('edusecure_disabled_students_v3', JSON.stringify(disabledStudentIds));
    } catch {}
  }, [disabledStudentIds]);

  const handleToggleStudentStatus = (studentId: string) => {
    setDisabledStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleBatchToggleStudents = (studentIds: string[], shouldDisable: boolean) => {
    setDisabledStudentIds(prev => {
      if (shouldDisable) {
        return Array.from(new Set([...prev, ...studentIds]));
      } else {
        return prev.filter(id => !studentIds.includes(id));
      }
    });
  };

  const handleEnableAllStudents = () => {
    setDisabledStudentIds([]);
  };

  // Student Flow Active State
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeStudentExam, setActiveStudentExam] = useState<Exam | null>(null);
  const [isInExamRoom, setIsInExamRoom] = useState<boolean>(false);
  const [submittedSessionResult, setSubmittedSessionResult] = useState<ExamSession | null>(null);

  // Teacher Flow Active State
  const [authenticatedTeacher, setAuthenticatedTeacher] = useState<Teacher | null>(null);
  const [isOperatorImpersonatingTeacher, setIsOperatorImpersonatingTeacher] = useState<boolean>(false);

  // Student Login Handler
  const handleStudentLoginSuccess = (student: Student, exam: Exam) => {
    setActiveStudent(student);
    setActiveStudentExam(exam);
    // Check if there is an active session
    const existing = examSessions.find(s => s.studentId === student.id && s.examId === exam.id && s.status === 'working');
    if (existing) {
      setIsInExamRoom(true);
    }
  };

  // Student Starts Exam Handler
  const handleStudentStartExam = (exam: Exam) => {
    if (!activeStudent) return;

    // Guard: 1x Attempt check
    const isAlreadyCompleted = 
      Boolean(activeStudent.completedExamIds?.includes(exam.id)) ||
      examSessions.some(
        s => (s.studentId === activeStudent.id || s.nisn === activeStudent.nisn) &&
             s.examId === exam.id &&
             s.status !== 'working'
      );
    if (isAlreadyCompleted) return;

    setIsInExamRoom(true);

    // Update student status to 'working'
    setStudents(prev => prev.map(s => s.id === activeStudent.id ? { ...s, status: 'working' } : s));

    // Ensure session entry exists in examSessions for operator to monitor
    setExamSessions(prev => {
      const exists = prev.find(s => s.studentId === activeStudent.id && s.examId === exam.id && s.status === 'working');
      if (exists) return prev;

      const newSession: ExamSession = {
        id: `sess-${activeStudent.id}-${exam.id}-${Date.now()}`,
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        nisn: activeStudent.nisn,
        className: activeStudent.className,
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject,
        startTime: Date.now(),
        durationMinutes: exam.durationMinutes,
        remainingSeconds: exam.durationMinutes * 60,
        answers: {},
        status: 'working',
        violations: [],
        currentQuestionIndex: 0,
        totalAnswered: 0,
      };
      return [newSession, ...prev];
    });
  };

  // Student Submits Exam Handler (Manual or Automatic)
  const handleStudentSubmitExam = (finishedSession: ExamSession) => {
    setIsInExamRoom(false);
    setSubmittedSessionResult(finishedSession);

    // Update global sessions
    setExamSessions(prev => {
      const idx = prev.findIndex(s => s.studentId === finishedSession.studentId && s.examId === finishedSession.examId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = finishedSession;
        return next;
      }
      return [finishedSession, ...prev];
    });

    // Update student status to finished or blocked, and record completedExamIds (1x attempt rule)
    if (activeStudent) {
      const isBlocked = finishedSession.status === 'blocked' || (finishedSession.violations && finishedSession.violations.length >= 3);
      const updatedCompleted = Array.from(new Set([...(activeStudent.completedExamIds || []), finishedSession.examId]));
      
      const updatedStudent: Student = {
        ...activeStudent,
        status: isBlocked ? 'blocked' : 'finished',
        isLockedOut: isBlocked ? true : activeStudent.isLockedOut,
        lockoutReason: isBlocked ? 'Melebihi batas toleransi pelanggaran sistem keamanan (3x). Lembar jawaban telah dikumpulkan otomatis oleh sistem.' : activeStudent.lockoutReason,
        completedExamIds: updatedCompleted,
      };

      setActiveStudent(updatedStudent);
      setStudents(prev => prev.map(s => s.id === activeStudent.id ? updatedStudent : s));
    }
  };

  // Violation occurred during exam
  const handleViolationOccurred = (violation: ViolationRecord) => {
    if (!activeStudent || !activeStudentExam) return;

    // Sync to operator live monitor
    let isBlocked = false;
    setExamSessions(prev =>
      prev.map(s => {
        if (s.studentId === activeStudent.id && s.examId === activeStudentExam.id) {
          const updatedViolations = [violation, ...s.violations];
          if (updatedViolations.length >= 3) {
            isBlocked = true;
          }
          return {
            ...s,
            violations: updatedViolations,
            status: updatedViolations.length >= 3 ? 'blocked' : s.status,
          };
        }
        return s;
      })
    );

    // If max violations reached, block student
    setStudents(prev =>
      prev.map(s => {
        if (s.id === activeStudent.id) {
          const currentSess = examSessions.find(sess => sess.studentId === activeStudent.id && sess.examId === activeStudentExam.id);
          const totalViolations = (currentSess?.violations.length || 0) + 1;
          if (totalViolations >= 3) {
            return { 
              ...s, 
              status: 'blocked',
              isLockedOut: true,
              lockoutReason: 'Melebihi batas toleransi pelanggaran sistem integritas (3x)',
            };
          }
        }
        return s;
      })
    );
  };

  // Logout / Back handlers
  const handleBackToPortal = () => {
    setIsInExamRoom(false);
    setSubmittedSessionResult(null);
    setActiveStudent(null);
    setActiveStudentExam(null);
    setAuthenticatedTeacher(null);
    setIsOperatorImpersonatingTeacher(false);
    setCurrentRole('landing');
  };

  // Get active username for top bar
  const getActiveUserName = () => {
    if (currentRole === 'student' && activeStudent) {
      return activeStudent.name;
    }
    if (currentRole === 'teacher' && authenticatedTeacher) {
      return isOperatorImpersonatingTeacher 
        ? `${authenticatedTeacher.name} (Akses Operator)` 
        : authenticatedTeacher.name;
    }
    if (currentRole === 'operator') {
      return operator.name;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={(role) => {
          if (isInExamRoom) return; // Prevent navigation away when exam is in progress
          if (role === 'operator') {
            handleRequestOperatorRole();
            return;
          }
          setCurrentRole(role);
          if (role !== 'student') {
            setIsInExamRoom(false);
            setSubmittedSessionResult(null);
          }
          if (role !== 'teacher') {
            // Keep or reset teacher session when navigating away
            setAuthenticatedTeacher(null);
            setIsOperatorImpersonatingTeacher(false);
          }
        }}
        activeUserName={getActiveUserName()}
        activeExamActive={isInExamRoom}
        isOperatorAuthenticated={isOperatorAuthenticated}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {/* 1. LANDING PORTAL */}
        {currentRole === 'landing' && (
          <LandingPage
            onNavigate={(role) => {
              if (role === 'operator') {
                handleRequestOperatorRole();
              } else {
                setCurrentRole(role);
              }
            }}
            activeExamsCount={exams.filter(e => e.status === 'published').length}
            totalStudents={students.length}
          />
        )}

        {/* 2. STUDENT (LAMAN UJIAN) FLOW */}
        {currentRole === 'student' && (
          <>
            {/* View Result Certificate */}
            {submittedSessionResult && activeStudentExam ? (
              <ExamResultView
                session={submittedSessionResult}
                exam={activeStudentExam}
                onBackToPortal={handleBackToPortal}
              />
            ) : isInExamRoom && activeStudent && activeStudentExam ? (
              /* Active Locked Exam Room */
              <ExamRoom
                exam={activeStudentExam}
                student={students.find(s => s.id === activeStudent.id) || activeStudent}
                existingSession={examSessions.find(
                  s => s.studentId === activeStudent.id && s.examId === activeStudentExam.id
                )}
                isRoomDisabled={disabledRooms.includes((students.find(s => s.id === activeStudent.id) || activeStudent).room || 'Ruang 1')}
                isStudentDisabled={disabledStudentIds.includes(activeStudent.id)}
                isAccountDisabled={Boolean(
                  (students.find(s => s.id === activeStudent.id) || activeStudent).isAccountDisabled
                )}
                onSubmitExam={handleStudentSubmitExam}
                onViolationOccurred={handleViolationOccurred}
              />
            ) : activeStudent && activeStudentExam ? (
              /* Student Dashboard */
              <StudentDashboard
                student={students.find(s => s.id === activeStudent.id) || activeStudent}
                activeExam={activeStudentExam}
                isRoomDisabled={disabledRooms.includes((students.find(s => s.id === activeStudent.id) || activeStudent).room || 'Ruang 1')}
                isStudentDisabled={disabledStudentIds.includes(activeStudent.id)}
                isExamCompleted={Boolean(
                  activeStudent.completedExamIds?.includes(activeStudentExam.id) ||
                  examSessions.some(
                    s => (s.studentId === activeStudent.id || s.nisn === activeStudent.nisn) &&
                         s.examId === activeStudentExam.id &&
                         s.status !== 'working'
                  )
                )}
                completedSession={examSessions.find(
                  s => (s.studentId === activeStudent.id || s.nisn === activeStudent.nisn) &&
                       s.examId === activeStudentExam.id
                )}
                onStartExam={handleStudentStartExam}
                onLogoutStudent={() => {
                  setActiveStudent(null);
                  setActiveStudentExam(null);
                }}
              />
            ) : (
              /* Student Login Form */
              <StudentLogin
                students={students}
                exams={exams}
                examSessions={examSessions}
                onLoginSuccess={handleStudentLoginSuccess}
                onBackToPortal={handleBackToPortal}
              />
            )}
          </>
        )}

        {/* 3. TEACHER (LAMAN GURU) FLOW */}
        {currentRole === 'teacher' && (
          authenticatedTeacher ? (
            <TeacherDashboard
              currentTeacher={authenticatedTeacher}
              exams={exams}
              examSessions={examSessions}
              onUpdateExams={(updated) => setExams(updated)}
              onLogoutTeacher={() => {
                setAuthenticatedTeacher(null);
                if (isOperatorImpersonatingTeacher) {
                  setIsOperatorImpersonatingTeacher(false);
                  setCurrentRole('operator');
                }
              }}
              onBackToPortal={handleBackToPortal}
              isOperatorMode={isOperatorImpersonatingTeacher}
              onReturnToOperator={() => {
                setAuthenticatedTeacher(null);
                setIsOperatorImpersonatingTeacher(false);
                setCurrentRole('operator');
              }}
            />
          ) : (
            <TeacherLogin
              teachers={teachers}
              onLoginSuccess={(teacher) => {
                setAuthenticatedTeacher(teacher);
                setIsOperatorImpersonatingTeacher(false);
              }}
              onBackToPortal={handleBackToPortal}
            />
          )
        )}

        {/* 4. MASTER OPERATOR DASHBOARD */}
        {currentRole === 'operator' && (
          isOperatorAuthenticated ? (
            <OperatorDashboard
              operator={operator}
              students={students}
              teachers={teachers}
              exams={exams}
              examSessions={examSessions}
              disabledRooms={disabledRooms}
              onToggleRoomStatus={handleToggleRoomStatus}
              onUpdateDisabledRooms={handleUpdateDisabledRooms}
              disabledStudentIds={disabledStudentIds}
              onToggleStudentStatus={handleToggleStudentStatus}
              onBatchToggleStudents={handleBatchToggleStudents}
              onEnableAllStudents={handleEnableAllStudents}
              onUpdateStudents={(updated) => setStudents(updated)}
              onUpdateTeachers={(updated) => setTeachers(updated)}
              onUpdateExams={(updated) => setExams(updated)}
              onUpdateSessions={(updated) => setExamSessions(updated)}
              onBackToPortal={handleBackToPortal}
              onEnterTeacherPortal={(teacher) => {
                setAuthenticatedTeacher(teacher);
                setIsOperatorImpersonatingTeacher(true);
                setCurrentRole('teacher');
              }}
              onLockOperator={handleLockOperator}
              onUpdateOperator={(updated) => setOperator(updated)}
            />
          ) : (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl text-white space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-white">Laman Operator Terkunci</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Akses ke Pusat Kendali Operator memerlukan kode aktivasi keamanan resmi untuk otorisasi sistem.
                </p>
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={() => setShowOperatorAuthModal(true)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Masukkan Kode Aktivasi Operator</span>
                  </button>
                  <button
                    onClick={handleBackToPortal}
                    className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Kembali ke Portal Utama
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Operator Activation Security Modal */}
      <OperatorActivationModal
        isOpen={showOperatorAuthModal}
        onClose={() => {
          setShowOperatorAuthModal(false);
          if (currentRole === 'operator' && !isOperatorAuthenticated) {
            setCurrentRole('landing');
          }
        }}
        onSuccess={handleOperatorAuthSuccess}
      />
    </div>
  );
}
