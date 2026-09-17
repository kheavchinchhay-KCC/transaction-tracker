/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, Sun, Moon, Trash2, Menu, FileSpreadsheet, RefreshCw, Link2, Link2Off, Send } from 'lucide-react';
import { Language, ThemeColor } from '../types';
import { translations } from '../utils/lang';
import { THEME_CONFIGS, THEME_COLOR_LIST } from '../utils/theme';

interface DashboardHeaderProps {
  onClearAll: () => void;
  transactionCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  lang: Language;
  onSelectLang: (newLang: Language) => void;
  themeColor: ThemeColor;
  onSelectThemeColor: (color: ThemeColor) => void;
  onToggleSidebar?: () => void;
  
  // Google Sheets Integration Props
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onSaveToGoogleSheet: () => void;
  isGoogleSaving: boolean;
  groupByMerchant: boolean;
  onToggleGroupByMerchant: () => void;
}

export default function DashboardHeader({
  onClearAll,
  transactionCount,
  theme,
  onToggleTheme,
  lang,
  onSelectLang,
  themeColor,
  onSelectThemeColor,
  onToggleSidebar,
  
  // Google Sheets Integration Props
  isGoogleConnected,
  onConnectGoogle,
  onDisconnectGoogle,
  onSaveToGoogleSheet,
  isGoogleSaving,
  groupByMerchant,
  onToggleGroupByMerchant
}: DashboardHeaderProps) {
  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;

  return (
    <header className={`border-b ${activeTheme.cardBorder} bg-white dark:bg-slate-900 shadow-xs transition-colors duration-200 shrink-0`}>
      <div className="w-full px-3 py-2 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5">
            {onToggleSidebar && (
              <button
                id="btn-mobile-menu-toggle"
                onClick={onToggleSidebar}
                className="inline-flex lg:hidden items-center justify-center p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                title={lang === 'en' ? 'Open Sidebar' : 'បើករបារចំហៀង'}
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${activeTheme.btnPrimaryBg} shadow-xs transition-colors duration-200`}>
              <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  {t.appName}
                </h1>
                <span className={`inline-flex items-center rounded-md ${activeTheme.badgeBg} px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold ${activeTheme.badgeText} transition-colors duration-200`}>
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${activeTheme.headerPulseDot} inline-block animate-pulse`}></span>
                  {t.appSubName}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">
                {t.appDesc}
              </p>
            </div>
          </div>

          {/* Controls: Color Theme Palette + Sliding KH/EN Toggle + Dark/Light + Clear All */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Admin Telegram Button */}
            <a
              id="btn-admin-telegram"
              href="https://t.me/Bongchhay"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full text-[10px] sm:text-xs transition-colors duration-200 shadow-xs cursor-pointer select-none"
              title={lang === 'en' ? 'Contact Admin via Telegram' : 'ទាក់ទងអ្នកគ្រប់គ្រងតាម Telegram'}
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 rotate-[-20deg] text-white" />
              <span>{lang === 'en' ? 'Admin' : 'អ្នកគ្រប់គ្រង'}</span>
            </a>
            
            {/* 1. Color Themes Pill */}
            <div 
              id="theme-color-palette-picker"
              className="flex items-center gap-1.5 bg-gray-100/90 dark:bg-slate-800 p-1 rounded-full border border-gray-200 dark:border-slate-700 shadow-inner"
              title={lang === 'en' ? 'Select Accent Color Theme' : 'ជ្រើសរើសពណ៌ចម្បង'}
            >
              {THEME_COLOR_LIST.map((colorKey) => {
                const cfg = THEME_CONFIGS[colorKey];
                const isActive = themeColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    id={`btn-color-theme-${colorKey}`}
                    type="button"
                    onClick={() => onSelectThemeColor(colorKey)}
                    className={`relative h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full ${cfg.dotBg} cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-hidden ${
                      isActive 
                        ? `ring-2 ring-offset-2 ring-gray-700 dark:ring-white dark:ring-offset-slate-900 scale-110 shadow-sm` 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Theme color ${cfg.name}`}
                  />
                );
              })}
            </div>

            {/* 2. Sliding KH | EN Toggle Switch Pill */}
            <div 
              id="lang-sliding-toggle" 
              className="relative flex items-center bg-gray-100/90 dark:bg-slate-800 p-0.5 rounded-full border border-gray-200 dark:border-slate-700 h-7 w-[84px] select-none shadow-inner cursor-pointer"
              onClick={() => onSelectLang(lang === 'en' ? 'km' : 'en')}
            >
              {/* Animated Sliding Background Capsule */}
              <div 
                className={`absolute top-0.5 bottom-0.5 w-[38px] rounded-full bg-white dark:bg-slate-700 shadow-xs transition-all duration-200 ease-out ${
                  lang === 'km' ? 'left-0.5' : 'left-[43px]'
                }`}
              />

              {/* KH Button */}
              <button
                id="btn-lang-kh"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLang('km');
                }}
                className={`relative z-10 w-1/2 text-center text-[11px] font-bold cursor-pointer transition-colors duration-200 ${
                  lang === 'km' 
                    ? `${activeTheme.textAccent} font-extrabold` 
                    : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white'
                }`}
              >
                KH
              </button>

              {/* EN Button */}
              <button
                id="btn-lang-en"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLang('en');
                }}
                className={`relative z-10 w-1/2 text-center text-[11px] font-bold cursor-pointer transition-colors duration-200 ${
                  lang === 'en' 
                    ? `${activeTheme.textAccent} font-extrabold` 
                    : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* 3. Right Side Controls: Google Sheets, Day/Night Theme Toggle & Clear All Data Button */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              
              {/* Google Sheets Sync & Connection controls */}
              <div id="google-sheets-header-group" className="flex items-center gap-1 bg-gray-100/90 dark:bg-slate-800 p-0.5 sm:p-1 rounded-full border border-gray-200 dark:border-slate-700 shadow-inner">
                {isGoogleConnected ? (
                  <>
                    {/* Save in Google Sheet button */}
                    <button
                      id="btn-save-to-google-sheet"
                      type="button"
                      onClick={onSaveToGoogleSheet}
                      disabled={isGoogleSaving}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-[10px] sm:text-xs font-bold text-white px-2.5 py-1 transition shadow-xs cursor-pointer select-none"
                    >
                      {isGoogleSaving ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
                      )}
                      <span>
                        {isGoogleSaving 
                          ? (lang === 'en' ? 'Saving...' : 'កំពុងរក្សាទុក...') 
                          : (lang === 'en' ? 'Save in Google Sheet' : 'រក្សាទុកក្នុង Google Sheet')
                        }
                      </span>
                    </button>

                    {/* Group by Store/Receiver Option Toggle */}
                    <label 
                      id="toggle-group-by-merchant-label"
                      className="inline-flex items-center gap-1 px-1.5 text-[10px] font-bold text-gray-600 dark:text-slate-300 cursor-pointer select-none"
                      title={lang === 'en' ? 'Separate sheets for each store or receiver' : 'បែងចែកសន្លឹកកិច្ចការតាមឈ្មោះហាង ឬអ្នកទទួល'}
                    >
                      <input 
                        type="checkbox" 
                        checked={groupByMerchant}
                        onChange={onToggleGroupByMerchant}
                        className="rounded-sm border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 h-3 w-3 cursor-pointer"
                      />
                      <span className="hidden sm:inline">{lang === 'en' ? 'Store Tabs' : 'បែងចែកតាមហាង'}</span>
                    </label>

                    {/* Disconnect Icon Button */}
                    <button
                      id="btn-disconnect-google-sheet"
                      type="button"
                      onClick={onDisconnectGoogle}
                      className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title={lang === 'en' ? 'Disconnect Google Sheet' : 'ផ្តាច់ការភ្ជាប់ Google Sheet'}
                    >
                      <Link2Off className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  // Connect button
                  <button
                    id="btn-connect-google-sheet"
                    type="button"
                    onClick={onConnectGoogle}
                    className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 text-[10px] sm:text-xs font-bold px-2.5 py-1 transition shadow-xs cursor-pointer select-none"
                  >
                    <Link2 className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
                    <span>{lang === 'en' ? 'Connect Google Sheet' : 'ភ្ជាប់ Google Sheet'}</span>
                  </button>
                )}
              </div>

              <button
                id="btn-theme-toggle"
                onClick={onToggleTheme}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 text-gray-700" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-400" />
                )}
              </button>
              
              {/* Clear All Data Button (Positioned directly beside Day/Night toggle on the right side) */}
              {transactionCount > 0 && (
                <button
                  id="btn-clear-all-data"
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-xs cursor-pointer"
                  title={lang === 'en' ? 'Clear All Data' : 'លុបទិន្នន័យទាំងអស់'}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  <span>{t.clearAllData}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
