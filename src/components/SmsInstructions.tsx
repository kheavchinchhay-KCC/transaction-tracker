/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, HelpCircle, Copy, Check, X } from 'lucide-react';
import { Language, ThemeColor } from '../types';
import { translations } from '../utils/lang';
import { THEME_CONFIGS } from '../utils/theme';

interface SmsInstructionsProps {
  lang: Language;
  themeColor?: ThemeColor;
}

const SAMPLE_SNIPPETS = [
  {
    bank: 'ABA Bank (Income, USD)',
    text: '$999.99 paid by KHEAV CHINCHHAY AND HIS GIRLFREIND (*600) on Jun 12, 12:26 PM via ABA PAY at PHTEAS DECOR by D.RA. Remark: . Trx. ID: 178124197042803, APV: 612744.'
  },
  {
    bank: 'ABA Bank (Expense, USD)',
    text: '$25.00 paid to STARBUCKS COFFEE on Jun 12, 12:45 PM via ABA PAY at STARBUCKS BKK. Remark: Coffee. Trx. ID: 178124197042809, APV: 612749.'
  },
  {
    bank: 'ABA PAY (Khmer Bilingual, USD)',
    text: 'បានទូទាត់ចំនួន $3.40 ដោយ CHHEANG SREYHOUCH លើថ្ងៃ Jun 12, 12:26 PM តាមរយៈ ABA PAY នៅហាង PHTEAS DECOR. Remark: Decor items. Trx. ID: 178124197000123, APV: 612345.'
  },
  {
    bank: 'ACLEDA Mobile (Khmer Unicode, KHR)',
    text: 'ផ្ទេរប្រាក់ចំនួន ៤០,០០០ រៀល ទៅ CHHEANG SREYHOUCH តាម ACLEDA Mobile នៅថ្ងៃ ១២/០៦/២០២៦ លេខយោង៖ AC2839281'
  },
  {
    bank: 'Wing Bank (Income, KHR)',
    text: 'Wing Bank: You have received KHR 20,000 from KHEAV CHINCHHAY on Jun 12, 2026 12:26 PM. Txn ID: WG291823'
  },
  {
    bank: 'Wing Bank (Expense, USD)',
    text: 'Wing Bank: បានទូទាត់ចំនួន $5.00 ទៅ STARBUCKS COFFEE on Jun 12, 2026 12:45 PM. Txn ID: WG291830'
  }
];

export default function SmsInstructions({ lang, themeColor = 'emerald' }: SmsInstructionsProps) {
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div 
      id="sms-parser-instructions-container" 
      className={`rounded-xl border ${activeTheme.cardBorder} bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs ${activeTheme.cardHover} transition-all duration-200 shrink-0`}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2 shrink-0">
        <h3 className="font-display font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
          <Landmark className={`h-3.5 w-3.5 ${activeTheme.textAccent}`} />
          {t.howToUseTitle}
        </h3>
        <button
          id="btn-open-sample-modal"
          onClick={() => setIsSampleModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-md bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-100 px-2 py-1 text-[10px] sm:text-[11px] font-bold hover:bg-gray-800 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
        >
          <HelpCircle className={`h-3 w-3 ${activeTheme.textAccent}`} />
          {t.showSamplesBtn}
        </button>
      </div>

      {/* 4 Full Instruction Steps (NO TRUNCATE - Displaying full complete sentences) */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        
        {/* Step 1 */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${activeTheme.badgeBg} ${activeTheme.badgeText} text-[10px] font-extrabold mt-0.5 shadow-2xs`}>
            1
          </span>
          <p className="text-[10px] sm:text-[11px] leading-snug whitespace-normal text-gray-800 dark:text-slate-200 font-medium">
            {t.step1}
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${activeTheme.badgeBg} ${activeTheme.badgeText} text-[10px] font-extrabold mt-0.5 shadow-2xs`}>
            2
          </span>
          <p className="text-[10px] sm:text-[11px] leading-snug whitespace-normal text-gray-800 dark:text-slate-200 font-medium">
            {t.step2}
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${activeTheme.badgeBg} ${activeTheme.badgeText} text-[10px] font-extrabold mt-0.5 shadow-2xs`}>
            3
          </span>
          <p className="text-[10px] sm:text-[11px] leading-snug whitespace-normal text-gray-800 dark:text-slate-200 font-medium">
            {t.step3}
          </p>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${activeTheme.badgeBg} ${activeTheme.badgeText} text-[10px] font-extrabold mt-0.5 shadow-2xs`}>
            4
          </span>
          <p className="text-[10px] sm:text-[11px] leading-snug whitespace-normal text-gray-800 dark:text-slate-200 font-medium">
            {t.step4}
          </p>
        </div>

      </div>

      {/* Modal: Sample Alert Snippets */}
      {isSampleModalOpen && (
        <div id="modal-sample-alerts" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
                  {t.sampleAlertsTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {t.sampleAlertsDesc}
                </p>
              </div>
              <button
                id="btn-close-sample-modal"
                onClick={() => setIsSampleModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {SAMPLE_SNIPPETS.map((snippet, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopy(snippet.text, idx)}
                  className="group relative rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-3 hover:border-emerald-400 dark:hover:border-emerald-500 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      {snippet.bank}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3" />
                          {t.copiedText}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          {t.clickToCopy}
                        </>
                      )}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800 select-all">
                    {snippet.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                id="btn-close-sample-modal-bottom"
                onClick={() => setIsSampleModalOpen(false)}
                className={`rounded-lg ${activeTheme.btnPrimaryBg} ${activeTheme.btnPrimaryHover} px-4 py-1.5 text-xs font-semibold shadow-xs transition cursor-pointer`}
              >
                {lang === 'en' ? 'Close Helper' : 'បិទផ្ទាំងជំនួយ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
