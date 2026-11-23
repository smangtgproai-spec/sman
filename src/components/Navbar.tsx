/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, BookOpen, Users, Settings, LogOut, CheckCircle2, Lock, Menu, X, Home } from 'lucide-react';

export type UserRole = 'landing' | 'student' | 'teacher' | 'operator';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeUserName?: string;
  activeExamActive?: boolean;
  isOperatorAuthenticated?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  activeUserName,
  activeExamActive = false,
  isOperatorAuthenticated = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    onSelectRole(role);
    setMobileMenuOpen(false);
  };

  // If exam is actively in progress with locked anti-cheat, suppress standard nav to prevent tab navigation
  if (activeExamActive) {
    return (
      <header className="bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 min-w-0">
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt EduSecure CBT" 
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0" 
          />
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
            SmanGt EduSecure
          </span>
          <span className="text-[10px] sm:text-xs text-emerald-400 font-mono flex items-center gap-1 shrink-0 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden xs:inline">MODE </span>TERKUNCI
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-300 shrink-0">
          <span className="truncate max-w-[120px] sm:max-w-[200px]">
            <strong className="text-white">{activeUserName || 'Peserta'}</strong>
          </span>
          <span className="hidden sm:inline text-amber-400 font-medium">· Anti-Curang</span>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => handleRoleSelect('landing')}
          className="text-left group flex items-center gap-2.5 sm:gap-3 focus:outline-none cursor-pointer min-w-0"
        >
          <img 
            src="https://iili.io/f0D1nQs.png" 
            alt="Logo SmanGt EduSecure CBT" 
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform" 
          />
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
              SmanGt EduSecure CBT
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
              Integritas & Anti-Curang
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => handleRoleSelect('landing')}
            className={`transition-colors hover:text-slate-900 pb-0.5 ${
              currentRole === 'landing' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            Portal Utama
          </button>
          <button
            onClick={() => handleRoleSelect('student')}
            className={`flex items-center gap-1.5 transition-colors hover:text-slate-900 pb-0.5 ${
              currentRole === 'student' ? 'text-blue-600 font-semibold border-b-2 border-blue-600' : ''
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Laman Siswa
          </button>
          <button
            onClick={() => handleRoleSelect('teacher')}
            className={`flex items-center gap-1.5 transition-colors hover:text-slate-900 pb-0.5 ${
              currentRole === 'teacher' ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600' : ''
            }`}
          >
            <Users className="w-4 h-4" />
            Laman Guru
          </button>
          <button
            onClick={() => handleRoleSelect('operator')}
            className={`flex items-center gap-1.5 transition-colors hover:text-slate-900 pb-0.5 ${
              currentRole === 'operator' ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
            }`}
          >
            {isOperatorAuthenticated ? (
              <Settings className="w-4 h-4" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Laman Operator</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentRole !== 'landing' && activeUserName && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800 truncate max-w-[140px]">{activeUserName}</span>
            </div>
          )}

          {/* Quick Action Button */}
          {currentRole === 'landing' ? (
            <button
              onClick={() => handleRoleSelect('student')}
              className="hidden sm:inline-flex px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              Masuk Ujian
            </button>
          ) : (
            <button
              onClick={() => handleRoleSelect('landing')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors items-center gap-1 cursor-pointer"
              title="Ganti Mode / Kembali ke Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Portal</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {activeUserName && currentRole !== 'landing' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-600">Login Sebagai:</span>
                <strong className="text-slate-900 truncate max-w-[170px]">{activeUserName}</strong>
              </div>
              <button
                type="button"
                onClick={() => handleRoleSelect('landing')}
                className="text-[11px] font-semibold text-rose-600 hover:underline"
              >
                Ganti Portal
              </button>
            </div>
          )}

          <div className="space-y-1 text-sm font-semibold">
            <button
              onClick={() => handleRoleSelect('landing')}
              className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                currentRole === 'landing' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Portal Utama</span>
            </button>

            <button
              onClick={() => handleRoleSelect('student')}
              className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                currentRole === 'student' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Laman Ujian (Siswa)</span>
            </button>

            <button
              onClick={() => handleRoleSelect('teacher')}
              className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                currentRole === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Laman Guru</span>
            </button>

            <button
              onClick={() => handleRoleSelect('operator')}
              className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                currentRole === 'operator' ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isOperatorAuthenticated ? (
                <Settings className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <span>Laman Operator</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>SmanGt CBT v3.0</span>
            <span className="font-mono text-emerald-600">Mobile Ready</span>
          </div>
        </div>
      )}
    </header>
  );
};
