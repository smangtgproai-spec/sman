/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Exam, 
  Student, 
  Question, 
  ViolationRecord, 
  StudentAnswerPayload, 
  ExamSession 
} from '../../types/exam';
import { 
  setupExamSecurityListeners, 
  enterExamFullscreen, 
  isFullscreenActive 
} from '../../utils/security';
import { 
  ShieldAlert, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle, 
  AlertCircle, 
  ZoomIn, 
  X, 
  CheckSquare, 
  HelpCircle,
  Maximize2,
  PowerOff,
  BellRing,
  UserX,
  LayoutGrid
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import { formatExamDateTimeShort } from '../../utils/examSchedule';

interface ExamRoomProps {
  exam: Exam;
  student: Student;
  existingSession?: ExamSession;
  isRoomDisabled?: boolean;
  isStudentDisabled?: boolean;
  isAccountDisabled?: boolean;
  onSubmitExam: (session: ExamSession) => void;
  onViolationOccurred: (record: ViolationRecord) => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  student,
  existingSession,
  isRoomDisabled = false,
  isStudentDisabled = false,
  isAccountDisabled = false,
  onSubmitExam,
  onViolationOccurred,
}) => {
  // Current question index
  const [currentIndex, setCurrentIndex] = useState<number>(existingSession?.currentQuestionIndex || 0);

  // Answers map: questionId -> StudentAnswerPayload
  const [answers, setAnswers] = useState<Record<string, StudentAnswerPayload>>(
    existingSession?.answers || {}
  );

  // Time remaining in seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    existingSession?.remainingSeconds ?? exam.durationMinutes * 60
  );

  // Violations list
  const [violations, setViolations] = useState<ViolationRecord[]>(
    existingSession?.violations || []
  );

  // Refs to guarantee freshest values during auto-submit intervals & event listeners
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const violationsRef = useRef(violations);
  violationsRef.current = violations;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const remainingSecondsRef = useRef(remainingSeconds);
  remainingSecondsRef.current = remainingSeconds;

  const hasSubmittedRef = useRef(false);

  // Modals
  const [activeViolationModal, setActiveViolationModal] = useState<ViolationRecord | null>(null);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isExamLockedDueToViolations, setIsExamLockedDueToViolations] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  // 5 Minutes Remaining Warning State
  const [hasShownFiveMinWarning, setHasShownFiveMinWarning] = useState<boolean>(false);
  const [showFiveMinuteModal, setShowFiveMinuteModal] = useState<boolean>(false);

  // Timestamp for dynamic watermark
  const [watermarkTime, setWatermarkTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));

  // Deterministic seeded shuffle based on student.id and exam.id
  const questions = useMemo(() => {
    // Hash function to generate stable seed per student and exam
    const seedStr = `${student.id}-${exam.id}`;
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
    }

    const pseudoRandom = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 4294967296;
    };

    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    let list = [...(exam.questions || [])];
    if (exam.randomizeQuestions) {
      list = shuffleArray(list);
    }

    return list.map(q => {
      // 1. Acak pilihan ganda (PG)
      if (q.type === 'pg' && q.options && (exam.randomizeOptionsPG || exam.randomizeOptions)) {
        const shuffled = shuffleArray(q.options);
        const standardLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const relabeled = shuffled.map((opt, oIdx) => ({
          ...opt,
          label: standardLabels[oIdx] || opt.label,
        }));
        return { ...q, options: relabeled };
      }

      // 2. Acak pilihan ganda kompleks (MCMA)
      if (q.type === 'mcma' && q.options && (exam.randomizeOptionsMCMA || exam.randomizeOptions)) {
        const shuffled = shuffleArray(q.options);
        const standardLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const relabeled = shuffled.map((opt, oIdx) => ({
          ...opt,
          label: standardLabels[oIdx] || opt.label,
        }));
        return { ...q, options: relabeled };
      }

      // 3. Acak baris pernyataan pada soal tabel benar/salah
      if (q.type === 'true_false_matrix' && q.matrixStatements && exam.randomizeStatementsMatrix) {
        const shuffled = shuffleArray(q.matrixStatements);
        return { ...q, matrixStatements: shuffled };
      }

      return q;
    });
  }, [exam, student.id]);

  const currentQuestion: Question | undefined = questions[currentIndex];
  const maxViolationsAllowed = 3;

  // Update watermark every 3 seconds
  useEffect(() => {
    const wmInterval = setInterval(() => {
      setWatermarkTime(new Date().toLocaleTimeString('id-ID'));
    }, 3000);
    return () => clearInterval(wmInterval);
  }, []);

  const isAccountDeactivated = Boolean(student.isAccountDisabled || isAccountDisabled);
  const isQuestionFrozen = isRoomDisabled || isStudentDisabled || isAccountDeactivated;

  // Timer countdown: auto-submit when remainingSeconds reaches 0
  useEffect(() => {
    if (isExamLockedDueToViolations || isQuestionFrozen) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Waktu Ujian Telah Habis - Jawaban otomatis dikumpulkan oleh sistem', 'force_submitted');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamLockedDueToViolations, isQuestionFrozen]);

  // Automatic 5-minute remaining warning popup trigger
  useEffect(() => {
    if (!hasShownFiveMinWarning && remainingSeconds <= 300 && remainingSeconds > 0) {
      setHasShownFiveMinWarning(true);
      setShowFiveMinuteModal(true);
    }
  }, [remainingSeconds, hasShownFiveMinWarning]);

  // Security listeners registration: auto-submit immediately on 3rd violation
  useEffect(() => {
    const cleanup = setupExamSecurityListeners({
      active: !isExamLockedDueToViolations,
      onViolation: (record) => {
        const nextViolations = [record, ...violationsRef.current];
        violationsRef.current = nextViolations;
        setViolations(nextViolations);
        onViolationOccurred(record);

        if (nextViolations.length >= maxViolationsAllowed) {
          setIsExamLockedDueToViolations(true);
          setActiveViolationModal(null);
          // 3x Pelanggaran: Langsung kumpulkan & kirim seluruh jawaban otomatis ke server CBT
          handleAutoSubmit(
            'Pelanggaran berulang keamanan integritas ujian (3x pelanggaran) - Lembar jawaban otomatis dikumpulkan oleh sistem',
            'blocked',
            nextViolations
          );
        } else {
          setActiveViolationModal(record);
        }
      },
      onFullscreenExit: () => {
        // Handled in onViolation
      },
      onSplitScreenDetected: () => {
        // Handled in onViolation
      },
    });

    return () => {
      cleanup();
    };
  }, [isExamLockedDueToViolations]);

  // Answer handler for PG (single choice)
  const handleSelectOptionPG = (optionId: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || { isDoubtful: false };
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        value: optionId,
        isDoubtful: current.isDoubtful,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  // Answer handler for MCMA (multiple choices)
  const handleToggleOptionMCMA = (optionId: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || { value: [], isDoubtful: false };
    const currentValues: string[] = Array.isArray(current.value) ? [...current.value] : [];
    
    let newValues: string[];
    if (currentValues.includes(optionId)) {
      newValues = currentValues.filter((v) => v !== optionId);
    } else {
      newValues = [...currentValues, optionId];
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        value: newValues,
        isDoubtful: current.isDoubtful,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  // Answer handler for True/False Table with 4 statements
  const handleMatrixSelect = (statementId: string, isTrue: boolean) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || { value: {}, isDoubtful: false };
    const currentMap = typeof current.value === 'object' && current.value !== null && !Array.isArray(current.value)
      ? { ...current.value }
      : {};

    currentMap[statementId] = isTrue;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        value: currentMap,
        isDoubtful: current.isDoubtful,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  // Toggle doubtful flag
  const handleToggleDoubtful = () => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id] || { value: null, isDoubtful: false };
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...current,
        isDoubtful: !current.isDoubtful,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  // Check question status for navigation palette
  const getQuestionStatus = (q: Question) => {
    const ans = answers[q.id];
    if (!ans || ans.value === undefined || ans.value === null) {
      return ans?.isDoubtful ? 'doubtful' : 'unanswered';
    }

    if (q.type === 'pg' && ans.value !== '') {
      return ans.isDoubtful ? 'doubtful' : 'answered';
    }

    if (q.type === 'mcma' && Array.isArray(ans.value) && ans.value.length > 0) {
      return ans.isDoubtful ? 'doubtful' : 'answered';
    }

    if (q.type === 'true_false_matrix' && typeof ans.value === 'object') {
      const keys = Object.keys(ans.value);
      if (keys.length > 0) {
        return ans.isDoubtful ? 'doubtful' : 'answered';
      }
    }

    return ans.isDoubtful ? 'doubtful' : 'unanswered';
  };

  // Compute final score using freshest answers and violations refs
  const calculateFinalSession = (
    finalStatus: 'submitted' | 'force_submitted' | 'blocked',
    customViolations?: ViolationRecord[],
    submissionReason?: string
  ): ExamSession => {
    const currentAnswers = answersRef.current;
    const currentViolations = customViolations || violationsRef.current;
    let earnedScore = 0;
    let maxScore = 0;
    let totalAnswered = 0;

    questions.forEach((q) => {
      maxScore += q.score;
      const ans = currentAnswers[q.id];
      if (!ans || ans.value === undefined || ans.value === null) return;

      if (q.type === 'pg') {
        if (ans.value) totalAnswered++;
        if (q.correctOptions && q.correctOptions[0] === ans.value) {
          earnedScore += q.score;
        }
      } else if (q.type === 'mcma') {
        const valArr = Array.isArray(ans.value) ? ans.value : [];
        if (valArr.length > 0) totalAnswered++;
        // Exact match scoring or partial
        const correctSet = new Set(q.correctOptions || []);
        const userSet = new Set(valArr);
        if (correctSet.size > 0 && correctSet.size === userSet.size && [...userSet].every((x) => correctSet.has(x))) {
          earnedScore += q.score;
        }
      } else if (q.type === 'true_false_matrix' && q.matrixStatements) {
        const userMap = ans.value || {};
        if (Object.keys(userMap).length > 0) totalAnswered++;
        // Proportionate score for 4 statements (each statement 25% of question score)
        let correctCount = 0;
        q.matrixStatements.forEach((st) => {
          if (userMap[st.id] === st.correctValue) {
            correctCount++;
          }
        });
        earnedScore += Math.round((correctCount / q.matrixStatements.length) * q.score);
      }
    });

    return {
      id: existingSession?.id || `sess-${student.id}-${exam.id}`,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      className: student.className,
      examId: exam.id,
      examTitle: exam.title,
      subject: exam.subject,
      startTime: existingSession?.startTime || Date.now(),
      endTime: Date.now(),
      durationMinutes: exam.durationMinutes,
      remainingSeconds: remainingSecondsRef.current,
      answers: currentAnswers,
      status: finalStatus,
      violations: currentViolations,
      currentQuestionIndex: currentIndexRef.current,
      score: earnedScore,
      maxScore,
      totalAnswered,
      deviceInfo: `${navigator.userAgent.slice(0, 40)}...`,
    };
  };

  const handleManualSubmit = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    const session = calculateFinalSession('submitted');
    onSubmitExam(session);
  };

  const handleAutoSubmit = (
    reason: string,
    forcedStatus: 'submitted' | 'force_submitted' | 'blocked' = 'force_submitted',
    customViolations?: ViolationRecord[]
  ) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    const session = calculateFinalSession(forcedStatus, customViolations, reason);
    onSubmitExam(session);
  };

  // Re-enter fullscreen when resolving violation modal
  const handleResolveViolationModal = async () => {
    setActiveViolationModal(null);
    if (!isFullscreenActive()) {
      await enterExamFullscreen();
    }
  };

  // Format time MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalAnsweredCount = questions.filter((q) => getQuestionStatus(q) === 'answered').length;
  const totalDoubtfulCount = questions.filter((q) => getQuestionStatus(q) === 'doubtful').length;
  const totalUnansweredCount = questions.length - totalAnsweredCount - totalDoubtfulCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col exam-secure-mode select-none relative overflow-hidden">
      {/* Dynamic Watermark Overlay to prevent physical camera & screenshot piracy */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.045] flex flex-wrap content-between justify-between p-8 font-mono text-xs select-none rotate-[-12deg] overflow-hidden"
        aria-hidden="true"
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="p-4 tracking-wider text-slate-900 font-bold whitespace-nowrap">
            SmanGt CBT · {student.name} · {student.nisn} · {watermarkTime} · IP: 192.168.1.{10 + (i % 80)}
          </div>
        ))}
      </div>

      {/* Header CBT Bar */}
      <div className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between shrink-0 z-20 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt" 
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain hidden sm:block shrink-0" 
          />
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
            {currentIndex + 1}
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-md">
              {exam.title}
            </h1>
            <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate">
              <span className="truncate">{student.name}</span>
              <span>·</span>
              <span className="shrink-0">{student.className}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Batas Akhir Jadwal Ujian (Desktop/Tablet) */}
          {exam.enableSchedule !== false && exam.endDate && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700" title={`Batas akhir pelaksanaan ujian: ${exam.endDate}`}>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Batas Jadwal: <strong className="text-white font-mono">{formatExamDateTimeShort(exam.endDate)}</strong></span>
            </div>
          )}

          {/* Violations Strike Indicator */}
          <div className={`px-2 py-1 rounded text-[11px] sm:text-xs font-semibold flex items-center gap-1 ${
            violations.length === 0 
              ? 'bg-slate-800 text-emerald-400' 
              : violations.length === 1 
              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
              : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`} title={`Pelanggaran: ${violations.length} dari ${maxViolationsAllowed}`}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Peringatan: </span>
            <span>{violations.length}/{maxViolationsAllowed}</span>
          </div>

          {/* Countdown Clock */}
          <div className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-mono font-bold tracking-wider flex items-center gap-1.5 ${
            remainingSeconds < 180 
              ? 'bg-rose-600 text-white animate-pulse' 
              : remainingSeconds < 600 
              ? 'bg-amber-500 text-slate-950' 
              : 'bg-slate-800 text-blue-300'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="tabular-nums">{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Mobile Question Palette Trigger Button */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-blue-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
            title="Buka Daftar Nomor Soal"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline text-[11px]">Soal</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitConfirmModal(true)}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Main Examination Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-2.5 sm:p-4 md:p-6 gap-3 sm:gap-6 z-10">
        {/* Left: Question Box */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* 5-Minute Remaining Alert Banner */}
          {remainingSeconds <= 300 && remainingSeconds > 0 && (
            <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white flex items-center justify-between text-xs shadow-inner shrink-0">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 animate-bounce shrink-0 text-amber-100" />
                <span className="font-extrabold tracking-tight text-[11px] sm:text-xs">
                  Sisa {formatTimer(remainingSeconds)}!
                </span>
                <span className="hidden sm:inline text-amber-100 text-[11px]">
                  Segera periksa kembali nomor soal yang belum terisi atau masih ragu-ragu.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFiveMinuteModal(true)}
                className="underline text-[11px] font-bold text-amber-100 hover:text-white cursor-pointer shrink-0 ml-2"
              >
                Ringkasan
              </button>
            </div>
          )}

          {/* Question Meta Bar */}
          <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-slate-900">Nomor {currentIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span>{questions.length} Soal</span>
              <span>·</span>
              <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] sm:text-xs">
                {currentQuestion?.type === 'pg' && 'Pilihan Ganda'}
                {currentQuestion?.type === 'mcma' && 'MCMA Kompleks'}
                {currentQuestion?.type === 'true_false_matrix' && 'Tabel Benar/Salah'}
              </span>
            </div>

            <div className="font-semibold text-slate-700 text-[11px] sm:text-xs">
              Bobot Skor: <span className="text-blue-600">{currentQuestion?.score} Poin</span>
            </div>
          </div>

          {/* Question Body Scrollable */}
          <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
            {currentQuestion ? (
              <>
                {/* Optional Image */}
                {currentQuestion.imageUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-xl mx-auto">
                    <div className="relative group cursor-pointer" onClick={() => setZoomImage(currentQuestion.imageUrl!)}>
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Ilustrasi Soal"
                        className="max-h-64 mx-auto rounded object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                        <span className="px-2.5 py-1 bg-white/90 text-slate-900 text-xs font-semibold rounded shadow-sm flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" /> Klik untuk Perbesar
                        </span>
                      </div>
                    </div>
                    {currentQuestion.imageCaption && (
                      <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                        {currentQuestion.imageCaption}
                      </p>
                    )}
                  </div>
                )}

                {/* Question Statement */}
                <div className="text-base text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                  <MathRenderer content={currentQuestion.text} />
                </div>

                {/* TYPE 1: PILIHAN GANDA (PG) */}
                {currentQuestion.type === 'pg' && currentQuestion.options && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id]?.value === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOptionPG(opt.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-medium'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          {currentQuestion.showOptionLabels !== false ? (
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </span>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          )}
                          <span className="text-sm leading-snug pt-0.5">
                            <MathRenderer content={opt.text} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TYPE 2: MCMA (Multiple Choice Multiple Answers) */}
                {currentQuestion.type === 'mcma' && currentQuestion.options && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" />
                      Centang kotak pada semua pilihan yang menurut Anda benar:
                    </p>
                    {currentQuestion.options.map((opt) => {
                      const userVals: string[] = Array.isArray(answers[currentQuestion.id]?.value)
                        ? answers[currentQuestion.id].value
                        : [];
                      const isChecked = userVals.includes(opt.id);

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleToggleOptionMCMA(opt.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-medium'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                          </div>
                          <div className="text-sm leading-snug">
                            {currentQuestion.showOptionLabels !== false && (
                              <strong className="mr-2 text-indigo-900 font-bold">{opt.label}.</strong>
                            )}
                            <MathRenderer content={opt.text} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TYPE 3: BENAR / SALAH BENTUK TABEL DENGAN 4 PERNYATAAN */}
                {currentQuestion.type === 'true_false_matrix' && currentQuestion.matrixStatements && (
                  <div className="pt-2">
                    {/* Mobile Card View (< sm) */}
                    <div className="block sm:hidden space-y-3">
                      {currentQuestion.matrixStatements.map((stmt, idx) => {
                        const userMap = answers[currentQuestion.id]?.value || {};
                        const currentVal = userMap[stmt.id]; // true or false or undefined

                        return (
                          <div 
                            key={stmt.id} 
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="text-xs text-slate-800 font-medium leading-relaxed flex-1">
                                <MathRenderer content={stmt.statement} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleMatrixSelect(stmt.id, true)}
                                className={`h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                  currentVal === true
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500 ring-offset-1'
                                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                <span>✓ BENAR</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixSelect(stmt.id, false)}
                                className={`h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                  currentVal === false
                                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500 ring-offset-1'
                                    : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
                                }`}
                              >
                                <span>✕ SALAH</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tablet & Desktop Table View (>= sm) */}
                    <div className="hidden sm:block overflow-hidden border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs md:text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-3 px-4 w-12 text-center">No</th>
                            <th className="py-3 px-4">Pernyataan Analisis</th>
                            <th className="py-3 px-3 w-28 text-center text-emerald-700">BENAR</th>
                            <th className="py-3 px-3 w-28 text-center text-rose-700">SALAH</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {currentQuestion.matrixStatements.map((stmt, idx) => {
                            const userMap = answers[currentQuestion.id]?.value || {};
                            const currentVal = userMap[stmt.id]; // true or false or undefined

                            return (
                              <tr key={stmt.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 text-slate-800 font-medium leading-relaxed">
                                  <MathRenderer content={stmt.statement} />
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleMatrixSelect(stmt.id, true)}
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                      currentVal === true
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                  >
                                    BENAR
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleMatrixSelect(stmt.id, false)}
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                      currentVal === false
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                                    }`}
                                  >
                                    SALAH
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Tidak ada data soal pada nomor ini.
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 pb-safe">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Sebelumnya</span>
            </button>

            {/* Mobile quick palette trigger button in bottom bar */}
            <button
              type="button"
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Daftar Soal</span>
            </button>

            <button
              onClick={handleToggleDoubtful}
              className={`px-3 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 active:scale-95 ${
                answers[currentQuestion?.id || '']?.isDoubtful
                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{answers[currentQuestion?.id || '']?.isDoubtful ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}</span>
              <span className="sm:hidden">{answers[currentQuestion?.id || '']?.isDoubtful ? 'Ragu (✓)' : 'Ragu'}</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span className="hidden xs:inline">Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="px-3.5 sm:px-5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span>Selesai</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Palette (Desktop only, mobile uses slide-up drawer) */}
        <div className="hidden lg:flex w-72 bg-white border border-slate-200 rounded-xl shadow-xs p-5 flex-col justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Nomor Soal</h3>

            <div className="grid grid-cols-5 gap-2.5 mb-6">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q);
                const isActive = idx === currentIndex;

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
                if (status === 'answered') {
                  colorClasses = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                } else if (status === 'doubtful') {
                  colorClasses = 'bg-amber-400 text-slate-950 border-amber-500 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg text-xs font-mono border transition-all flex items-center justify-center relative ${colorClasses} ${
                      isActive ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 z-10' : 'hover:opacity-90'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 shrink-0"></span>
                <span>Sudah Dijawab ({totalAnsweredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500 shrink-0"></span>
                <span>Ragu-ragu ({totalDoubtfulCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0"></span>
                <span>Belum Dijawab ({totalUnansweredCount})</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => setShowSubmitConfirmModal(true)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Kumpulkan Jawaban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Violation Alert Emergency Modal */}
      {activeViolationModal && !isExamLockedDueToViolations && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-center text-lg font-extrabold text-rose-600">
              PERINGATAN PELANGGARAN INTEGRITAS
            </h3>

            <div className="text-center text-xs text-slate-600 mt-1 mb-4">
              {activeViolationModal.title}
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 mb-4 leading-relaxed">
              {activeViolationModal.details}
              <div className="mt-2 text-[11px] font-mono font-semibold text-rose-900">
                Peringatan ke-{violations.length} dari maksimal {maxViolationsAllowed}. Jika mencapai {maxViolationsAllowed}, ujian akan dikunci atau disubmit otomatis.
              </div>
            </div>

            <button
              onClick={handleResolveViolationModal}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Kembali Mengerjakan & Masuk Layar Penuh</span>
            </button>
          </div>
        </div>
      )}

      {/* Lockout Screen when violations threshold reached & auto-submitted */}
      {isExamLockedDueToViolations && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-rose-600/70 rounded-2xl p-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-900/50 animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950 border border-rose-800 px-3 py-1 rounded-full">
                Sistem Integritas CBT
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">
                Jawaban Dikumpulkan Otomatis (3x Pelanggaran)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anda terdeteksi melakukan <strong>{violations.length || 3} kali pelanggaran keamanan</strong> (berpindah tab, keluar layar penuh, atau split screen). 
              Sistem telah <strong>mengumpulkan dan mengirimkan seluruh jawaban Anda secara otomatis</strong> ke server CBT.
            </p>
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[11px] text-rose-200 text-left space-y-1">
              <div className="font-bold text-rose-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Ketentuan Pengerjaan Soal:</span>
              </div>
              <p>
                Setiap siswa hanya mempunyai <strong>1x kesempatan pengerjaan</strong>. Anda tidak dapat mengerjakan soal ini lagi kecuali kode token login Anda di-reset oleh Master Operator.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const finalSession = calculateFinalSession('blocked', violationsRef.current);
                  onSubmitExam(finalSession);
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Lihat Bukti Hasil Ujian & Keluar
              </button>
              <p className="text-[11px] text-slate-400">
                Silakan melapor ke Guru Pengawas atau Master Operator jika diperlukan verifikasi lebih lanjut.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pastikan Anda telah memeriksa seluruh butir pertanyaan sebelum mengakhiri sesi.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="text-lg font-bold text-emerald-700 font-mono">{totalAnsweredCount}</div>
                <div className="text-[11px] text-emerald-800">Sudah Dijawab</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-lg font-bold text-amber-700 font-mono">{totalDoubtfulCount}</div>
                <div className="text-[11px] text-amber-800">Ragu-ragu</div>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                <div className="text-lg font-bold text-slate-700 font-mono">{totalUnansweredCount}</div>
                <div className="text-[11px] text-slate-600">Belum Dijawab</div>
              </div>
            </div>

            {totalUnansweredCount > 0 && (
              <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Masih ada {totalUnansweredCount} soal yang belum Anda jawab!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Lanjutkan Mengerjakan
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                Ya, Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-4 rounded-xl shadow-2xl">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={zoomImage} alt="Perbesar Gambar" className="max-h-[80vh] w-auto mx-auto rounded" />
          </div>
        </div>
      )}

      {/* Overlay Akses Soal Dinonaktifkan oleh Operator (Per-Siswa, Per-Akun, atau Per-Ruang) */}
      {isQuestionFrozen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-8 text-center text-white shadow-2xl space-y-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse ${
              isAccountDeactivated 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isAccountDeactivated ? <UserX className="w-8 h-8" /> : <PowerOff className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <span className={`text-[11px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
                isAccountDeactivated 
                  ? 'text-rose-300 bg-rose-950/80 border-rose-800'
                  : 'text-amber-400 bg-amber-950/80 border-amber-800'
              }`}>
                {isAccountDeactivated 
                  ? 'Akun Siswa Dinonaktifkan oleh Operator' 
                  : isStudentDisabled 
                  ? 'Akses Soal Siswa Dinonaktifkan' 
                  : 'Akses Soal Ruangan Ditangguhkan'}
              </span>
              <h2 className="text-xl font-black text-white">
                {isAccountDeactivated
                  ? 'Akun Anda Dinonaktifkan Sementara'
                  : isStudentDisabled
                  ? 'Akses Soal Anda Dinonaktifkan Sementara'
                  : `Sesi Ujian di ${student.room || 'Ruang 1'} Dinonaktifkan`}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAccountDeactivated ? (
                  <>
                    Pengawas Pusat / Master Operator telah menonaktifkan akun Anda secara khusus pada {student.room || 'ruangan ini'}. 
                    Akun peserta lainnya tetap berjalan normal tanpa gangguan. Durasi pengerjaan Anda dijeda dan seluruh jawaban tersimpan aman di server CBT.
                  </>
                ) : isStudentDisabled ? (
                  <>
                    Pengawas Pusat / Master Operator telah menonaktifkan tampilan soal untuk akun Anda secara khusus. 
                    Pengerjaan peserta lain tetap berjalan tanpa gangguan. Durasi pengerjaan Anda dijeda sementara dan seluruh jawaban tersimpan aman di server CBT.
                  </>
                ) : (
                  <>
                    Pengawas Pusat / Master Operator telah menonaktifkan tampilan soal untuk ruangan Anda. 
                    Durasi pengerjaan ujian dijeda sementara waktu dan jawaban yang telah Anda pilih tersimpan aman di sistem.
                  </>
                )}
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Nama Peserta:</span>
                <strong className="text-slate-200">{student.name}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Ruang Ujian:</span>
                <strong className="text-amber-400 font-mono font-bold">{student.room || 'Ruang 1'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Status Jawaban:</span>
                <strong className="text-emerald-400">Tersimpan ({Object.keys(answers).length} Butir)</strong>
              </div>
              {(isStudentDisabled || isAccountDeactivated) && (
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Status Siswa Lain:</span>
                  <span className="text-sky-300 font-medium">Berjalan Normal (Tidak Terpengaruh)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isAccountDeactivated ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
              <span>
                {isAccountDeactivated
                  ? 'Menunggu pengawas mengaktifkan kembali akun Anda dari Laman Pemantauan Ujian...'
                  : isStudentDisabled
                  ? 'Menunggu pengawas mengaktifkan kembali akses soal untuk akun Anda...'
                  : 'Menunggu pengawas mengaktifkan kembali akses soal ruangan ini...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5-Minute Remaining Alert Modal */}
      {showFiveMinuteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 relative text-slate-900">
            {/* Header with Alarm Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 border border-amber-300 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                  <Clock className="w-3 h-3" />
                  Sisa Waktu: {formatTimer(remainingSeconds)}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Pemberitahuan Waktu Ujian: Tersisa 5 Menit!
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Waktu pengerjaan ujian Anda tersisa <strong>5 menit lagi</strong>. Sistem CBT akan otomatis mengumpulkan lembar jawaban saat waktu habis. Silakan periksa kembali seluruh butir jawaban Anda.
            </p>

            {/* Answer Summary Pills */}
            <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <div className="text-base font-bold text-emerald-700 font-mono">{totalAnsweredCount}</div>
                <div className="text-[10px] text-emerald-800 font-medium">Terjawab</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <div className="text-base font-bold text-amber-700 font-mono">{totalDoubtfulCount}</div>
                <div className="text-[10px] text-amber-800 font-medium">Ragu-ragu</div>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5">
                <div className="text-base font-bold text-slate-700 font-mono">{totalUnansweredCount}</div>
                <div className="text-[10px] text-slate-600 font-medium">Belum Diisi</div>
              </div>
            </div>

            {totalUnansweredCount > 0 && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Masih ada <strong>{totalUnansweredCount} butir soal</strong> yang belum terisi!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFiveMinuteModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
              >
                Lanjutkan Ujian (Saya Mengerti)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFiveMinuteModal(false);
                  setShowSubmitConfirmModal(true);
                }}
                className="py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
              >
                Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Question Palette Bottom Sheet / Modal */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end lg:hidden">
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Nomor Soal</h3>
                  <p className="text-[11px] text-slate-500">Pilih nomor untuk berpindah soal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Tutup Daftar Soal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions Grid Scrollable */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Status Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <span className="font-bold text-emerald-700 text-sm block font-mono">{totalAnsweredCount}</span>
                  <span className="text-[10px] text-emerald-800">Dijawab</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <span className="font-bold text-amber-700 text-sm block font-mono">{totalDoubtfulCount}</span>
                  <span className="text-[10px] text-amber-800">Ragu-ragu</span>
                </div>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-2">
                  <span className="font-bold text-slate-700 text-sm block font-mono">{totalUnansweredCount}</span>
                  <span className="text-[10px] text-slate-600">Belum Diisi</span>
                </div>
              </div>

              {/* Grid 5 cols on mobile */}
              <div className="grid grid-cols-5 gap-2.5 pt-2">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q);
                  const isActive = idx === currentIndex;

                  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (status === 'answered') {
                    colorClasses = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                  } else if (status === 'doubtful') {
                    colorClasses = 'bg-amber-400 text-slate-950 border-amber-500 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMobilePalette(false);
                      }}
                      className={`h-11 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center relative active:scale-95 ${colorClasses} ${
                        isActive ? 'ring-3 ring-blue-600 ring-offset-2 scale-105 z-10' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 pb-safe">
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobilePalette(false);
                  setShowSubmitConfirmModal(true);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm text-center"
              >
                Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
