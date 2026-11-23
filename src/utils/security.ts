/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViolationRecord, ViolationType } from '../types/exam';

// Web Audio API beep generator for violation alert
export function playViolationBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Silent fallback
  }
}

export async function enterExamFullscreen(elem: HTMLElement = document.documentElement): Promise<boolean> {
  try {
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      return true;
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
      return true;
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Fullscreen request rejected or blocked by browser:', err);
  }
  return false;
}

export function isFullscreenActive(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export function checkIsSplitScreen(): boolean {
  if (typeof window === 'undefined') return false;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const isPortrait = windowHeight >= windowWidth;

  // Account for orientation on smartphones to prevent false positives when rotating
  const rawScreenWidth = window.screen.availWidth || window.screen.width || windowWidth;
  const rawScreenHeight = window.screen.availHeight || window.screen.height || windowHeight;
  
  const expectedDeviceWidth = isPortrait 
    ? Math.min(rawScreenWidth, rawScreenHeight)
    : Math.max(rawScreenWidth, rawScreenHeight);

  // If window is significantly less than actual physical screen width (split screen active)
  if (expectedDeviceWidth >= 1024 && windowWidth < expectedDeviceWidth * 0.65) {
    return true;
  }
  if (expectedDeviceWidth < 1024 && expectedDeviceWidth > 0 && windowWidth < expectedDeviceWidth * 0.70) {
    return true;
  }
  return false;
}

export interface SecurityListenersOptions {
  onViolation: (record: ViolationRecord) => void;
  onFullscreenExit: () => void;
  onSplitScreenDetected: () => void;
  active: boolean;
}

export function setupExamSecurityListeners(options: SecurityListenersOptions) {
  if (!options.active) return () => {};

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    options.onViolation({
      id: 'v-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'copy_attempt',
      title: 'Klik Kanan Dicegah',
      details: 'Siswa mencoba membuka menu konteks (klik kanan) pada lembar ujian.',
    });
    playViolationBeep();
  };

  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    options.onViolation({
      id: 'v-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'copy_attempt',
      title: 'Upaya Copy Teks Terdeteksi',
      details: 'Siswa mencoba menyalin (copy/cut) teks soal atau pilihan jawaban.',
    });
    playViolationBeep();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Block PrintScreen
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      try {
        navigator.clipboard?.writeText?.('PERINGATAN: SCREENSHOT DILARANG!');
      } catch {}
      options.onViolation({
        id: 'v-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'screenshot_attempt',
        title: 'Deteksi Screenshot (PrintScreen)',
        details: 'Siswa menekan tombol PrintScreen untuk menangkap layar lembar ujian.',
      });
      playViolationBeep();
      return;
    }

    // Block common developer & copy shortcuts
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (
      (isCtrlOrMeta && ['c', 'v', 'x', 'a', 'u', 's', 'p'].includes(key)) ||
      key === 'f12' ||
      (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      (e.altKey && key === 'tab')
    ) {
      e.preventDefault();
      options.onViolation({
        id: 'v-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'copy_attempt',
        title: `Kombinasi Tombol Terlarang (${isCtrlOrMeta ? 'Ctrl+' : ''}${e.key.toUpperCase()})`,
        details: `Siswa menekan kombinasi tombol pintas terlarang ${e.key}.`,
      });
      playViolationBeep();
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      options.onViolation({
        id: 'v-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'tab_switch',
        title: 'Perpindahan Tab / Aplikasi Terdeteksi',
        details: 'Siswa meninggalkan tab ujian untuk membuka tab atau jendela lain di peramban.',
      });
      playViolationBeep();
    }
  };

  const handleWindowBlur = () => {
    // Window lost focus (floating window, notification, or external app opened)
    options.onViolation({
      id: 'v-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'floating_window_blur',
      title: 'Layar Kehilangan Fokus (Floating Window)',
      details: 'Fokus jendela ujian hilang. Siswa diduga membuka aplikasi mengambang atau pop-up eksternal.',
    });
    playViolationBeep();
  };

  const handleFullscreenChange = () => {
    if (!isFullscreenActive()) {
      options.onFullscreenExit();
      options.onViolation({
        id: 'v-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'fullscreen_exit',
        title: 'Keluar dari Mode Layar Penuh',
        details: 'Siswa keluar dari mode fullscreen yang diwajibkan selama ujian berlangsung.',
      });
      playViolationBeep();
    }
  };

  const handleResize = () => {
    if (checkIsSplitScreen()) {
      options.onSplitScreenDetected();
      options.onViolation({
        id: 'v-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: 'split_screen',
        title: 'Layar Terbelah (Split Screen)',
        details: 'Dimensi browser terdeteksi menciut secara tidak wajar, menyerupai mode split screen.',
      });
      playViolationBeep();
    }
  };

  // Attach event listeners
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('copy', handleCopy);
  document.addEventListener('cut', handleCopy);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', handleResize);

  // Add exam-secure-mode and exam-in-progress classes to body
  document.body.classList.add('exam-secure-mode', 'exam-in-progress');

  // Return cleanup function
  return () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('cut', handleCopy);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.removeEventListener('resize', handleResize);
    document.body.classList.remove('exam-secure-mode', 'exam-in-progress');
  };
}
