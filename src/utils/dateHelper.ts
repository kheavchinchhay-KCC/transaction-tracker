/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { translateKhmerDigits } from './parser';

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const KHMER_MONTHS_MAP: { [key: string]: number } = {
  'មករា': 0,
  'កុម្ភៈ': 1,
  'មីនា': 2,
  'មេសា': 3,
  'ឧសភា': 4,
  'មិថុនា': 5,
  'កក្កដា': 6,
  'សីហា': 7,
  'កញ្ញា': 8,
  'តុលា': 9,
  'វិច្ឆិកា': 10,
  'ធ្នូ': 11,
};

/**
 * Get current date in standard YYYY-MM-DD format
 */
export function getTodayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get yesterday's date in standard YYYY-MM-DD format
 */
export function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse any transaction date string to a Date object at noon (12:00:00)
 */
export function parseTxDateObject(dateStr: string): Date | null {
  if (!dateStr) return null;

  // First translate any Khmer digits (e.g. ០១២៣៤៥៦៧៨៩)
  let clean = translateKhmerDigits(dateStr.trim().toLowerCase());

  // Check Khmer month words
  for (const [km, monthIdx] of Object.entries(KHMER_MONTHS_MAP)) {
    if (clean.includes(km)) {
      const numMatch = clean.match(/\d{1,4}/g);
      const currentYear = new Date().getFullYear();
      let day = 1;
      let year = currentYear;
      if (numMatch && numMatch.length > 0) {
        day = parseInt(numMatch[0], 10);
        if (numMatch.length > 1 && parseInt(numMatch[1], 10) > 1000) {
          year = parseInt(numMatch[1], 10);
        }
      }
      return new Date(year, monthIdx, day, 12, 0, 0, 0);
    }
  }

  // 1. Check for named months (e.g., "Aug 6, 2026" or "Jun 12" or "12 Jun 2026")
  for (let mIdx = 0; mIdx < MONTH_NAMES.length; mIdx++) {
    const mName = MONTH_NAMES[mIdx];
    if (clean.includes(mName)) {
      const currentYear = new Date().getFullYear();
      const numbers = clean.match(/\d{1,4}/g);
      let day = 1;
      let year = currentYear;
      if (numbers && numbers.length > 0) {
        day = parseInt(numbers[0], 10);
        if (numbers.length > 1) {
          const secondNum = parseInt(numbers[1], 10);
          if (secondNum > 1000) {
            year = secondNum;
          } else {
            // maybe "2026 Aug 6"
            if (day > 1000) {
              year = day;
              day = secondNum;
            }
          }
        }
      }
      return new Date(year, mIdx, day, 12, 0, 0, 0);
    }
  }

  // 2. Check for numeric separators: YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  const parts = clean.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
  if (parts) {
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    const p3 = parseInt(parts[3], 10);

    // Case A: p1 is 4-digit year (YYYY-MM-DD or YYYY/MM/DD)
    if (p1 > 1000) {
      return new Date(p1, p2 - 1, p3, 12, 0, 0, 0);
    }
    // Case B: p3 is 4-digit year
    if (p3 > 1000) {
      // If p1 > 12, p1 is definitely day -> DD/MM/YYYY
      if (p1 > 12) {
        return new Date(p3, p2 - 1, p1, 12, 0, 0, 0);
      }
      // If p2 > 12, p2 is day -> MM/DD/YYYY
      if (p2 > 12) {
        return new Date(p3, p1 - 1, p2, 12, 0, 0, 0);
      }
      // Ambiguous (e.g. 06/08/2026). Let's check current date month/day or default to DD/MM/YYYY (Cambodia standard)
      // Check if p2 matches current month
      const currentMonth = new Date().getMonth() + 1;
      if (p2 === currentMonth) {
        return new Date(p3, p2 - 1, p1, 12, 0, 0, 0);
      } else if (p1 === currentMonth) {
        return new Date(p3, p1 - 1, p2, 12, 0, 0, 0);
      }
      return new Date(p3, p2 - 1, p1, 12, 0, 0, 0);
    }
  }

  // 3. Fallback standard Date.parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  return null;
}

/**
 * Checks if a transaction date corresponds to the current local calendar date (Today).
 * Highly tolerant to month names, digit padding, formats, and year rollover.
 */
