/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Files, AlertCircle, Calendar } from 'lucide-react';
import { SummaryStats, Language, ThemeColor } from '../types';
import { translations } from '../utils/lang';
import { THEME_CONFIGS } from '../utils/theme';

interface SummaryCardsProps {
  stats: SummaryStats;
  lang: Language;
  themeColor?: ThemeColor;
  onFilterNeedsReview?: () => void;
}

export default function SummaryCards({ stats, lang, themeColor = 'emerald', onFilterNeedsReview }: SummaryCardsProps) {
  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatKHR = (value: number) => {
    return new Intl.NumberFormat('km-KH', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' ៛';
  };

  const isAllTimeNetUSDNegative = stats.allTimeNetUSD < 0;
  const isAllTimeNetKHRNegative = stats.allTimeNetKHR < 0;

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full shrink-0">
      
      {/* 1. Total Income Card */}
      <div 
        id="stat-card-total-income" 
        className={`relative flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 p-3 sm:p-4 border ${activeTheme.cardBorder} shadow-xs ${activeTheme.cardHover} transition-all duration-200 col-span-2`}
      >
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 mb-1">
          <span className={`text-xs sm:text-sm font-extrabold ${activeTheme.textAccent} truncate`} title={t.totalIncome}>
            {t.totalIncome}
          </span>
          <div className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${activeTheme.iconBoxBg} ${activeTheme.iconBoxText}`}>
            <ArrowUpRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          {/* Today's Income */}
          <div className={`rounded-xl ${activeTheme.badgeBg} p-2 sm:p-2.5 space-y-1 shadow-2xs`}>
            <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold ${activeTheme.badgeText} truncate`}>
              <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate" title={t.todayLabel}>{t.todayLabel}:</span>
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">USD:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-gray-900 dark:text-white text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatUSD(stats.todayIncomeUSD)}>
                {formatUSD(stats.todayIncomeUSD)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5 border-t border-emerald-200/60 dark:border-emerald-800/40 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">KHR:</span>
              <span className={`font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${activeTheme.textAccent}`} title={formatKHR(stats.todayIncomeKHR)}>
                {formatKHR(stats.todayIncomeKHR)}
              </span>
            </div>
          </div>

          {/* Date Range Search Income */}
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/90 p-2 sm:p-2.5 border border-gray-200 dark:border-slate-700 space-y-1 shadow-2xs">
            <div className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 truncate" title={t.rangeLabel}>
              {t.rangeLabel}:
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">USD:</span>
              <span className={`font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${activeTheme.textAccent}`} title={formatUSD(stats.rangeIncomeUSD)}>
                {formatUSD(stats.rangeIncomeUSD)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5 border-t border-gray-200/60 dark:border-slate-700/60 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">KHR:</span>
              <span className={`font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${activeTheme.textAccent}`} title={formatKHR(stats.rangeIncomeKHR)}>
                {formatKHR(stats.rangeIncomeKHR)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Total Expense Card */}
      <div 
        id="stat-card-total-expense" 
        className="relative flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 col-span-2"
      >
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 mb-1">
          <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 truncate" title={t.totalExpenses}>
            {t.totalExpenses}
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg shrink-0 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <ArrowDownRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          {/* Today's Expense */}
          <div className="rounded-xl bg-rose-50/70 dark:bg-rose-950/40 p-2 sm:p-2.5 space-y-1 shadow-2xs border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="truncate" title={t.todayLabel}>{t.todayLabel}:</span>
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-rose-700/80 dark:text-rose-300/80 uppercase shrink-0">USD:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-700 dark:text-rose-300 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatUSD(stats.todayExpenseUSD || 0)}>
                {formatUSD(stats.todayExpenseUSD || 0)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5 border-t border-rose-200/50 dark:border-rose-900/40 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-rose-700/80 dark:text-rose-300/80 uppercase shrink-0">KHR:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-700 dark:text-rose-300 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatKHR(stats.todayExpenseKHR || 0)}>
                {formatKHR(stats.todayExpenseKHR || 0)}
              </span>
            </div>
          </div>

          {/* Date Range Search Expense */}
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/90 p-2 sm:p-2.5 border border-gray-200 dark:border-slate-700 space-y-1 shadow-2xs">
            <div className="text-[10px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 truncate" title={t.rangeLabel}>
              {t.rangeLabel}:
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">USD:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-600 dark:text-rose-400 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatUSD(stats.rangeExpenseUSD || 0)}>
                {formatUSD(stats.rangeExpenseUSD || 0)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-0.5 border-t border-gray-200/60 dark:border-slate-700/60 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">KHR:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-600 dark:text-rose-400 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatKHR(stats.rangeExpenseKHR || 0)}>
                {formatKHR(stats.rangeExpenseKHR || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Total Transactions Card (75% Width) */}
      <div 
        id="stat-card-total-transactions" 
        className={`relative flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 p-3 sm:p-4 border ${activeTheme.cardBorder} shadow-xs ${activeTheme.cardHover} transition-all duration-200 col-span-3`}
      >
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate" title={t.totalTransactions}>
              {t.totalTransactions}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-semibold truncate">
              ({stats.allTimeTotalCount} {lang === 'en' ? 'records' : 'កំណត់ត្រា'})
            </span>
          </div>
          <div className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${(isAllTimeNetUSDNegative || isAllTimeNetKHRNegative) ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : `${activeTheme.iconBoxBg} ${activeTheme.iconBoxText}`}`}>
            <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-1">
          {/* Net Balance */}
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/90 p-2 sm:p-2.5 border border-gray-200/80 dark:border-slate-700 space-y-1 shadow-2xs">
            <div className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
              {lang === 'en' ? 'Net Balance' : 'តុល្យភាពសរុប'}
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-600 dark:text-slate-300 uppercase shrink-0">USD:</span>
              <span className={`font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${isAllTimeNetUSDNegative ? 'text-rose-600 dark:text-rose-400' : activeTheme.textAccent}`} title={formatUSD(stats.allTimeNetUSD)}>
                {formatUSD(stats.allTimeNetUSD)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-gray-200/60 dark:border-slate-700/60 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase shrink-0">KHR:</span>
              <span className={`font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${isAllTimeNetKHRNegative ? 'text-rose-600 dark:text-rose-400' : activeTheme.textAccent}`} title={formatKHR(stats.allTimeNetKHR)}>
                {formatKHR(stats.allTimeNetKHR)}
              </span>
            </div>
          </div>

          {/* All-time Expenses */}
          <div className="rounded-xl bg-rose-50/70 dark:bg-rose-950/30 p-2 sm:p-2.5 border border-rose-100 dark:border-rose-900/40 space-y-1 shadow-2xs">
            <div className="text-[10px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-0.5">
              {lang === 'en' ? 'Total Expenses' : 'ចំណាយសរុប'}
            </div>
            <div className="flex items-baseline justify-between gap-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-rose-800 dark:text-rose-200 uppercase shrink-0">USD:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-600 dark:text-rose-400 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatUSD(stats.allTimeTotalExpenseUSD || 0)}>
                {formatUSD(stats.allTimeTotalExpenseUSD || 0)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-rose-100 dark:border-rose-900/40 min-w-0">
              <span className="text-[10px] sm:text-xs font-extrabold text-rose-700 dark:text-rose-300 uppercase shrink-0">KHR:</span>
              <span className="font-mono font-black text-xs xs:text-sm sm:text-base lg:text-base xl:text-lg text-rose-600 dark:text-rose-400 text-right min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" title={formatKHR(stats.allTimeTotalExpenseKHR || 0)}>
                {formatKHR(stats.allTimeTotalExpenseKHR || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Flagged Reviews Card */}
      <div 
        id="stat-card-needs-review" 
        onClick={onFilterNeedsReview}
        role={onFilterNeedsReview ? 'button' : undefined}
        tabIndex={onFilterNeedsReview ? 0 : undefined}
        className={`relative flex flex-col justify-between rounded-xl bg-white dark:bg-slate-900 p-3 sm:p-4 border ${activeTheme.cardBorder} shadow-xs ${activeTheme.cardHover} transition-all duration-200 col-span-1 ${onFilterNeedsReview ? 'cursor-pointer hover:border-rose-300 dark:hover:border-rose-700' : ''}`}
        title={stats.reviewCount > 0 ? (stats.reviewDateText || t.summaryMissing) : undefined}
      >
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 mb-1">
          <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 truncate" title={t.needsReview}>
            {t.needsReview}
          </span>
          <div className="p-1 sm:p-1.5 rounded-lg shrink-0 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/90 p-1.5 sm:p-3.5 border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2 shadow-2xs min-h-[85px] sm:min-h-[95px] text-center sm:text-left">
            <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-4xl xl:text-5xl leading-none font-black tracking-tight font-mono text-rose-600 dark:text-rose-400">
              {stats.reviewCount}
            </span>
            {stats.reviewCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-rose-100 dark:bg-rose-950/70 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold text-rose-700 dark:text-rose-300 shrink-0">
                {lang === 'en' ? 'Flagged' : 'សម្គាល់'}
              </span>
            )}
          </div>
          <p 
            className={`text-[10px] sm:text-[12px] font-semibold pt-1 border-t border-gray-100 dark:border-slate-800 truncate ${
              stats.reviewCount > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-400 dark:text-slate-500'
            }`}
            title={stats.reviewCount > 0 ? stats.reviewDateText : t.summaryMissing}
          >
            {stats.reviewCount > 0 
              ? (stats.reviewDateText || t.summaryMissing)
              : (lang === 'en' ? 'No missing fields' : 'គ្មានទិន្នន័យខ្វះខាត')}
          </p>
        </div>
      </div>

    </div>
  );
}
