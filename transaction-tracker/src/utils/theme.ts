/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeColor } from '../types';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  dotBg: string;
  activeRing: string;
  
  // Card and Div Border accents
  cardBorder: string;
  cardHover: string;
  containerBorder: string;
  
  // Primary Button styles
  btnPrimaryBg: string;
  btnPrimaryHover: string;
  
  // Text accents
  textAccent: string;
  textAccentDark: string;
  
  // Icon and Badge styles
  iconBoxBg: string;
  iconBoxText: string;
  badgeBg: string;
  badgeText: string;
  
  // Focus ring
  focusRing: string;
  
  // Header accent
  headerTagBg: string;
  headerTagText: string;
  headerPulseDot: string;
}

export const THEME_CONFIGS: Record<ThemeColor, ThemeConfig> = {
  violet: {
    id: 'violet',
    name: 'Violet',
    dotBg: 'bg-violet-500',
    activeRing: 'ring-violet-500 ring-offset-2 ring-2',
    cardBorder: 'border-violet-200/90 dark:border-violet-800/60 shadow-violet-500/5',
    cardHover: 'hover:border-violet-400 dark:hover:border-violet-500',
    containerBorder: 'border-violet-200 dark:border-violet-800',
    btnPrimaryBg: 'bg-violet-600 dark:bg-violet-600 text-white',
    btnPrimaryHover: 'hover:bg-violet-500 dark:hover:bg-violet-500',
    textAccent: 'text-violet-600 dark:text-violet-400',
    textAccentDark: 'text-violet-700 dark:text-violet-300',
    iconBoxBg: 'bg-violet-50 dark:bg-violet-950/60',
    iconBoxText: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-700/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
    focusRing: 'focus:border-violet-500 focus:ring-violet-500/20',
    headerTagBg: 'bg-violet-50 dark:bg-violet-950/60 ring-violet-600/20',
    headerTagText: 'text-violet-700 dark:text-violet-300',
    headerPulseDot: 'bg-violet-500 dark:bg-violet-400'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    dotBg: 'bg-emerald-500',
    activeRing: 'ring-emerald-500 ring-offset-2 ring-2',
    cardBorder: 'border-emerald-200/90 dark:border-emerald-800/60 shadow-emerald-500/5',
    cardHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    containerBorder: 'border-emerald-200 dark:border-emerald-800',
    btnPrimaryBg: 'bg-emerald-600 dark:bg-emerald-600 text-white',
    btnPrimaryHover: 'hover:bg-emerald-500 dark:hover:bg-emerald-500',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    textAccentDark: 'text-emerald-700 dark:text-emerald-300',
    iconBoxBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconBoxText: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    headerTagBg: 'bg-emerald-50 dark:bg-emerald-950/60 ring-emerald-600/20',
    headerTagText: 'text-emerald-700 dark:text-emerald-300',
    headerPulseDot: 'bg-emerald-500 dark:bg-emerald-400'
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    dotBg: 'bg-amber-500',
    activeRing: 'ring-amber-500 ring-offset-2 ring-2',
    cardBorder: 'border-amber-200/90 dark:border-amber-800/60 shadow-amber-500/5',
    cardHover: 'hover:border-amber-400 dark:hover:border-amber-500',
    containerBorder: 'border-amber-200 dark:border-amber-800',
    btnPrimaryBg: 'bg-amber-600 dark:bg-amber-600 text-white',
    btnPrimaryHover: 'hover:bg-amber-500 dark:hover:bg-amber-500',
    textAccent: 'text-amber-600 dark:text-amber-400',
    textAccentDark: 'text-amber-700 dark:text-amber-300',
    iconBoxBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconBoxText: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-700/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    focusRing: 'focus:border-amber-500 focus:ring-amber-500/20',
    headerTagBg: 'bg-amber-50 dark:bg-amber-950/60 ring-amber-600/20',
    headerTagText: 'text-amber-700 dark:text-amber-300',
    headerPulseDot: 'bg-amber-500 dark:bg-amber-400'
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    dotBg: 'bg-rose-500',
    activeRing: 'ring-rose-500 ring-offset-2 ring-2',
    cardBorder: 'border-rose-200/90 dark:border-rose-800/60 shadow-rose-500/5',
    cardHover: 'hover:border-rose-400 dark:hover:border-rose-500',
    containerBorder: 'border-rose-200 dark:border-rose-800',
    btnPrimaryBg: 'bg-rose-600 dark:bg-rose-600 text-white',
    btnPrimaryHover: 'hover:bg-rose-500 dark:hover:bg-rose-500',
    textAccent: 'text-rose-600 dark:text-rose-400',
    textAccentDark: 'text-rose-700 dark:text-rose-300',
    iconBoxBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconBoxText: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-700/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    focusRing: 'focus:border-rose-500 focus:ring-rose-500/20',
    headerTagBg: 'bg-rose-50 dark:bg-rose-950/60 ring-rose-600/20',
    headerTagText: 'text-rose-700 dark:text-rose-300',
    headerPulseDot: 'bg-rose-500 dark:bg-rose-400'
  },
  sky: {
    id: 'sky',
    name: 'Sky',
    dotBg: 'bg-sky-500',
    activeRing: 'ring-sky-500 ring-offset-2 ring-2',
    cardBorder: 'border-sky-200/90 dark:border-sky-800/60 shadow-sky-500/5',
    cardHover: 'hover:border-sky-400 dark:hover:border-sky-500',
    containerBorder: 'border-sky-200 dark:border-sky-800',
    btnPrimaryBg: 'bg-sky-600 dark:bg-sky-600 text-white',
    btnPrimaryHover: 'hover:bg-sky-500 dark:hover:bg-sky-500',
    textAccent: 'text-sky-600 dark:text-sky-400',
    textAccentDark: 'text-sky-700 dark:text-sky-300',
    iconBoxBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconBoxText: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-700/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    focusRing: 'focus:border-sky-500 focus:ring-sky-500/20',
    headerTagBg: 'bg-sky-50 dark:bg-sky-950/60 ring-sky-600/20',
    headerTagText: 'text-sky-700 dark:text-sky-300',
    headerPulseDot: 'bg-sky-500 dark:bg-sky-400'
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    dotBg: 'bg-indigo-500',
    activeRing: 'ring-indigo-500 ring-offset-2 ring-2',
    cardBorder: 'border-indigo-200/90 dark:border-indigo-800/60 shadow-indigo-500/5',
    cardHover: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    containerBorder: 'border-indigo-200 dark:border-indigo-800',
    btnPrimaryBg: 'bg-indigo-600 dark:bg-indigo-600 text-white',
    btnPrimaryHover: 'hover:bg-indigo-500 dark:hover:bg-indigo-500',
    textAccent: 'text-indigo-600 dark:text-indigo-400',
    textAccentDark: 'text-indigo-700 dark:text-indigo-300',
    iconBoxBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconBoxText: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    focusRing: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    headerTagBg: 'bg-indigo-50 dark:bg-indigo-950/60 ring-indigo-600/20',
    headerTagText: 'text-indigo-700 dark:text-indigo-300',
    headerPulseDot: 'bg-indigo-500 dark:bg-indigo-400'
  }
};

export const THEME_COLOR_LIST: ThemeColor[] = ['violet', 'emerald', 'amber', 'rose', 'sky', 'indigo'];
