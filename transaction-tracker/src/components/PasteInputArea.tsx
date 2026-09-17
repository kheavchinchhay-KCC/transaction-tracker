/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clipboard, Play, Info, Trash2 } from 'lucide-react';
import { Transaction, Language, ThemeColor } from '../types';
import { processRawPastedText } from '../utils/parser';
import { translations } from '../utils/lang';
import { THEME_CONFIGS } from '../utils/theme';

interface PasteInputAreaProps {
  existingTransactions: Transaction[];
  onImportSuccess: (parsed: Transaction[], duplicateCount: number) => void;
  lang: Language;
  themeColor?: ThemeColor;
  inputText?: string;
  onInputTextChange?: (text: string) => void;
}

export default function PasteInputArea({
  existingTransactions,
  onImportSuccess,
  lang,
  themeColor = 'emerald',
  inputText: controlledInputText,
  onInputTextChange
}: PasteInputAreaProps) {
  const [internalInputText, setInternalInputText] = useState('');
  const inputText = controlledInputText !== undefined ? controlledInputText : internalInputText;
  const setInputText = (val: string) => {
    if (onInputTextChange) {
      onInputTextChange(val);
    } else {
      setInternalInputText(val);
    }
  };
  const [previewResult, setPreviewResult] = useState<{
    parsed: Transaction[];
    duplicates: Transaction[];
    skippedCount: number;
    reviewCount: number;
  } | null>(null);

  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;

  // Parse text in real time whenever typed or pasted
  useEffect(() => {
    if (!inputText.trim()) {
      setPreviewResult(null);
      return;
    }
    const result = processRawPastedText(inputText, existingTransactions);
    setPreviewResult(result);
  }, [inputText, existingTransactions]);

  const handleProcessImport = () => {
    if (!inputText.trim() || !previewResult) return;

    const { parsed, skippedCount } = previewResult;
    
    // Save to parent state
    onImportSuccess(parsed, skippedCount);
    
    // Reset paste field upon success
    setInputText('');
    setPreviewResult(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
      }
    } catch (err) {
      alert(lang === 'en' 
        ? "Clipboard access blocked by browser security. Please paste directly using Ctrl+V or Cmd+V in the box." 
        : "សូមធ្វើការចុច Ctrl+V (ឬ Cmd+V) ដើម្បីបិទភ្ជាប់អត្ថបទសារដោយផ្ទាល់។");
    }
  };

  const handleClear = () => {
    setInputText('');
    setPreviewResult(null);
  };

  return (
    <div 
      id="paste-bank-transactions-container" 
      className={`flex-1 min-h-0 flex flex-col rounded-xl border ${activeTheme.cardBorder} bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs ${activeTheme.cardHover} transition-all duration-200`}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${activeTheme.iconBoxBg} ${activeTheme.iconBoxText}`}>
            <Clipboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
            {lang === 'en' ? 'Paste Bank Transaction' : 'បញ្ចូលប្រតិបត្តិការធនាគារ'}
          </h2>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-400 truncate">
          ABA, ACLEDA, Wing, Canadia...
        </span>
      </div>

      {/* Input Box (Flex-1 to expand down to SMS Div) */}
      <div className="mt-2 flex-1 min-h-0 flex flex-col">
        <textarea
          id="transaction-pasted-input"
          className={`flex-1 min-h-[85px] sm:min-h-[100px] w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-2.5 font-mono text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 ${activeTheme.focusRing} focus:outline-hidden transition resize-none`}
          placeholder={t.placeholderPaste}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        {/* Action Controls Row */}
        <div className="mt-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1.5">
            <button
              id="btn-fast-paste"
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
            >
              <Clipboard className={`h-3 w-3 ${activeTheme.textAccent}`} />
              {lang === 'en' ? 'Paste' : 'បញ្ចូល'}
            </button>
            {inputText && (
              <button
                id="btn-clear-paste"
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                {lang === 'en' ? 'Clear' : 'ជម្រះ'}
              </button>
            )}
          </div>

          <button
            id="btn-process-pasted"
            type="button"
            disabled={!inputText.trim() || !previewResult || previewResult.parsed.length === 0}
            onClick={handleProcessImport}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer ${
              !inputText.trim() || !previewResult || previewResult.parsed.length === 0
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                : `${activeTheme.btnPrimaryBg} ${activeTheme.btnPrimaryHover}`
            }`}
          >
            <Play className="h-3 w-3 fill-current" />
            {t.parseImport} ({previewResult ? previewResult.parsed.length : 0} {lang === 'en' ? 'New' : 'ថ្មី'})
          </button>
        </div>
      </div>

      {/* Real-time Parse feedback preview */}
      {previewResult && (
        <div className="mt-2 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 p-2 text-xs shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-gray-400" />
              {lang === 'en' ? 'Detected' : 'រកឃើញ'}:
            </span>
            <div className="flex items-center gap-2">
              <span className={`${activeTheme.textAccent} font-bold`}>
                +{previewResult.parsed.length} {lang === 'en' ? 'new' : 'ថ្មី'}
              </span>
              {previewResult.skippedCount > 0 && (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  ({previewResult.skippedCount} {t.duplicateText})
                </span>
              )}
              {previewResult.reviewCount > 0 && (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  [{previewResult.reviewCount} {t.needsReview}]
                </span>
              )}
            </div>
          </div>

          {previewResult.skippedCount > 0 && (
            <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
              {lang === 'en' 
                ? '⚠️ Duplicate items detected and will be skipped to prevent double counts.' 
                : '⚠️ ប្រតិបត្តិការស្ទួននឹងត្រូវបានរំលងដើម្បីការពារការកត់ត្រាជាន់គ្នា។'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
