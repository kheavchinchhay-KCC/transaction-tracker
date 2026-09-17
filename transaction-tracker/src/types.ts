/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'UNKNOWN';
export type Language = 'en' | 'km';
export type ThemeColor = 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number | null; // Null if "Needs review" (non-numeric or missing)
  currency: 'USD' | 'KHR';
  date: string;          // e.g., "Jun 12"
  time: string;          // e.g., "12:26 PM"
  merchant: string;      // Merchant / Payee / Payer or location
  payerPayee: string;    // Payer / Payee holding details (e.g., "CHHEANG SREYHOUCH...")
  source: string;        // Channel/Source e.g., "ABA PAY", "Mobile Banking"
  transactionId: string; // Trx. ID e.g., "178124197042803"
  apv: string;           // APV e.g., "612744"
  remark: string;        // Remark or notes if present
  rawText: string;       // Full raw pasted text
  fingerprint: string;   // Normalization-based key for duplicate check when Trx ID & APV are incomplete
  needsReview: boolean;  // True if amount is null or essential fields are missing
  createdAt: number;     // Timestamp
  updatedAt: number;     // Timestamp
}

export interface ParseResult {
  parsed: Transaction[];
  duplicates: Transaction[];
  skippedCount: number;
  reviewCount: number;
}

export interface SummaryStats {
  // All transactions (all time)
  allTimeNetUSD: number;
  allTimeNetKHR: number;
  allTimeTotalCount: number;
  allTimeTotalIncomeUSD: number;
  allTimeTotalIncomeKHR: number;
  allTimeTotalExpenseUSD: number;
  allTimeTotalExpenseKHR: number;
  
  // Today's stats (current calendar date)
  todayIncomeUSD: number;
  todayIncomeKHR: number;
  todayExpenseUSD?: number;
  todayExpenseKHR?: number;
  todayNetUSD?: number;
  todayNetKHR?: number;
  todayCount: number;
  
  // Date range / Search filter stats
  rangeIncomeUSD: number;
  rangeIncomeKHR: number;
  rangeExpenseUSD?: number;
  rangeExpenseKHR?: number;
  rangeNetUSD?: number;
  rangeNetKHR?: number;
  rangeTotalCount: number;
  
  // Flagged Review stats
  reviewCount: number;
  reviewDateText?: string;

  // Backwards compatibility aliases
  totalIncomeUSD?: number;
  totalExpenseUSD?: number;
  netBalanceUSD?: number;
  totalIncomeKHR?: number;
  totalExpenseKHR?: number;
  netBalanceKHR?: number;
  totalCount?: number;
}

export interface QueryFilter {
  search: string;
  type: TransactionType | 'ALL';
  needsReview: 'ALL' | 'true' | 'false' | boolean;
  source: string;
  dateStart: string;
  dateEnd: string;
  selectedDate?: string;
  selectedMonth?: string;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