export function isDateToday(dateStr: string): boolean {
  if (!dateStr) return false;

  const today = new Date();
  const txDate = parseTxDateObject(dateStr);

  if (txDate) {
    return (
      txDate.getFullYear() === today.getFullYear() &&
      txDate.getMonth() === today.getMonth() &&
      txDate.getDate() === today.getDate()
    );
  }

  // String fallback heuristics
  const clean = translateKhmerDigits(dateStr.trim().toLowerCase());
  const currentMonthIdx = today.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();

  // If contains current month name and current day
  if (clean.includes(currentMonthName)) {
    const dayRegex = new RegExp(`\\b0?${currentDay}\\b`);
    if (dayRegex.test(clean)) return true;
  }

  // Check numeric representations
  const mm = String(currentMonthIdx + 1).padStart(2, '0');
  const dd = String(currentDay).padStart(2, '0');
  const mmShort = String(currentMonthIdx + 1);
  const ddShort = String(currentDay);

  if (
    clean.includes(`${dd}/${mm}/${currentYear}`) ||
    clean.includes(`${ddShort}/${mmShort}/${currentYear}`) ||
    clean.includes(`${currentYear}-${mm}-${dd}`) ||
    clean.includes(`${mm}/${dd}/${currentYear}`)
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a date string falls inside the [dateStart, dateEnd] range (inclusive).
 * dateStart and dateEnd are in "YYYY-MM-DD" format.
 */
export function isDateInRange(
  dateStr: string, 
  startDateISO?: string, 
  endDateISO?: string
): boolean {
  if (!startDateISO && !endDateISO) return true;

  const txDate = parseTxDateObject(dateStr);
  if (txDate !== null) {
    const txTime = txDate.getTime();
    if (startDateISO) {
      const startTime = new Date(startDateISO + 'T00:00:00').getTime();
      if (txTime < startTime) return false;
    }
    if (endDateISO) {
      const endTime = new Date(endDateISO + 'T23:59:59').getTime();
      if (txTime > endTime) return false;
    }
    return true;
  }

  // Fallback string matching if unparseable
  const clean = dateStr.toLowerCase().trim();
  if (startDateISO && clean.includes(startDateISO.toLowerCase())) return true;
  if (endDateISO && clean.includes(endDateISO.toLowerCase())) return true;
  return false;
}

/**
 * Helper to format a Date object into standard YYYY-MM-DD ISO string
 */
export function formatDateToISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get ISO date range for This Week (Monday of the current week to Sunday of the current week)
 */
export function getThisWeekRangeISO(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  // Calculate difference to Monday
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: formatDateToISO(monday),
    end: formatDateToISO(sunday),
  };
}

/**
 * Get ISO date range for This Month (1st day of current month to last day of current month)
 */
export function getThisMonthRangeISO(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startObj = new Date(year, month, 1);
  const endObj = new Date(year, month + 1, 0); // Last day of current month
  
  return {
    start: formatDateToISO(startObj),
    end: formatDateToISO(endObj),
  };
}

/**
 * Get ISO date range for Previous Month (1st day of previous month to last day of previous month)
 */
export function getPreviousMonthRangeISO(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Previous month handles year rollover automatically in Date constructor
  const startObj = new Date(year, month - 1, 1);
  const endObj = new Date(year, month, 0); // Last day of previous month
  
  return {
    start: formatDateToISO(startObj),
    end: formatDateToISO(endObj),
  };
}

/**
 * Format a Date to standard short display (e.g. "Aug 06")
 */
export function formatShortMonthDay(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  return `${month} ${day}`;
}

/**
 * Compute the formatted Missing/Needs Review Date summary string.
 * Examples:
 * - Single exact date: "(missing on date: Aug 06)"
 * - Multiple dates: "(missing on date: Aug 06 - Aug 10)"
 * - No missing items: "No missing fields"
 */
export function getMissingTransactionsDateSummary(
  transactions: { needsReview?: boolean; date?: string; createdAt?: number }[],
  lang: 'en' | 'km' = 'en'
): string {
  const missingTxs = transactions.filter((tx) => tx.needsReview);
  if (missingTxs.length === 0) {
    return lang === 'en' ? 'No missing fields' : 'គ្មានទិន្នន័យខ្វះខាត';
  }

  // Parse and collect all valid dates
  const parsedDates: { dateObj: Date; raw: string }[] = [];
  missingTxs.forEach((tx) => {
    if (tx.date) {
      const d = parseTxDateObject(tx.date);
      if (d) {
        parsedDates.push({ dateObj: d, raw: tx.date });
      } else if (tx.date.trim()) {
        parsedDates.push({ dateObj: new Date(tx.createdAt || Date.now()), raw: tx.date.trim() });
      }
    } else if (tx.createdAt) {
      parsedDates.push({ dateObj: new Date(tx.createdAt), raw: '' });
    }
  });

  if (parsedDates.length === 0) {
    return lang === 'en' ? '(missing on date: Unspecified)' : '(ខ្វះលើកាលបរិច្ឆេទមិនច្បាស់)';
  }

  // Sort dates chronologically
  parsedDates.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const firstDate = parsedDates[0].dateObj;
  const lastDate = parsedDates[parsedDates.length - 1].dateObj;

  const firstFormatted = formatShortMonthDay(firstDate);
  const lastFormatted = formatShortMonthDay(lastDate);

  const isSameDay = 
    firstDate.getFullYear() === lastDate.getFullYear() &&
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getDate() === lastDate.getDate();

  if (isSameDay) {
    return lang === 'en'
      ? `(missing on date: ${firstFormatted})`
      : `(ខ្វះនៅថ្ងៃ៖ ${firstFormatted})`;
  } else {
    return lang === 'en'
      ? `(missing on date: ${firstFormatted} - ${lastFormatted})`
      : `(ខ្វះនៅថ្ងៃ៖ ${firstFormatted} - ${lastFormatted})`;
  }
}
