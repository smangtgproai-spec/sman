/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exam } from '../types/exam';

/**
 * Format a Date object to YYYY-MM-DDTHH:mm string for datetime-local inputs
 */
export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a datetime string (ISO or YYYY-MM-DDTHH:mm) into formatted Indonesian text
 */
export function formatExamDateTime(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${dayName}, ${dateNum} ${monthName} ${year} pukul ${hours}:${minutes} WIB`;
  } catch {
    return dateTimeStr;
  }
}

/**
 * Short date-time format for badges and tables
 */
export function formatExamDateTimeShort(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;

    const pad = (n: number) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateTimeStr;
  }
}

export type ExamScheduleStatus = 'upcoming' | 'active' | 'ended' | 'flexible';

export interface ExamScheduleStatusInfo {
  status: ExamScheduleStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  isAccessible: boolean;
  message?: string;
  detailedMessage?: string;
}

/**
 * Evaluate if an exam has schedule restrictions and what the current real-time status is
 */
export function getExamScheduleStatus(
  exam: Pick<Exam, 'enableSchedule' | 'startDate' | 'endDate' | 'title'>,
  currentTimestamp: number = Date.now()
): ExamScheduleStatusInfo {
  // If schedule is explicitly disabled or no dates configured
  if (exam.enableSchedule === false || (!exam.startDate && !exam.endDate)) {
    return {
      status: 'flexible',
      label: 'Bebas Akses (Tanpa Jadwal)',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200',
      isAccessible: true,
      message: 'Ujian dapat dikerjakan kapan saja selama berstatus aktif.',
      detailedMessage: 'Ujian ini tidak dibatasi oleh jadwal tanggal atau jam tertentu.',
    };
  }

  const startMs = exam.startDate ? new Date(exam.startDate).getTime() : 0;
  const endMs = exam.endDate ? new Date(exam.endDate).getTime() : Infinity;

  // Check if upcoming (Belum Dimulai)
  if (exam.startDate && currentTimestamp < startMs) {
    const diffMs = startMs - currentTimestamp;
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const countdownStr = hours > 0 ? `${hours} jam ${mins} menit lagi` : `${mins} menit lagi`;

    return {
      status: 'upcoming',
      label: 'Belum Dimulai',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-300',
      isAccessible: false,
      message: `Ujian baru akan dibuka pada ${formatExamDateTime(exam.startDate)} (${countdownStr}).`,
      detailedMessage: `Jadwal pelaksanaan ujian belum dimulai. Akses pengerjaan soal otomatis terbuka tepat pada ${formatExamDateTime(exam.startDate)}.`,
    };
  }

  // Check if ended (Telah Berakhir)
  if (exam.endDate && currentTimestamp > endMs) {
    return {
      status: 'ended',
      label: 'Telah Berakhir',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-800',
      badgeBorder: 'border-rose-300',
      isAccessible: false,
      message: `Jadwal ujian telah berakhir pada ${formatExamDateTime(exam.endDate)}.`,
      detailedMessage: `Batas waktu pelaksanaan ujian telah berakhir pada ${formatExamDateTime(exam.endDate)}. Anda tidak dapat memulai ujian lagi.`,
    };
  }

  // Currently within start and end time (Sedang Berlangsung)
  let remainingWindowStr = '';
  if (exam.endDate && isFinite(endMs)) {
    const diffMs = endMs - currentTimestamp;
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    remainingWindowStr = hours > 0 ? `Sisa waktu jendela: ${hours}j ${mins}m` : `Sisa waktu jendela: ${mins} menit`;
  }

  return {
    status: 'active',
    label: 'Sedang Berlangsung',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    isAccessible: true,
    message: `Ujian sedang berlangsung s.d ${formatExamDateTime(exam.endDate)}${remainingWindowStr ? ` (${remainingWindowStr})` : ''}.`,
    detailedMessage: `Sesi ujian saat ini sedang aktif dibuka hingga batas akhir ${formatExamDateTime(exam.endDate)}.`,
  };
}

/**
 * Calculate total time difference in human readable hours/minutes
 */
export function calculateScheduleDuration(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return '-';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 'Jadwal tidak valid';

  const diffMinutes = Math.round((end - start) / (1000 * 60));
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);

  return parts.length > 0 ? parts.join(' ') : '0 Menit';
}
