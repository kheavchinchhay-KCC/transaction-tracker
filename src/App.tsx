/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getTransactions, saveTransactions, deleteTransaction, clearAllTransactions, saveTransaction 
} from './utils/db';
import { Transaction, SummaryStats, Language, ThemeColor } from './types';
import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import PasteInputArea from './components/PasteInputArea';
import SmsInstructions from './components/SmsInstructions';
import TransactionTable from './components/TransactionTable';
import EditTransactionModal from './components/EditTransactionModal';
import { CheckCircle, AlertTriangle, AlertCircle, ShieldAlert, X, Menu, Landmark, Link2, FileSpreadsheet } from 'lucide-react';
import { translations, getTranslation } from './utils/lang';
import { isDateToday, getMissingTransactionsDateSummary } from './utils/dateHelper';
import { getGoogleAccessToken, syncToGoogleSheets } from './utils/googleSheets';
import { requestGoogleSheetsAccessToken } from './utils/googleAuth';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[] | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Day & Night Toggle State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Theme Color Palette State (saved locally, defaults to 'emerald')
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('app-theme-color');
    if (saved && (saved === 'violet' || saved === 'emerald' || saved === 'amber' || saved === 'rose' || saved === 'sky')) {
      return saved as ThemeColor;
    }
    return 'emerald';
  });

  // Language Switch State (saved locally)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app-lang');
    return (saved === 'km' || saved === 'en') ? (saved as Language) : 'en';
  });

  // Custom modal dialog states
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPhraseConfirmOpen, setIsPhraseConfirmOpen] = useState(false);
  const [clearPhraseInput, setClearPhraseInput] = useState('');
  const [phraseError, setPhraseError] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const t = translations[lang];

  // Ensure theme sync on mount and state change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const handleSelectThemeColor = (color: ThemeColor) => {
    setThemeColor(color);
    localStorage.setItem('app-theme-color', color);
  };

  // Success / Duplicate Notification Toasts status
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warn';
  } | null>(null);

  // Trigger to activate Needs Review filter in TransactionTable
  const [reviewFilterTrigger, setReviewFilterTrigger] = useState(0);

  const handleFilterNeedsReview = () => {
    setReviewFilterTrigger((prev) => prev + 1);
  };

  const triggerToast = useCallback((text: string, type: 'success' | 'warn') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // Google Sheets Integration States
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => getGoogleAccessToken() !== null);
  const [isGoogleSaving, setIsGoogleSaving] = useState(false);
  const [groupByMerchant, setGroupByMerchant] = useState(() => {
    return localStorage.getItem('google-sheets-group-by-merchant') === 'true';
  });
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleActionType, setGoogleActionType] = useState<'CONNECT' | 'DISCONNECT' | null>(null);
  const [googlePhraseInput, setGooglePhraseInput] = useState('');
  const [googlePhraseError, setGooglePhraseError] = useState(false);

  // Google OAuth uses Google's popup token flow. This avoids redirecting the SPA away
  // from the Netlify site and therefore does not depend on a redirect URI.

  const handleToggleGroupByMerchant = () => {
    setGroupByMerchant((prev) => {
      const next = !prev;
      localStorage.setItem('google-sheets-group-by-merchant', String(next));
      return next;
    });
  };

  const handleSaveToGoogleSheetDirectly = async (customTxs?: Transaction[]) => {
    const listToSync = customTxs || transactions;
    if (listToSync.length === 0) {
      triggerToast(lang === 'en' ? 'No transactions to save.' : 'គ្មានប្រតិបត្តិការសម្រាប់រក្សាទុកឡើយ។', 'warn');
      return;
    }

    setIsGoogleSaving(true);
    try {
      await syncToGoogleSheets(listToSync, localStorage.getItem('google-sheets-group-by-merchant') === 'true');
      triggerToast(lang === 'en' ? 'Successfully synchronized with Google Sheets!' : 'បានធ្វើសមកាលកម្មជាមួយ Google Sheets ដោយជោគជ័យ!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast(lang === 'en' ? `Sync failed: ${err.message || err}` : `សមកាលកម្មបរាជ័យ៖ ${err.message || err}`, 'warn');
    } finally {
      setIsGoogleSaving(false);
    }
  };

  const triggerGoogleConnectModal = () => {
    setGoogleActionType('CONNECT');
    setGooglePhraseInput('');
    setGooglePhraseError(false);
    setIsGoogleModalOpen(true);
  };

  const triggerGoogleDisconnectModal = () => {
    setGoogleActionType('DISCONNECT');
    setGooglePhraseInput('');
    setGooglePhraseError(false);
    setIsGoogleModalOpen(true);
  };

  const handleGooglePhraseSubmit = async () => {
    if (googlePhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY') {
      setIsGoogleModalOpen(false);
      if (googleActionType === 'CONNECT') {
        try {
          const accessToken = await requestGoogleSheetsAccessToken();
          if (!accessToken) {
            throw new Error('Google authorization was not completed.');
          }

          setIsGoogleConnected(true);
          triggerToast(
            lang === 'en' ? 'Successfully connected to Google Sheets!' : 'បានភ្ជាប់ទៅកាន់ Google Sheets ដោយជោគជ័យ!',
            'success'
          );

          // Auto save once connected. The spreadsheet belongs to the Google account
          // that the user authorized in the popup.
          setTimeout(() => {
            void handleSaveToGoogleSheetDirectly();
          }, 300);
        } catch (err: any) {
          console.error('Google authorization failed:', err);
          triggerToast(
            lang === 'en' ? `Google connection failed: ${err?.message || err}` : `ការភ្ជាប់ Google បរាជ័យ៖ ${err?.message || err}`,
            'warn'
          );
        }
      } else if (googleActionType === 'DISCONNECT') {
        localStorage.removeItem('google-sheets-token');
        localStorage.removeItem('google-sheets-token-expiry');
        localStorage.removeItem('google-sheets-spreadsheet-id');
        setIsGoogleConnected(false);
        triggerToast(lang === 'en' ? 'Disconnected from Google Sheets.' : 'បានផ្តាច់ទំនាក់ទំនងពី Google Sheets រួចរាល់។', 'success');
      }
    } else {
      setGooglePhraseError(true);
    }
  };

  // Initial load from local database
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const saved = await getTransactions();
        setTransactions(saved);
      } catch (err) {
        console.error('Error initializing db data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stats in real-time
  const stats = useMemo<SummaryStats>(() => {
    let allTimeNetUSD = 0;
    let allTimeNetKHR = 0;
    let allTimeTotalIncomeUSD = 0;
    let allTimeTotalIncomeKHR = 0;
    let allTimeTotalExpenseUSD = 0;
    let allTimeTotalExpenseKHR = 0;

    let todayIncomeUSD = 0;
    let todayIncomeKHR = 0;
    let todayExpenseUSD = 0;
    let todayExpenseKHR = 0;
    let todayCount = 0;

    let reviewCount = 0;

    // 1. Calculate All-time metrics and Today's metrics from the entire database (unfiltered)
    transactions.forEach((tx) => {
      if (tx.needsReview) {
        reviewCount++;
      }

      const amt = tx.amount !== null && !isNaN(tx.amount) ? tx.amount : 0;
      const currency = tx.currency || 'USD';

      // All-time totals
      if (tx.type === 'INCOME') {
        if (currency === 'KHR') {
          allTimeTotalIncomeKHR += amt;
          allTimeNetKHR += amt;
        } else {
          allTimeTotalIncomeUSD += amt;
          allTimeNetUSD += amt;
        }
      } else if (tx.type === 'EXPENSE') {
        if (currency === 'KHR') {
          allTimeTotalExpenseKHR += amt;
          allTimeNetKHR -= amt;
        } else {
          allTimeTotalExpenseUSD += amt;
          allTimeNetUSD -= amt;
        }
      }

      // Today's metrics (using robust isDateToday helper)
      if (isDateToday(tx.date)) {
        todayCount++;
        if (tx.type === 'INCOME') {
          if (currency === 'KHR') {
            todayIncomeKHR += amt;
          } else {
            todayIncomeUSD += amt;
          }
        } else if (tx.type === 'EXPENSE') {
          if (currency === 'KHR') {
            todayExpenseKHR += amt;
          } else {
            todayExpenseUSD += amt;
          }
        }
      }
    });

    // 2. Calculate Active Filtered / Range metrics
    const activeList = filteredTransactions !== null ? filteredTransactions : transactions;
    let rangeIncomeUSD = 0;
    let rangeIncomeKHR = 0;
    let rangeExpenseUSD = 0;
    let rangeExpenseKHR = 0;

    activeList.forEach((tx) => {
      const amt = tx.amount !== null && !isNaN(tx.amount) ? tx.amount : 0;
      const currency = tx.currency || 'USD';
      if (tx.type === 'INCOME') {
        if (currency === 'KHR') {
          rangeIncomeKHR += amt;
        } else {
          rangeIncomeUSD += amt;
        }
      } else if (tx.type === 'EXPENSE') {
        if (currency === 'KHR') {
          rangeExpenseKHR += amt;
        } else {
          rangeExpenseUSD += amt;
        }
      }
    });

    const reviewDateText = getMissingTransactionsDateSummary(transactions, lang);

    return {
      allTimeNetUSD,
      allTimeNetKHR,
      allTimeTotalCount: transactions.length,
      allTimeTotalIncomeUSD,
      allTimeTotalIncomeKHR,
      allTimeTotalExpenseUSD,
      allTimeTotalExpenseKHR,
      todayIncomeUSD,
      todayIncomeKHR,
      todayExpenseUSD,
      todayExpenseKHR,
      todayNetUSD: todayIncomeUSD - todayExpenseUSD,
      todayNetKHR: todayIncomeKHR - todayExpenseKHR,
      todayCount,
      rangeIncomeUSD,
      rangeIncomeKHR,
      rangeExpenseUSD,
      rangeExpenseKHR,
      rangeNetUSD: rangeIncomeUSD - rangeExpenseUSD,
      rangeNetKHR: rangeIncomeKHR - rangeExpenseKHR,
      rangeTotalCount: activeList.length,
      reviewCount,
      reviewDateText,
      // Compatibility aliases
      totalIncomeUSD: allTimeTotalIncomeUSD,
      totalExpenseUSD: allTimeTotalExpenseUSD,
      netBalanceUSD: allTimeNetUSD,
      totalIncomeKHR: allTimeTotalIncomeKHR,
      totalExpenseKHR: allTimeTotalExpenseKHR,
      netBalanceKHR: allTimeNetKHR,
      totalCount: activeList.length
    };
  }, [transactions, filteredTransactions, lang]);

  // Handle successful batch imports
  const handleImportSuccess = async (newTxs: Transaction[], duplicateCount: number) => {
    if (newTxs.length === 0) {
      if (duplicateCount > 0) {
        triggerToast(t.duplicateWarningToast, 'warn');
      }
      return;
    }

    try {
      // Save elements in storage
      await saveTransactions(newTxs);
      
      // Update local React state
      const refreshedList = await getTransactions();
      setTransactions(refreshedList);

      // Auto-update remote Google Sheet ledger if connected
      if (getGoogleAccessToken()) {
        setTimeout(() => {
          handleSaveToGoogleSheetDirectly(refreshedList);
        }, 800);
      }

      const reviewAddCount = newTxs.filter((tx) => tx.needsReview).length;
      
      let toastStr = getTranslation(lang, 'toastImportSuccess', { count: newTxs.length });
      if (duplicateCount > 0) {
        toastStr += ' ' + getTranslation(lang, 'toastImportDuplicate', { count: duplicateCount });
      }
      if (reviewAddCount > 0) {
        toastStr += ' ' + getTranslation(lang, 'toastImportReview', { count: reviewAddCount });
      }

      triggerToast(toastStr, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(lang === 'en' ? 'Error synchronizing parsed entries to database.' : 'មានបញ្ហាក្នុងការរក្សាទិន្នន័យប្រតិបត្តិការចូលម៉ាស៊ីន។', 'warn');
    }
  };

  const handleClearAllData = () => {
    setIsClearConfirmOpen(true);
  };

  const handleProceedToPhraseConfirm = () => {
    setIsClearConfirmOpen(false);
    setClearPhraseInput('');
    setPhraseError(false);
    setIsPhraseConfirmOpen(true);
  };

  const confirmClearAllData = async () => {
    try {
      setIsClearConfirmOpen(false);
      setIsPhraseConfirmOpen(false);
      setClearPhraseInput('');
      setPhraseError(false);
      await clearAllTransactions();
      setTransactions([]);
      triggerToast(t.toastClearSuccess, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(t.toastClearFail, 'warn');
    }
  };

  const isPhraseMatch = clearPhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY';

  const handlePhraseConfirmSubmit = async () => {
    if (clearPhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY') {
      await confirmClearAllData();
    } else {
      setPhraseError(true);
    }
  };

  // Trigger Deletion
  const handleDeleteTransaction = (id: string) => {
    setPendingDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteTransaction(pendingDeleteId);
      const remainingList = transactions.filter((t) => t.id !== pendingDeleteId);
      setTransactions(remainingList);
      triggerToast(t.toastDeleteSuccess, 'success');

      // Auto-update remote Google Sheet ledger if connected
      if (getGoogleAccessToken()) {
        setTimeout(() => {
          handleSaveToGoogleSheetDirectly(remainingList);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      triggerToast(t.toastDeleteFail, 'warn');
    } finally {
      setIsDeleteConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  // Trigger Save on Modal Submit
  const handleSaveModifiedTransaction = async (updated: Transaction) => {
    try {
      await saveTransaction(updated);
      let updatedList: Transaction[] = [];
      setTransactions((prev) => {
        const exists = prev.some((t) => t.id === updated.id);
        if (exists) {
          updatedList = prev.map((t) => (t.id === updated.id ? updated : t));
        } else {
          updatedList = [updated, ...prev];
        }
        return updatedList;
      });
      triggerToast(lang === 'en' ? 'Transaction details updated successfully.' : 'បានកែប្រែព័ត៌មានលម្អិតដោយជោគជ័យ។', 'success');

      // Auto-update remote Google Sheet ledger if connected
      if (getGoogleAccessToken()) {
        setTimeout(() => {
          const listToSend = updatedList.length > 0 
            ? updatedList 
            : transactions.map((t) => (t.id === updated.id ? updated : t));
          handleSaveToGoogleSheetDirectly(listToSend);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      triggerToast(lang === 'en' ? 'Could not save modifications.' : 'មិនអាចរក្សាទុកទិន្នន័យកែប្រែបានឡើយ។', 'warn');
    }
  };

  const handleLaunchEditor = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEditModalOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50/50 dark:bg-[#090d16] transition-colors duration-200 ${theme === 'dark' ? 'dark bg-[#090d16]' : ''}`}>
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div id="toast-banner-container" className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-full max-w-lg px-4 animate-bounce">
          <div className={`flex items-start justify-between rounded-xl p-3.5 shadow-lg border ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-300' 
              : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-300'
          }`}>
            <div className="flex gap-2.5">
              {toastMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              )}
              <p className="text-xs font-semibold">{toastMessage.text}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-3 text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header element */}
      <DashboardHeader 
        onClearAll={handleClearAllData} 
        transactionCount={transactions.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        lang={lang}
        onSelectLang={handleSelectLang}
        themeColor={themeColor}
        onSelectThemeColor={handleSelectThemeColor}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isGoogleConnected={isGoogleConnected}
        onConnectGoogle={triggerGoogleConnectModal}
        onDisconnectGoogle={triggerGoogleDisconnectModal}
        onSaveToGoogleSheet={() => handleSaveToGoogleSheetDirectly()}
        isGoogleSaving={isGoogleSaving}
        groupByMerchant={groupByMerchant}
        onToggleGroupByMerchant={handleToggleGroupByMerchant}
      />

      {/* Mobile Sidebar Navigation Drawer */}
      {isSidebarOpen && (
        <div id="mobile-sidebar-drawer" className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop with fade-in effect */}
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative flex w-full max-w-[290px] flex-col bg-gray-50 dark:bg-slate-900 p-4 shadow-2xl overflow-y-auto border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 transform translate-x-0">
            {/* Header / Brand */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-xs`}>
                  <Landmark className="h-4 w-4 text-white" />
                </div>
                <span className="font-display font-bold text-gray-900 dark:text-white text-sm">
                  {lang === 'en' ? 'Quick Tools' : 'ឧបករណ៍រហ័ស'}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-150 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content: Summary Cards, Paste Bank, Instructions */}
            <div className="mt-4 flex flex-col gap-4">
              {/* Summary Cards */}
              <div onClick={() => setIsSidebarOpen(false)}>
                <SummaryCards stats={stats} lang={lang} themeColor={themeColor} onFilterNeedsReview={handleFilterNeedsReview} />
              </div>

              {/* Paste Bank Transaction Div */}
              <div>
                <PasteInputArea 
                  existingTransactions={transactions} 
                  onImportSuccess={(txs, dupCount) => {
                    handleImportSuccess(txs, dupCount);
                    setIsSidebarOpen(false);
                  }}
                  lang={lang}
                  themeColor={themeColor}
                  inputText={pastedText}
                  onInputTextChange={setPastedText}
                />
              </div>

              {/* SMS Instructions */}
              <div>
                <SmsInstructions 
                  lang={lang}
                  themeColor={themeColor}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Workspace Grid: Scrollable on mobile/tablet, Fluid and auto-fitting on desktop */}
      <main className="flex-1 w-full px-3 py-2.5 sm:px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
        
        {/* ========================================================================= */}
        {/* MOBILE & TABLET VIEW ONLY (< lg): Top: Paste -> 2nd: Stats -> 3rd: Table -> Bottom: SMS Guide */}
        {/* ========================================================================= */}
        
        {/* 1. Mobile & Tablet Top: Paste Bank Transaction Div */}
        <div className="block lg:hidden">
          <PasteInputArea 
            existingTransactions={transactions} 
            onImportSuccess={handleImportSuccess}
            lang={lang}
            themeColor={themeColor}
            inputText={pastedText}
            onInputTextChange={setPastedText}
          />
        </div>

        {/* 2. Mobile & Tablet 2nd: 4 Result Divs (Total Transactions, Total Income, Record Count, Needs Review) */}
        <div className="block lg:hidden">
          <SummaryCards stats={stats} lang={lang} themeColor={themeColor} onFilterNeedsReview={handleFilterNeedsReview} />
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW LEFT COLUMN (lg:): Top: Stats -> Middle: Paste -> Bottom: SMS Guide */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col gap-2.5 pr-0 lg:pr-1">
          {/* 1. Desktop Top: 4 Result Divs */}
          <SummaryCards stats={stats} lang={lang} themeColor={themeColor} onFilterNeedsReview={handleFilterNeedsReview} />

          {/* 2. Desktop Middle: Paste Bank Transaction Div */}
          <PasteInputArea 
            existingTransactions={transactions} 
            onImportSuccess={handleImportSuccess}
            lang={lang}
            themeColor={themeColor}
            inputText={pastedText}
            onInputTextChange={setPastedText}
          />

          {/* 3. Desktop Bottom of Left Pane: SMS Fast Parser Instructions Div */}
          <SmsInstructions 
            lang={lang}
            themeColor={themeColor}
          />
        </div>

        {/* ========================================================================= */}
        {/* TRANSACTION HISTORY DIV: Right Column on Desktop / 3rd in flow on Mobile & Tablet */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col min-h-[520px]">
          <TransactionTable 
            transactions={transactions} 
            onEditClick={handleLaunchEditor} 
            onDeleteClick={handleDeleteTransaction}
            lang={lang}
            themeColor={themeColor}
            onFilteredTransactionsChange={setFilteredTransactions}
            reviewFilterTrigger={reviewFilterTrigger}
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. Mobile & Tablet Bottom: SMS Fast Parser Instructions & Guide DIV */}
        {/* ========================================================================= */}
        <div className="block lg:hidden pb-6">
          <SmsInstructions 
            lang={lang}
            themeColor={themeColor}
          />
        </div>

      </main>

      {/* Modal: Edit Transaction Details */}
      <EditTransactionModal 
        transaction={editingTransaction} 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }} 
        onSave={handleSaveModifiedTransaction}
        lang={lang}
        themeColor={themeColor}
      />

      {/* Modal: Clear Database confirmation */}
      {isClearConfirmOpen && (
        <div id="modal-clear-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 shadow-2xl text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white">
              {t.modalClearTitle}
            </h3>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t.modalClearWarning}
            </p>
            <div className="mt-3.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-left text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-0.5">
                💡 {lang === 'en' ? 'Google Sheets Notice:' : 'ចំណាំសំខាន់អំពី Google Sheets៖'}
              </span>
              <span>{(t as any).modalClearGoogleSheetsInfo}</span>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                id="btn-confirm-clear-cancel"
                onClick={() => setIsClearConfirmOpen(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.modalClearCancel}
              </button>
              <button
                id="btn-confirm-clear-yes"
                onClick={handleProceedToPhraseConfirm}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 shadow-xs transition cursor-pointer"
              >
                {t.modalClearConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Phrase Security Verification popup Div box for Clear All Data */}
      {isPhraseConfirmOpen && (
        <div id="modal-phrase-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl text-center">
            
            {/* Header Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white">
              {t.modalPhraseTitle}
            </h3>

            {/* Prompt */}
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.modalPhrasePrompt}
            </p>

            {/* Target Word Display Box */}
            <div className="my-3 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col items-center justify-center gap-0.5">
              <span className="font-mono font-extrabold text-sm tracking-widest text-red-600 dark:text-red-400 select-all">
                I LOVE BONG CHHAY
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {lang === 'en' ? '(Supports uppercase and lowercase typing)' : '(អាចវាយអក្សរតូច ឬធំក៏បាន)'}
              </span>
            </div>

            {/* Text Input Box */}
            <div className="mt-2 text-left">
              <input
                id="input-confirm-clear-phrase"
                type="text"
                autoFocus
                value={clearPhraseInput}
                onChange={(e) => {
                  setClearPhraseInput(e.target.value);
                  if (phraseError) setPhraseError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePhraseConfirmSubmit();
                  }
                }}
                placeholder={t.modalPhrasePlaceholder}
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-semibold text-center font-mono focus:outline-hidden transition-all ${
                  isPhraseMatch
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : phraseError
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                }`}
              />

              {/* Status helper text */}
              {isPhraseMatch ? (
                <div id="phrase-status-valid" className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{t.modalPhraseValid}</span>
                </div>
              ) : phraseError ? (
                <div id="phrase-status-error" className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{t.modalPhraseError}</span>
                </div>
              ) : (
                <div className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
                  {lang === 'en' ? 'Type "I LOVE BONG CHHAY" to unlock confirmation' : 'វាយ "I LOVE BONG CHHAY" ដើម្បីបើកសិទ្ធិបញ្ជាក់'}
                </div>
              )}
            </div>

            {/* Two buttons: Cancel and Confirm */}
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                id="btn-phrase-cancel"
                type="button"
                onClick={() => {
                  setIsPhraseConfirmOpen(false);
                  setClearPhraseInput('');
                  setPhraseError(false);
                }}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.modalPhraseCancelBtn}
              </button>

              <button
                id="btn-phrase-confirm"
                type="button"
                onClick={handlePhraseConfirmSubmit}
                disabled={!isPhraseMatch}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition shadow-xs ${
                  isPhraseMatch
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20 cursor-pointer animate-pulse'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                {t.modalPhraseConfirmBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Delete Single Transaction confirmation */}
      {isDeleteConfirmOpen && (
        <div id="modal-delete-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 shadow-2xl text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white">
              {t.modalDeleteTitle}
            </h3>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t.modalDeleteWarning}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                id="btn-confirm-delete-cancel"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setPendingDeleteId(null);
                }}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.modalDeleteCancel}
              </button>
              <button
                id="btn-confirm-delete-yes"
                onClick={confirmDeleteTransaction}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 shadow-xs transition cursor-pointer"
              >
                {t.modalDeleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Google Sheets Security Verification popup Div box */}
      {isGoogleModalOpen && (
        <div id="modal-google-sheets-confirm" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl text-center">
            
            {/* Header Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="h-6 w-6 text-emerald-600" />
            </div>

            {/* Title */}
            <h3 className="mt-3 font-display text-base font-bold text-gray-900 dark:text-white">
              {googleActionType === 'CONNECT' 
                ? (lang === 'en' ? 'Authorize Google Sheets Connection' : 'អនុញ្ញាតការភ្ជាប់ទៅ Google Sheets')
                : (lang === 'en' ? 'Disconnect Google Sheets Ledger' : 'ផ្តាច់ការភ្ជាប់ Google Sheets')
              }
            </h3>

            {/* Prompt */}
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {googleActionType === 'CONNECT'
                ? (lang === 'en' 
                    ? 'To authorize connecting this application to your Google Sheets & Google Drive account, please enter the confirmation phrase below:' 
                    : 'ដើម្បីអនុញ្ញាតឱ្យកម្មវិធីនេះភ្ជាប់ទៅគណនី Google Sheets & Google Drive របស់អ្នក សូមវាយឃ្លាបញ្ជាក់ខាងក្រោម៖')
                : (lang === 'en'
                    ? 'Are you sure you want to disconnect Google Sheets? Stored credentials and cached file IDs will be cleared. Please enter the phrase below to confirm:'
                    : 'តើអ្នកប្រាកដជាចង់ផ្តាច់ Google Sheets មែនទេ? អត្តសញ្ញាណ និងលេខសម្គាល់សន្លឹកកិច្ចការនឹងត្រូវលុប។ សូមវាយឃ្លាបញ្ជាក់ខាងក្រោម៖')
              }
            </p>

            {/* Target Word Display Box */}
            <div className="my-3 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col items-center justify-center gap-0.5">
              <span className="font-mono font-extrabold text-sm tracking-widest text-red-600 dark:text-red-400 select-all">
                I LOVE BONG CHHAY
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {lang === 'en' ? '(Supports uppercase and lowercase typing)' : '(អាចវាយអក្សរតូច ឬធំក៏បាន)'}
              </span>
            </div>

            {/* Text Input Box */}
            <div className="mt-2 text-left">
              <input
                id="input-confirm-google-phrase"
                type="text"
                autoFocus
                value={googlePhraseInput}
                onChange={(e) => {
                  setGooglePhraseInput(e.target.value);
                  if (googlePhraseError) setGooglePhraseError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (googlePhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY') {
                      handleGooglePhraseSubmit();
                    }
                  }
                }}
                placeholder={t.modalPhrasePlaceholder}
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-semibold text-center font-mono focus:outline-hidden transition-all ${
                  googlePhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : googlePhraseError
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                    : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                }`}
              />

              {/* Status helper text */}
              {googlePhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY' ? (
                <div id="google-phrase-status-valid" className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{t.modalPhraseValid}</span>
                </div>
              ) : googlePhraseError ? (
                <div id="google-phrase-status-error" className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{t.modalPhraseError}</span>
                </div>
              ) : (
                <div className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
                  {lang === 'en' ? 'Type "I LOVE BONG CHHAY" to unlock confirmation' : 'វាយ "I LOVE BONG CHHAY" ដើម្បីបើកសិទ្ធិបញ្ជាក់'}
                </div>
              )}
            </div>

            {/* Two buttons: Cancel and Confirm */}
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                id="btn-google-phrase-cancel"
                type="button"
                onClick={() => {
                  setIsGoogleModalOpen(false);
                  setGooglePhraseInput('');
                  setGooglePhraseError(false);
                }}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.modalPhraseCancelBtn}
              </button>

              <button
                id="btn-google-phrase-confirm"
                type="button"
                onClick={handleGooglePhraseSubmit}
                disabled={googlePhraseInput.trim().toUpperCase() !== 'I LOVE BONG CHHAY'}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition shadow-xs ${
                  googlePhraseInput.trim().toUpperCase() === 'I LOVE BONG CHHAY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 cursor-pointer animate-pulse'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                {lang === 'en' ? 'Confirm Action' : 'បញ្ជាក់ការធ្វើ'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
