/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ArrowUpDown, Edit, Trash2, HelpCircle, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Printer, ListFilter, RefreshCw, PlusCircle
} from 'lucide-react';
import { Transaction, QueryFilter, Language, ThemeColor } from '../types';
import { translations } from '../utils/lang';
import { isDateInRange, getTodayISO, getYesterdayISO, parseTxDateObject, getThisWeekRangeISO, getThisMonthRangeISO, getPreviousMonthRangeISO, formatDateToISO } from '../utils/dateHelper';
import { THEME_CONFIGS } from '../utils/theme';

interface TransactionTableProps {
  transactions: Transaction[];
  onEditClick: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
  lang: Language;
  themeColor?: ThemeColor;
  onFilteredTransactionsChange?: (filtered: Transaction[]) => void;
  reviewFilterTrigger?: number;
}

const KNOWN_STANDARD_SOURCES = [
  'ABA PAY',
  'ACLEDA Mobile',
  'Wing Bank',
  'Canadia Bank',
  'Sathapana ToanChet',
  'Prince Mobile',
  'Bakong'
];

export default function TransactionTable({
  transactions,
  onEditClick,
  onDeleteClick,
  lang,
  themeColor = 'emerald',
  onFilteredTransactionsChange,
  reviewFilterTrigger
}: TransactionTableProps) {
  // Filter & Search state: Date search defaults to Current Date (Today)
  const [filter, setFilter] = useState<QueryFilter>(() => {
    const today = getTodayISO();
    return {
      search: '',
      type: 'ALL',
      needsReview: 'ALL',
      source: 'ALL',
      dateStart: today,
      dateEnd: today,
      selectedDate: '',
      selectedMonth: 'ALL',
      sortBy: 'date',
      sortOrder: 'desc'
    };
  });

  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;

  // Pagination (Customizable rows per page: 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)
  const ROW_OPTIONS = [5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Compute distinct sources present in the data
  const distinctSources = useMemo(() => {
    const sources = new Set<string>();
    KNOWN_STANDARD_SOURCES.forEach(s => sources.add(s));
    transactions.forEach((tx) => {
      if (tx.source && tx.source !== 'Others' && tx.source !== 'Mobile Banking') {
        sources.add(tx.source);
      }
    });
    return Array.from(sources);
  }, [transactions]);

  // Auto-detect newly added or modified manual/missing transactions and update the filter to match their date
  useEffect(() => {
    if (transactions.length > 0) {
      let latestTx: Transaction | null = null;
      let maxTime = 0;

      transactions.forEach((tx) => {
        const t = tx.updatedAt || tx.createdAt || 0;
        if (t > maxTime) {
          maxTime = t;
          latestTx = tx;
        }
      });

      // If this transaction was saved or edited within the last 3.5 seconds, focus the filter on its date
      if (latestTx && Date.now() - maxTime < 3500) {
        const txDateObj = parseTxDateObject((latestTx as Transaction).date);
        if (txDateObj) {
          const isoDate = formatDateToISO(txDateObj);
          setFilter((prev) => ({
            ...prev,
            dateStart: isoDate,
            dateEnd: isoDate,
            selectedMonth: 'ALL',
            needsReview: 'ALL',
            search: ''
          }));
          setCurrentPage(1);
        }
      }
    }
  }, [transactions]);

  // Handle Sort Change
  const handleSort = (field: 'date' | 'amount' | 'createdAt') => {
    setFilter((prev) => {
      const isCurrent = prev.sortBy === field;
      return {
        ...prev,
        sortBy: field,
        sortOrder: isCurrent && prev.sortOrder === 'desc' ? 'asc' : 'desc'
      };
    });
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search Query
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter((tx) => 
        (tx.merchant?.toLowerCase() || '').includes(q) ||
        (tx.payerPayee?.toLowerCase() || '').includes(q) ||
        (tx.remark?.toLowerCase() || '').includes(q) ||
        (tx.transactionId?.toLowerCase() || '').includes(q) ||
        (tx.apv?.toLowerCase() || '').includes(q) ||
        (tx.source?.toLowerCase() || '').includes(q) ||
        (tx.rawText?.toLowerCase() || '').includes(q)
      );
    }

    // 2. Needs Review Filter
    if (filter.needsReview !== 'ALL') {
      const flag = filter.needsReview === 'true';
      result = result.filter((tx) => tx.needsReview === flag);
    }

    // 2b. Type Filter (INCOME, EXPENSE, UNKNOWN, or ALL)
    if (filter.type && filter.type !== 'ALL') {
      result = result.filter((tx) => tx.type === filter.type);
    }

    // 3. Source Filter (includes "OTHERS")
    if (filter.source !== 'ALL') {
      if (filter.source === 'OTHERS') {
        const standardLower = KNOWN_STANDARD_SOURCES.map(s => s.toLowerCase());
        result = result.filter((tx) => {
          const s = (tx.source || '').toLowerCase().trim();
          if (!s || s === 'mobile banking' || s === 'unknown' || s === 'others' || s === 'other') return true;
          return !standardLower.some(std => s.includes(std));
        });
      } else {
        result = result.filter((tx) => tx.source?.toLowerCase().trim() === filter.source.toLowerCase().trim());
      }
    }

    // 4. Date boundaries range filtering (defaults to today, inclusive)
    if (filter.dateStart || filter.dateEnd) {
      result = result.filter((tx) => isDateInRange(tx.date, filter.dateStart, filter.dateEnd));
    }

    // 5. Month Selection Filter
    if (filter.selectedMonth && filter.selectedMonth !== 'ALL') {
      const monthNum = parseInt(filter.selectedMonth, 10);
      result = result.filter((tx) => {
        const dObj = parseTxDateObject(tx.date);
        if (dObj) {
          return dObj.getMonth() + 1 === monthNum;
        }
        return false;
      });
    }

    // 6. Sorting Logic
    result.sort((a, b) => {
      if (filter.sortBy === 'amount') {
        const amtA = a.amount || 0;
        const amtB = b.amount || 0;
        return filter.sortOrder === 'asc' ? amtA - amtB : amtB - amtA;
      } else if (filter.sortBy === 'createdAt') {
        return filter.sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      } else {
        const dObjA = parseTxDateObject(a.date);
        const dObjB = parseTxDateObject(b.date);
        const scoreA = dObjA ? dObjA.getTime() : a.createdAt;
        const scoreB = dObjB ? dObjB.getTime() : b.createdAt;
        return filter.sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
    });

    return result;
  }, [transactions, filter]);

  // Synchronize filtered transactions back to App state dynamically
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilteredTransactionsChange?.(processedTransactions);
    }, 0);
    return () => clearTimeout(handler);
  }, [processedTransactions, onFilteredTransactionsChange]);

  // Paginated partition
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));

  // Reset page on search adjustments
  const handleFilterChange = (updates: Partial<QueryFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleReviewSelectChange = (val: 'ALL' | 'true' | 'false') => {
    const today = getTodayISO();
    if (val === 'true') {
      const missingTxs = transactions.filter((t) => t.needsReview);
      if (missingTxs.length > 0) {
        const parsedDates = missingTxs
          .map((t) => parseTxDateObject(t.date))
          .filter((d): d is Date => d !== null);

        if (parsedDates.length > 0) {
          parsedDates.sort((a, b) => a.getTime() - b.getTime());
          const minDateStr = formatDateToISO(parsedDates[0]);
          const maxDateStr = formatDateToISO(parsedDates[parsedDates.length - 1]);
          handleFilterChange({
            needsReview: 'true',
            dateStart: minDateStr,
            dateEnd: maxDateStr,
            selectedMonth: 'ALL',
          });
          return;
        }
      }
      // If no valid dates in missing items, clear the date bounds so all missing across any date are immediately shown
      handleFilterChange({
        needsReview: 'true',
        dateStart: '',
        dateEnd: '',
        selectedMonth: 'ALL',
      });
    } else {
      // When review status is 'ALL' or 'false', revert back to current date (today)
      handleFilterChange({
        needsReview: val,
        dateStart: today,
        dateEnd: today,
        selectedMonth: 'ALL',
      });
    }
  };

  useEffect(() => {
    if (reviewFilterTrigger && reviewFilterTrigger > 0) {
      handleReviewSelectChange('true');
    }
  }, [reviewFilterTrigger]);

  const handleSetToday = () => {
    const today = getTodayISO();
    handleFilterChange({ dateStart: today, dateEnd: today, selectedMonth: 'ALL' });
  };

  const handleSetYesterday = () => {
    const yday = getYesterdayISO();
    handleFilterChange({ dateStart: yday, dateEnd: yday, selectedMonth: 'ALL' });
  };

  const handleSetThisWeek = () => {
    const range = getThisWeekRangeISO();
    handleFilterChange({ dateStart: range.start, dateEnd: range.end, selectedMonth: 'ALL' });
  };

  const handleSetThisMonth = () => {
    const range = getThisMonthRangeISO();
    handleFilterChange({ dateStart: range.start, dateEnd: range.end, selectedMonth: 'ALL' });
  };

  const handleSetPreviousMonth = () => {
    const range = getPreviousMonthRangeISO();
    handleFilterChange({ dateStart: range.start, dateEnd: range.end, selectedMonth: 'ALL' });
  };

  const handleClearDateRange = () => {
    handleFilterChange({ dateStart: '', dateEnd: '', selectedMonth: 'ALL' });
  };

  // Format amount with current currency symbol
  const formatTableAmount = (amount: number | null, currency: 'USD' | 'KHR', type: 'INCOME' | 'EXPENSE' | 'UNKNOWN') => {
    if (amount === null) return null;
    const sign = type === 'INCOME' ? '+' : type === 'EXPENSE' ? '-' : '';
    if (currency === 'KHR') {
      const formatted = new Intl.NumberFormat('km-KH', {
        style: 'decimal',
        minimumFractionDigits: 0,
      }).format(amount);
      return `${sign}${formatted} ៛`;
    }
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
    return `${sign}${formatted}`;
  };

  // 1. Export Formatted Excel Table (.xls) with Styled Headers and full Trx ID string preservation
  const handleExportExcel = () => {
    if (processedTransactions.length === 0) return;

    let totalUsdIncome = 0;
    let totalUsdExpense = 0;
    let totalKhrIncome = 0;
    let totalKhrExpense = 0;
    let totalUsdAmount = 0;
    let totalKhrAmount = 0;

    processedTransactions.forEach((tx) => {
      if (tx.amount !== null && !isNaN(tx.amount)) {
        if (tx.currency === 'KHR') {
          if (tx.type === 'EXPENSE') {
            totalKhrExpense += tx.amount;
            totalKhrAmount -= tx.amount;
          } else {
            totalKhrIncome += tx.amount;
            totalKhrAmount += tx.amount;
          }
        } else {
          if (tx.type === 'EXPENSE') {
            totalUsdExpense += tx.amount;
            totalUsdAmount -= tx.amount;
          } else {
            totalUsdIncome += tx.amount;
            totalUsdAmount += tx.amount;
          }
        }
      }
    });

    // Format Total Amounts header string matching user requirement
    let totalAmountsStr = '';
    const usdParts: string[] = [];
    const khrParts: string[] = [];
    if (totalUsdIncome > 0 || totalUsdExpense > 0 || totalUsdAmount !== 0) {
      usdParts.push(`$ ${totalUsdAmount.toFixed(2)}`);
    }
    if (totalKhrIncome > 0 || totalKhrExpense > 0 || totalKhrAmount !== 0) {
      khrParts.push(`${Math.round(totalKhrAmount).toLocaleString()} KHR`);
    }
    if (usdParts.length > 0 && khrParts.length > 0) {
      totalAmountsStr = `${usdParts.join('')} | ${khrParts.join('')}`;
    } else if (usdParts.length > 0) {
      totalAmountsStr = usdParts.join('');
    } else if (khrParts.length > 0) {
      totalAmountsStr = khrParts.join('');
    } else {
      totalAmountsStr = '$ 0.00';
    }

    const escapeHtml = (text: string) => {
      return (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const tableRows = processedTransactions.map((tx, idx) => {
      const formattedAmount = tx.amount !== null 
        ? (tx.currency === 'KHR' ? `${tx.amount.toLocaleString()} KHR` : `$${tx.amount.toFixed(2)}`)
        : 'Needs Review';
      
      const typeColor = tx.type === 'INCOME' ? '#059669' : tx.type === 'EXPENSE' ? '#dc2626' : '#64748b';
      const statusText = tx.needsReview ? 'Flagged / Needs Review' : 'Verified';
      const statusColor = tx.needsReview ? '#d97706' : '#059669';

      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; white-space: nowrap; mso-number-format:'\\@';">${escapeHtml(tx.date)} ${escapeHtml(tx.time)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; color: ${typeColor};">${escapeHtml(tx.type)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; text-align: right; font-family: monospace;">${formattedAmount}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${escapeHtml(tx.currency)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">${escapeHtml(tx.merchant)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">${escapeHtml(tx.payerPayee)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; white-space: nowrap;">${escapeHtml(tx.source || 'Other')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-family: monospace; white-space: nowrap; mso-number-format:'\\@';">${escapeHtml(tx.transactionId || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-family: monospace; white-space: nowrap; mso-number-format:'\\@';">${escapeHtml(tx.apv || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">${escapeHtml(tx.remark || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; color: ${statusColor}; text-align: center;">${statusText}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 9pt; color: #64748b;">${escapeHtml(tx.rawText)}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Transaction Ledger</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #334155; padding: 9px 12px; text-align: left; white-space: nowrap; }
          td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: middle; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h2 style="font-family: Calibri, Arial, sans-serif; color: #0f172a; margin-bottom: 8px;">Bank Transaction Ledger Export</h2>
        <p style="font-family: Calibri, Arial, sans-serif; font-size: 9.5pt; color: #64748b; margin-top: 0; margin-bottom: 12px;">Exported on: ${new Date().toLocaleString()} | Total Records: ${processedTransactions.length} | Total Amounts: ${totalAmountsStr}</p>
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">No.</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Currency</th>
              <th>Merchant / Description</th>
              <th>Payer / Payee</th>
              <th>Channel / Bank</th>
              <th>Trx ID</th>
              <th>APV Auth</th>
              <th>Remark</th>
              <th style="text-align: center;">Status</th>
              <th>Raw SMS Message</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; text-align: right; background-color: #f1f5f9;">Total / Net Amounts:</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: bold; text-align: right; font-family: monospace; background-color: #f1f5f9; color: ${totalUsdAmount >= 0 ? '#059669' : '#dc2626'};">${totalAmountsStr}</td>
              <td colspan="9" style="border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 9pt; color: #475569; background-color: #f1f5f9;">
                Total Records: ${processedTransactions.length} | USD: +$${totalUsdIncome.toFixed(2)} / -$${totalUsdExpense.toFixed(2)} (Net: $${totalUsdAmount.toFixed(2)}) ${totalKhrIncome > 0 || totalKhrExpense > 0 ? `| KHR: +${Math.round(totalKhrIncome).toLocaleString()} ៛ / -${Math.round(totalKhrExpense).toLocaleString()} ៛ (Net: ${Math.round(totalKhrAmount).toLocaleString()} ៛)` : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_ledger_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Clean Formatted CSV with UTF-8 BOM, full column headers, and guaranteed full Trx ID
  const handleExportCSV = () => {
    if (processedTransactions.length === 0) return;

    let totalUsdIncome = 0;
    let totalUsdExpense = 0;
    let totalKhrIncome = 0;
    let totalKhrExpense = 0;
    let totalUsdAmount = 0;
    let totalKhrAmount = 0;

    processedTransactions.forEach((tx) => {
      if (tx.amount !== null && !isNaN(tx.amount)) {
        if (tx.currency === 'KHR') {
          if (tx.type === 'EXPENSE') {
            totalKhrExpense += tx.amount;
            totalKhrAmount -= tx.amount;
          } else {
            totalKhrIncome += tx.amount;
            totalKhrAmount += tx.amount;
          }
        } else {
          if (tx.type === 'EXPENSE') {
            totalUsdExpense += tx.amount;
            totalUsdAmount -= tx.amount;
          } else {
            totalUsdIncome += tx.amount;
            totalUsdAmount += tx.amount;
          }
        }
      }
    });

    let totalAmountsStr = '';
    const usdParts: string[] = [];
    const khrParts: string[] = [];
    if (totalUsdIncome > 0 || totalUsdExpense > 0 || totalUsdAmount !== 0) {
      usdParts.push(`$ ${totalUsdAmount.toFixed(2)}`);
    }
    if (totalKhrIncome > 0 || totalKhrExpense > 0 || totalKhrAmount !== 0) {
      khrParts.push(`${Math.round(totalKhrAmount).toLocaleString()} KHR`);
    }
    if (usdParts.length > 0 && khrParts.length > 0) {
      totalAmountsStr = `${usdParts.join('')} | ${khrParts.join('')}`;
    } else if (usdParts.length > 0) {
      totalAmountsStr = usdParts.join('');
    } else if (khrParts.length > 0) {
      totalAmountsStr = khrParts.join('');
    } else {
      totalAmountsStr = '$ 0.00';
    }

    const headers = [
      'No.',
      'Date',
      'Time',
      'Type',
      'Amount (USD)',
      'Amount (KHR)',
      'Currency',
      'Merchant / Description',
      'Payer / Payee',
      'Channel / Source',
      'Transaction ID',
      'APV Auth Code',
      'Remark',
      'Status',
      'Raw Message'
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = processedTransactions.map((t, idx) => {
      const usdVal = t.currency === 'USD' && t.amount !== null ? t.amount.toFixed(2) : (t.amount !== null && t.currency !== 'KHR' ? t.amount.toFixed(2) : '');
      const khrVal = t.currency === 'KHR' && t.amount !== null ? Math.round(t.amount).toString() : '';
      
      // Preserve full numeric transaction ID without Excel scientific notation truncation
      const fullTrxId = t.transactionId ? `="${t.transactionId.replace(/"/g, '""')}"` : '""';
      const fullApv = t.apv ? `="${t.apv.replace(/"/g, '""')}"` : '""';

      return [
        idx + 1,
        escapeCsv(t.date),
        escapeCsv(t.time),
        escapeCsv(t.type),
        usdVal ? `"${usdVal}"` : '""',
        khrVal ? `"${khrVal}"` : '""',
        escapeCsv(t.currency),
        escapeCsv(t.merchant),
        escapeCsv(t.payerPayee),
        escapeCsv(t.source || 'Other'),
        fullTrxId,
        fullApv,
        escapeCsv(t.remark),
        escapeCsv(t.needsReview ? 'Needs Review' : 'Verified'),
        escapeCsv((t.rawText || '').replace(/\r?\n/g, ' '))
      ].join(',');
    });

    const summaryRow = [
      'TOTAL',
      '',
      '',
      'SUMMARY',
      usdParts.length > 0 ? `"${totalUsdAmount.toFixed(2)}"` : '""',
      khrParts.length > 0 ? `"${Math.round(totalKhrAmount)}"` : '""',
      'USD / KHR',
      `"Total Records: ${processedTransactions.length}"`,
      `"Total Amounts: ${totalAmountsStr}"`,
      `"USD Income: +$${totalUsdIncome.toFixed(2)} | Expense: -$${totalUsdExpense.toFixed(2)}"`,
      `"${totalKhrIncome > 0 || totalKhrExpense > 0 ? `KHR Income: +${Math.round(totalKhrIncome).toLocaleString()} | Expense: -${Math.round(totalKhrExpense).toLocaleString()}` : ''}"`,
      '',
      `"Net USD: $${totalUsdAmount.toFixed(2)}"`,
      'COMPLETE',
      ''
    ].join(',');

    const metaComments = [
      `# Bank Transaction Ledger Export`,
      `# Exported on: ${new Date().toLocaleString()} | Total Records: ${processedTransactions.length} | Total Amounts: ${totalAmountsStr}`,
      `# Net USD: $${totalUsdAmount.toFixed(2)} (Income: +$${totalUsdIncome.toFixed(2)}, Expense: -$${totalUsdExpense.toFixed(2)}) ${totalKhrIncome > 0 || totalKhrExpense > 0 ? `| Net KHR: ${Math.round(totalKhrAmount).toLocaleString()} ៛` : ''}`
    ];

    const csvContent = [...metaComments, headers.join(','), ...rows, summaryRow].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Print Report Function with full formatted ledger rendering and iframe fallback
  const handlePrintReport = () => {
    if (processedTransactions.length === 0) return;

    // Calculate totals for report header
    let totalUsdIncome = 0;
    let totalUsdExpense = 0;
    let totalKhrIncome = 0;
    let totalKhrExpense = 0;
    let totalUsdAmount = 0;
    let totalKhrAmount = 0;

    processedTransactions.forEach(t => {
      if (t.amount !== null && !isNaN(t.amount)) {
        if (t.currency === 'USD') {
          if (t.type === 'INCOME') {
            totalUsdIncome += t.amount;
            totalUsdAmount += t.amount;
          } else if (t.type === 'EXPENSE') {
            totalUsdExpense += t.amount;
            totalUsdAmount -= t.amount;
          }
        } else if (t.currency === 'KHR') {
          if (t.type === 'INCOME') {
            totalKhrIncome += t.amount;
            totalKhrAmount += t.amount;
          } else if (t.type === 'EXPENSE') {
            totalKhrExpense += t.amount;
            totalKhrAmount -= t.amount;
          }
        }
      }
    });

    const netUSD = totalUsdIncome - totalUsdExpense;
    const netKHR = totalKhrIncome - totalKhrExpense;

    let totalAmountsStr = '';
    const usdParts: string[] = [];
    const khrParts: string[] = [];
    if (totalUsdIncome > 0 || totalUsdExpense > 0 || totalUsdAmount !== 0) {
      usdParts.push(`$ ${totalUsdAmount.toFixed(2)}`);
    }
    if (totalKhrIncome > 0 || totalKhrExpense > 0 || totalKhrAmount !== 0) {
      khrParts.push(`${Math.round(totalKhrAmount).toLocaleString()} KHR`);
    }
    if (usdParts.length > 0 && khrParts.length > 0) {
      totalAmountsStr = `${usdParts.join('')} | ${khrParts.join('')}`;
    } else if (usdParts.length > 0) {
      totalAmountsStr = usdParts.join('');
    } else if (khrParts.length > 0) {
      totalAmountsStr = khrParts.join('');
    } else {
      totalAmountsStr = '$ 0.00';
    }

    const escapeHtml = (text: string) => {
      return (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const dateFilterStr = filter.dateStart && filter.dateEnd
      ? (filter.dateStart === filter.dateEnd ? filter.dateStart : `${filter.dateStart} ~ ${filter.dateEnd}`)
      : (filter.dateStart ? `From ${filter.dateStart}` : (filter.dateEnd ? `Until ${filter.dateEnd}` : 'All Dates'));

    const rowsHtml = processedTransactions.map((tx, idx) => {
      const formattedAmount = tx.amount !== null
        ? (tx.currency === 'KHR' ? `${Math.round(tx.amount).toLocaleString()} ៛` : `$${tx.amount.toFixed(2)}`)
        : 'Needs Review';
      
      const typeColor = tx.type === 'INCOME' ? '#047857' : tx.type === 'EXPENSE' ? '#b91c1c' : '#475569';
      const typeBg = tx.type === 'INCOME' ? '#ecfdf5' : tx.type === 'EXPENSE' ? '#fef2f2' : '#f1f5f9';
      const statusText = tx.needsReview ? 'Needs Review' : 'Verified';
      const statusColor = tx.needsReview ? '#b45309' : '#047857';

      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 5px 6px; text-align: center; font-size: 8pt; color: #64748b;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; white-space: nowrap; font-weight: 500;">${escapeHtml(tx.date)} ${escapeHtml(tx.time)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; font-size: 7.5pt; font-weight: 700; border-radius: 4px; color: ${typeColor}; background-color: ${typeBg}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">${escapeHtml(tx.type)}</span>
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 700; text-align: right; font-family: monospace; white-space: nowrap; color: ${typeColor};">${formattedAmount}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">${escapeHtml(tx.merchant || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">${escapeHtml(tx.payerPayee || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; white-space: nowrap;">${escapeHtml(tx.source || 'Other')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-family: monospace; white-space: nowrap; font-size: 8pt;">${escapeHtml(tx.transactionId || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-family: monospace; white-space: nowrap; font-size: 8pt;">${escapeHtml(tx.apv || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 8pt; color: #475569;">${escapeHtml(tx.remark || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: center; font-weight: 600; font-size: 8pt; color: ${statusColor};">${statusText}</td>
        </tr>
      `;
    }).join('');

    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transaction Report - ${new Date().toLocaleDateString()}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 8.5pt;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .title {
            font-size: 16pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .subtitle {
            font-size: 8.5pt;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .meta {
            text-align: right;
            font-size: 8pt;
            color: #475569;
          }
          .summary-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 12px;
          }
          .summary-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 6px 12px;
            min-width: 130px;
          }
          .summary-label {
            font-size: 7.5pt;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-value {
            font-size: 11pt;
            font-weight: 800;
            font-family: monospace;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
          }
          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            border: 1px solid #334155;
            padding: 6px 8px;
            text-align: left;
            font-weight: 700;
            white-space: nowrap;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            vertical-align: middle;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          tr {
            page-break-inside: avoid;
          }
          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${lang === 'en' ? 'TRANSACTION LEDGER REPORT' : 'របាយការណ៍ប្រតិបត្តិការហិរញ្ញវត្ថុ'}</h1>
            <p class="subtitle">${lang === 'en' ? 'Bank SMS & Notification Ledger' : 'ទិន្នន័យប្រតិបត្តិការធនាគារ'}</p>
          </div>
          <div class="meta">
            <div><strong>${lang === 'en' ? 'Date Range:' : 'កាលបរិច្ឆេទ៖'}</strong> ${dateFilterStr}</div>
            <div><strong>${lang === 'en' ? 'Total Amounts:' : 'សរុបទឹកប្រាក់៖'}</strong> ${totalAmountsStr}</div>
            <div><strong>${lang === 'en' ? 'Generated on:' : 'បោះពុម្ពនៅ៖'}</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="summary-bar">
          <div class="summary-card">
            <div class="summary-label">${lang === 'en' ? 'Total Records' : 'ចំនួនប្រតិបត្តិការ'}</div>
            <div class="summary-value">${processedTransactions.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${lang === 'en' ? 'Net USD' : 'សាច់ប្រាក់សុទ្ធ USD'}</div>
            <div class="summary-value" style="color: ${netUSD >= 0 ? '#047857' : '#b91c1c'};">$${netUSD.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${lang === 'en' ? 'Net KHR' : 'សាច់ប្រាក់សុទ្ធ KHR'}</div>
            <div class="summary-value" style="color: ${netKHR >= 0 ? '#047857' : '#b91c1c'};">${Math.round(netKHR).toLocaleString()} ៛</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${lang === 'en' ? 'Total Income USD' : 'ចំណូលសរុប USD'}</div>
            <div class="summary-value" style="color: #047857;">+$${totalUsdIncome.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">${lang === 'en' ? 'Total Income KHR' : 'ចំណូលសរុប KHR'}</div>
            <div class="summary-value" style="color: #047857;">+${Math.round(totalKhrIncome).toLocaleString()} ៛</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 28px;">#</th>
              <th>${lang === 'en' ? 'Date & Time' : 'កាលបរិច្ឆេទ & ម៉ោង'}</th>
              <th style="text-align: center;">${lang === 'en' ? 'Type' : 'ប្រភេទ'}</th>
              <th style="text-align: right;">${lang === 'en' ? 'Amount' : 'ចំនួនទឹកប្រាក់'}</th>
              <th>${lang === 'en' ? 'Merchant / Description' : 'ហាង / ព័ត៌មាន'}</th>
              <th>${lang === 'en' ? 'Payer / Payee' : 'អ្នកផ្ទេរ / អ្នកទទួល'}</th>
              <th>${lang === 'en' ? 'Channel / Bank' : 'ធនាគារ / ប្រភព'}</th>
              <th>${lang === 'en' ? 'Trx ID' : 'លេខប្រតិបត្តិការ'}</th>
              <th>${lang === 'en' ? 'APV Code' : 'កូដ APV'}</th>
              <th>${lang === 'en' ? 'Remark' : 'សម្គាល់'}</th>
              <th style="text-align: center;">${lang === 'en' ? 'Status' : 'ស្ថានភាព'}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Transaction Tracker - Confidential Report</span>
          <span>Page 1 of 1 (Complete Filtered Ledger)</span>
        </div>
      </body>
      </html>
    `;

    // Execute print using iframe first with multiple fallback pathways
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.setAttribute('title', 'Print Frame');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printDoc);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.open or window.print', e);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.open();
              printWindow.document.write(printDoc);
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            } else {
              window.print();
            }
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print execution failed', err);
      window.print();
    }
  };

  const handleCreateManualTransaction = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const defaultDate = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}`;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    const defaultTime = `${displayHours}:${displayMinutes} ${ampm}`;

    const newManualTx: Transaction = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'UNKNOWN',
      amount: null,
      currency: 'USD',
      date: defaultDate,
      time: defaultTime,
      merchant: '',
      payerPayee: '',
      source: 'Manual Entry',
      transactionId: '',
      apv: '',
      remark: '',
      rawText: 'Manually entered transaction record',
      fingerprint: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      needsReview: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onEditClick(newManualTx);
  };

  const todayISO = getTodayISO();
  const yesterdayISO = useMemo(() => getYesterdayISO(), []);
  const thisWeekRange = useMemo(() => getThisWeekRangeISO(), []);
  const thisMonthRange = useMemo(() => getThisMonthRangeISO(), []);
  const prevMonthRange = useMemo(() => getPreviousMonthRangeISO(), []);

  const isTodayActive = filter.dateStart === todayISO && filter.dateEnd === todayISO;
  const isYesterdayActive = filter.dateStart === yesterdayISO && filter.dateEnd === yesterdayISO;
  const isThisWeekActive = filter.dateStart === thisWeekRange.start && filter.dateEnd === thisWeekRange.end;
  const isThisMonthActive = filter.dateStart === thisMonthRange.start && filter.dateEnd === thisMonthRange.end;
  const isPrevMonthActive = filter.dateStart === prevMonthRange.start && filter.dateEnd === prevMonthRange.end;
  const isAllDatesActive = !filter.dateStart && !filter.dateEnd;

  // Compute active search result totals
  const filteredTotals = useMemo(() => {
    let incUSD = 0;
    let incKHR = 0;
    let expUSD = 0;
    let expKHR = 0;

    processedTransactions.forEach((tx) => {
      if (tx.amount !== null && !isNaN(tx.amount)) {
        if (tx.currency === 'KHR') {
          if (tx.type === 'INCOME') incKHR += tx.amount;
          else if (tx.type === 'EXPENSE') expKHR += tx.amount;
        } else {
          if (tx.type === 'INCOME') incUSD += tx.amount;
          else if (tx.type === 'EXPENSE') expUSD += tx.amount;
        }
      }
    });

    return { incUSD, incKHR, expUSD, expKHR };
  }, [processedTransactions]);

  return (
    <div 
      id="transaction-table-container" 
      className={`flex flex-col h-full rounded-2xl border ${activeTheme.cardBorder} bg-white shadow-xs dark:bg-slate-900 ${activeTheme.cardHover} transition-all duration-200 overflow-hidden`}
    >
      
      {/* 1. Header with search & filters */}
      <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60 p-3 sm:p-3.5 shrink-0">
        
        {/* Title & Action Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <ListFilter className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${activeTheme.textAccent}`} />
              {lang === 'en' ? 'Transaction History' : 'ប្រវត្តិប្រតិបត្តិការ'}
              <span className={`text-xs sm:text-sm font-mono font-bold ${activeTheme.textAccent} ml-1`}>
                ({processedTransactions.length})
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
              {lang === 'en' 
                ? `Showing ${processedTransactions.length} of ${transactions.length} total entries` 
                : `បង្ហាញចំនួន ${processedTransactions.length} នៃសរុប ${transactions.length}`}
            </p>
          </div>

          {/* Action Export & Print Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Add Manual/Missing Button */}
            <button
              id="btn-add-manual"
              onClick={handleCreateManualTransaction}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition cursor-pointer ${activeTheme.btnPrimaryBg} ${activeTheme.btnPrimaryHover}`}
              title="Add a manual or missing transaction entry"
            >
              <PlusCircle className="h-3.5 w-3.5 text-white" />
              <span>{lang === 'en' ? 'add missing transaction' : 'បញ្ចូលប្រត្តិការខ្វះ'}</span>
            </button>

            {/* Excel Export Button */}
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              disabled={processedTransactions.length === 0}
              className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-gray-50 dark:hover:bg-slate-750 transition cursor-pointer ${
                processedTransactions.length === 0 ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-700 dark:text-gray-200'
               }`}
              title="Export Formatted Excel Table (.xls)"
            >
              <FileSpreadsheet className={`h-3.5 w-3.5 ${activeTheme.textAccent}`} />
              <span>{t.exportExcel}</span>
            </button>

            {/* CSV Export Button */}
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              disabled={processedTransactions.length === 0}
              className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-gray-50 dark:hover:bg-slate-750 transition cursor-pointer ${
                processedTransactions.length === 0 ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-700 dark:text-gray-200'
               }`}
              title="Export CSV (.csv)"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t.exportCsv}</span>
            </button>

            {/* Print Report Button */}
            <button
              id="btn-print-report"
              onClick={handlePrintReport}
              disabled={processedTransactions.length === 0}
              className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-gray-50 dark:hover:bg-slate-750 transition cursor-pointer ${
                processedTransactions.length === 0 ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-700 dark:text-gray-200'
              }`}
              title="Print Ledger Report"
            >
              <Printer className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t.printReport}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row (Selecting Div) */}
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 items-start">
          
          {/* 1. Search bar */}
          <div className="relative sm:col-span-1 lg:col-span-2 xl:col-span-2">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
            <input
              id="filter-search-input"
              type="text"
              className={`w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 py-1.5 pr-3 pl-8 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 ${activeTheme.focusRing} focus:outline-hidden`}
              placeholder={t.searchPlaceholder}
              value={filter.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>

          {/* New! 2. Type filter dropdown (ALL, INCOME, EXPENSE, UNKNOWN) */}
          <div className="lg:col-span-2 xl:col-span-2">
            <select
              id="filter-type-select"
              value={filter.type}
              onChange={(e) => handleFilterChange({ type: e.target.value as any })}
              className={`w-full rounded-lg border border-gray-300 dark:border-slate-700 py-1.5 px-2 text-xs text-gray-700 dark:text-slate-200 ${activeTheme.focusRing} focus:outline-hidden bg-white dark:bg-slate-800 font-medium`}
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{t.typeAll}</option>
              <option value="INCOME" className="bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">{t.typeIncome}</option>
              <option value="EXPENSE" className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold">{t.typeExpense}</option>
              <option value="UNKNOWN" className="bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold">{t.typeUnknown}</option>
            </select>
          </div>

          {/* 3. Source dropdown (Includes "Others") */}
          <div className="lg:col-span-2 xl:col-span-2">
            <select
              id="filter-source-select"
              value={filter.source}
              onChange={(e) => handleFilterChange({ source: e.target.value })}
              className={`w-full rounded-lg border border-gray-300 dark:border-slate-700 py-1.5 px-2 text-xs text-gray-700 dark:text-slate-200 ${activeTheme.focusRing} focus:outline-hidden bg-white dark:bg-slate-800`}
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{t.allSources}</option>
              {distinctSources.map((src) => (
                <option key={src} value={src} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{src}</option>
              ))}
              <option value="OTHERS" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{lang === 'en' ? 'Others (Other Banks)' : 'ផ្សេងៗ (ធនាគារផ្សេងទៀត)'}</option>
            </select>
          </div>

          {/* 4. Needs Review dropdown */}
          <div className="lg:col-span-2 xl:col-span-2">
            <select
              id="filter-review-select"
              value={filter.needsReview}
              onChange={(e) => handleReviewSelectChange(e.target.value as any)}
              className={`w-full rounded-lg border border-gray-300 dark:border-slate-700 py-1.5 px-2 text-xs text-gray-700 dark:text-slate-200 ${activeTheme.focusRing} focus:outline-hidden bg-white dark:bg-slate-800`}
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{t.reviewAll}</option>
              <option value="true" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{t.reviewFlagged}</option>
              <option value="false" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{t.reviewOk}</option>
            </select>
          </div>

          {/* 5. Date Search Range Picker (Defaults to Current Date, with presets for Today, This Month, Previous Month) */}
          <div className="sm:col-span-1 lg:col-span-3 xl:col-span-3 flex flex-col gap-1">
            <div className="flex items-center gap-1 border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 bg-white dark:bg-slate-800/90 justify-between shadow-2xs">
              <input
                id="filter-date-picker"
                type="date"
                className="bg-transparent text-[11px] font-semibold text-gray-700 dark:text-slate-200 outline-hidden w-full focus:ring-0 cursor-pointer min-w-0"
                value={filter.dateStart || ''}
                onChange={(e) => handleFilterChange({ dateStart: e.target.value })}
                title="Start Date"
              />
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold px-0.5">-</span>
              <input
                id="filter-date-end"
                type="date"
                className="bg-transparent text-[11px] font-semibold text-gray-700 dark:text-slate-200 outline-hidden w-full focus:ring-0 cursor-pointer min-w-0"
                value={filter.dateEnd || ''}
                onChange={(e) => handleFilterChange({ dateEnd: e.target.value })}
                title="End Date"
              />
              
              {(filter.dateStart || filter.dateEnd) && (
                <button
                  id="btn-clear-date-filter"
                  type="button"
                  onClick={handleClearDateRange}
                  className="text-gray-400 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-xs font-bold px-0.5 cursor-pointer transition shrink-0"
                  title={lang === 'en' ? 'Clear Date Filter (Show All)' : 'ជម្រះចម្រោះថ្ងៃ (បង្ហាញទាំងអស់)'}
                >
                  ✖
                </button>
              )}
            </div>

            {/* Quick Preset Buttons: Today | Yesterday | This Month | Previous Month | All - No slide bar on PC view */}
            <div className="flex items-center gap-1 overflow-x-hidden sm:overflow-x-visible lg:overflow-x-visible flex-wrap sm:flex-nowrap no-scrollbar py-0.5">
              <button
                id="btn-preset-today"
                type="button"
                onClick={handleSetToday}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isTodayActive 
                    ? `${activeTheme.badgeBg} ${activeTheme.badgeText} ring-1 ring-inset ${activeTheme.focusRing}` 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
                title={lang === 'en' ? 'Filter by Today' : 'ចម្រោះតាមថ្ងៃនេះ'}
              >
                {t.btnToday}
              </button>

              <button
                id="btn-preset-yesterday"
                type="button"
                onClick={handleSetYesterday}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isYesterdayActive 
                    ? `${activeTheme.badgeBg} ${activeTheme.badgeText} ring-1 ring-inset ${activeTheme.focusRing}` 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
                title={lang === 'en' ? 'Filter by Yesterday' : 'ចម្រោះតាមម្សិលមិញ'}
              >
                {t.btnYesterday}
              </button>

              <button
                id="btn-preset-this-week"
                type="button"
                onClick={handleSetThisWeek}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isThisWeekActive 
                    ? `${activeTheme.badgeBg} ${activeTheme.badgeText} ring-1 ring-inset ${activeTheme.focusRing}` 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
                title={lang === 'en' ? 'Filter by This Week' : 'ចម្រោះតាមសប្តាហ៍នេះ'}
              >
                {lang === 'en' ? 'This Week' : 'សប្ដាហ៍នេះ'}
              </button>

              <button
                id="btn-preset-this-month"
                type="button"
                onClick={handleSetThisMonth}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isThisMonthActive 
                    ? `${activeTheme.badgeBg} ${activeTheme.badgeText} ring-1 ring-inset ${activeTheme.focusRing}` 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
                title={lang === 'en' ? 'Filter by This Month' : 'ចម្រោះតាមខែនេះ'}
              >
                {t.btnThisMonth}
              </button>

              <button
                id="btn-preset-prev-month"
                type="button"
                onClick={handleSetPreviousMonth}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isPrevMonthActive 
                    ? `${activeTheme.badgeBg} ${activeTheme.badgeText} ring-1 ring-inset ${activeTheme.focusRing}` 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
                title={lang === 'en' ? 'Filter by Previous Month' : 'ចម្រោះតាមខែមុន'}
              >
                {t.btnPrevMonth}
              </button>

              {!isAllDatesActive && (
                <button
                  id="btn-preset-all"
                  type="button"
                  onClick={handleClearDateRange}
                  className="px-1 py-0.5 rounded text-[10px] font-medium text-gray-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition whitespace-nowrap cursor-pointer"
                  title={lang === 'en' ? 'Show All Dates' : 'បង្ហាញគ្រប់កាលបរិច្ឆេទ'}
                >
                  {t.btnAllDates}
                </button>
              )}
            </div>
          </div>

          {/* 5. Show Rows Button / Selector in Selecting Div (5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20) */}
          <div className="sm:col-span-1 lg:col-span-2 xl:col-span-2 flex items-center justify-between gap-1.5 border border-gray-300 dark:border-slate-700 rounded-lg py-1 px-2 bg-white dark:bg-slate-800/90 shadow-xs">
            <label htmlFor="filter-show-rows-select" className="text-xs font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap shrink-0">
              {lang === 'en' ? 'Rows:' : 'ជួរ៖'}
            </label>
            <select
              id="filter-show-rows-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`w-full bg-transparent text-xs font-bold text-gray-800 dark:text-slate-100 ${activeTheme.focusRing} focus:outline-hidden cursor-pointer min-w-0`}
              title={lang === 'en' ? 'Select number of rows to show (5 to 20)' : 'ជ្រើសរើសចំនួនជួរត្រូវបង្ហាញ (៥ ដល់ ២០)'}
            >
              {ROW_OPTIONS.map((num) => (
                <option key={num} value={num} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                  {num} {lang === 'en' ? 'rows' : 'ជួរ'}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Search Results Totals Summary Bar */}
        <div id="search-result-totals-banner" className="mt-2.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-slate-200">
            <span>{t.rangeLabel}:</span>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
              ({processedTransactions.length} {lang === 'en' ? 'records' : 'កំណត់ត្រា'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono font-bold text-[11px] sm:text-xs">
            {/* Income Search Result Total */}
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
              <span className="text-[10px] font-sans font-extrabold text-emerald-800 dark:text-emerald-200">{t.typeIncome}:</span>
              <span>+${filteredTotals.incUSD.toFixed(2)}</span>
              {filteredTotals.incKHR > 0 && <span className="text-[10px] font-black">| +{Math.round(filteredTotals.incKHR).toLocaleString()} ៛</span>}
            </div>

            {/* Expense Search Result Total */}
            <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-sans font-extrabold text-rose-800 dark:text-rose-200">{t.typeExpense}:</span>
              <span>-${filteredTotals.expUSD.toFixed(2)}</span>
              {filteredTotals.expKHR > 0 && <span className="text-[10px] font-black">| -{Math.round(filteredTotals.expKHR).toLocaleString()} ៛</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Ledger Table (Scrollable Body & Auto-fitting Columns) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-xs">
          <thead className="bg-gray-50/90 dark:bg-slate-800/90 sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th scope="col" onClick={() => handleSort('date')} className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {t.thDate}
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </th>
              <th scope="col" onClick={() => handleSort('amount')} className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {t.thAmount}
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                </div>
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {t.thDetails}
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {t.thPayerPayee}
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {t.thTrxId}
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {t.thChannel}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                {t.thActions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((tx) => {
                const formattedAmountText = formatTableAmount(tx.amount, tx.currency, tx.type);
                return (
                  <tr key={tx.id} className={`hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors ${tx.needsReview ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                    
                    {/* Date & Time */}
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-left">
                      <div className="font-semibold text-gray-900 dark:text-white">{tx.date}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{tx.time}</div>
                    </td>

                    {/* Amount & Type */}
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-left">
                      {formattedAmountText !== null ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${tx.type === 'INCOME' ? activeTheme.textAccent : tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                            {formattedAmountText}
                          </span>
                          <span className={`text-[10px] font-medium ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`}>
                            {tx.type === 'INCOME' ? t.typeIncome : tx.type === 'EXPENSE' ? t.typeExpense : t.typeUnknown}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                          {lang === 'en' ? 'Needs Review' : 'ត្រូវពិនិត្យ'}
                        </span>
                      )}
                    </td>

                    {/* Merchant / Location */}
                    <td className="px-3.5 py-2.5 text-left">
                      <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[130px] sm:max-w-[170px]" title={tx.merchant}>
                        {tx.merchant}
                      </div>
                      {tx.remark && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 italic truncate max-w-[130px] sm:max-w-[170px]" title={tx.remark}>
                          &ldquo;{tx.remark}&rdquo;
                        </div>
                      )}
                    </td>

                    {/* Payer / Payee */}
                    <td className="px-3.5 py-2.5 text-left">
                      <div className="text-gray-700 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[150px]" title={tx.payerPayee}>
                        {tx.payerPayee}
                      </div>
                    </td>

                    {/* Trx ID & APV */}
                    <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-left">
                      {tx.transactionId ? (
                        <div className="text-gray-900 dark:text-slate-100 font-medium">ID: {tx.transactionId}</div>
                      ) : (
                        <div className="text-gray-400 dark:text-slate-500 italic">No ID</div>
                      )}
                      {tx.apv && (
                        <div className="text-gray-500 dark:text-slate-400 text-[10px]">APV: {tx.apv}</div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-left">
                      <span className="text-[10px] font-semibold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                        {tx.source || 'Other'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-tx-${tx.id}`}
                          onClick={() => onEditClick(tx)}
                          className="rounded-md p-1 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-tx-${tx.id}`}
                          onClick={() => onDeleteClick(tx.id)}
                          className="rounded-md p-1 text-gray-400 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-500 dark:text-slate-400">
                  <div className="mx-auto max-w-xs flex flex-col items-center">
                    <HelpCircle className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                    <h3 className="mt-2 font-display font-bold text-gray-900 dark:text-white">
                      {lang === 'en' ? 'No transactions in this view' : 'គ្មានប្រតិបត្តិការក្នុងជម្រើសនេះឡើយ'}
                    </h3>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                      {lang === 'en'
                        ? 'Try adjusting your date range, clearing filters, or paste new SMS alerts on the left.'
                        : 'សាកល្បងកែប្រែកាលបរិច្ឆេទ ជម្រះចម្រោះ ឬបិទភ្ជាប់សារ SMS ថ្មីនៅផ្នែកខាងឆ្វេង។'}
                    </p>
                    {(filter.dateStart || filter.dateEnd || filter.search || filter.source !== 'ALL') && (
                      <button
                        onClick={handleClearDateRange}
                        className={`mt-3 inline-flex items-center gap-1 rounded-md ${activeTheme.badgeBg} ${activeTheme.badgeText} px-2.5 py-1 text-xs font-semibold hover:opacity-80 transition cursor-pointer`}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {lang === 'en' ? 'Show All History' : 'បង្ហាញប្រវត្តិទាំងអស់'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Controls (Pinned at bottom) */}
      <div className="border-t border-gray-200 dark:border-slate-800 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="text-[11px] text-gray-700 dark:text-slate-300 font-medium">
          {lang === 'en' ? (
            <>
              Showing <span className="font-bold text-gray-900 dark:text-white">{processedTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, processedTransactions.length)}
              </span>{' '}
              of <span className="font-bold text-gray-900 dark:text-white">{processedTransactions.length}</span> entries
            </>
          ) : (
            <>
              បង្ហាញពី <span className="font-bold text-gray-900 dark:text-white">{processedTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> ដល់{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, processedTransactions.length)}
              </span>{' '}
              នៃ <span className="font-bold text-gray-900 dark:text-white">{processedTransactions.length}</span> កំណត់ត្រា
            </>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Rows per page selector in footer */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 font-medium">
              {lang === 'en' ? 'Rows:' : 'ជួរ៖'}
            </span>
            <select
              id="pagination-rows-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-xs font-bold text-gray-800 dark:text-slate-100 cursor-pointer shadow-xs focus:outline-hidden"
              title={lang === 'en' ? 'Select number of rows per page' : 'ជ្រើសរើសចំនួនជួរក្នុងមួយទំព័រ'}
            >
              {ROW_OPTIONS.map((num) => (
                <option key={num} value={num} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              id="btn-page-prev"
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              className={`rounded-md border border-gray-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer ${
                currentPage === 1 ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-slate-600' : ''
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-gray-700 dark:text-slate-200 font-bold px-1">
              {currentPage}/{totalPages}
            </span>
            <button
              id="btn-page-next"
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`rounded-md border border-gray-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer ${
                currentPage === totalPages || totalPages === 0 ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-slate-600' : ''
              }`}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
