/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Transaction, TransactionType, Language, ThemeColor } from '../types';
import { translations } from '../utils/lang';
import { THEME_CONFIGS } from '../utils/theme';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  lang: Language;
  themeColor?: ThemeColor;
}

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  lang,
  themeColor = 'emerald'
}: EditTransactionModalProps) {
  // Local form states
  const [type, setType] = useState<TransactionType>('UNKNOWN');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [payerPayee, setPayerPayee] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [apv, setApv] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [needsReview, setNeedsReview] = useState<boolean>(false);

  const t = translations[lang];
  const activeTheme = THEME_CONFIGS[themeColor] || THEME_CONFIGS.emerald;
  const isNew = transaction?.id.startsWith('manual-');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount !== null ? String(transaction.amount) : '');
      setCurrency(transaction.currency || 'USD');
      setDate(transaction.date);
      setTime(transaction.time);
      setMerchant(transaction.merchant);
      setPayerPayee(transaction.payerPayee);
      setSource(transaction.source);
      setTransactionId(transaction.transactionId);
      setApv(transaction.apv);
      setRemark(transaction.remark);
      setNeedsReview(transaction.needsReview);
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = amount.trim() === '' ? null : parseFloat(amount);
    
    // Check if critical fields exist to automatically adjust needsReview
    const autoNeedsReview = (parsedAmount === null || isNaN(parsedAmount) || !merchant.trim() || type === 'UNKNOWN');

    const updatedTx: Transaction = {
      ...transaction,
      type,
      amount: parsedAmount,
      currency,
      date: date.trim(),
      time: time.trim(),
      merchant: merchant.trim() || 'Unknown',
      payerPayee: payerPayee.trim(),
      source: source.trim() || 'Direct',
      transactionId: transactionId.trim(),
      apv: apv.trim(),
      remark: remark.trim(),
      needsReview: autoNeedsReview ? true : needsReview,
      updatedAt: Date.now()
    };

    onSave(updatedTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-6 py-4">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
            {isNew 
              ? (lang === 'en' ? 'Add Manual/Missing Transaction' : 'បញ្ចូលប្រតិបត្តិការដោយដៃ/ខ្វះចន្លោះ')
              : t.modalEditTitle}
          </h3>
          <button
            id="close-edit-modal"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-500 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            
            {/* Row 1: Type & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelType}
                </label>
                <select
                  id="edit-field-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="INCOME">{t.typeIncome}</option>
                  <option value="EXPENSE">{t.typeExpense}</option>
                  <option value="UNKNOWN">{t.typeUnknown}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelCurrency}
                </label>
                <select
                  id="edit-field-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'KHR')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Amount & Source Channel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelAmount}
                </label>
                <input
                  id="edit-field-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelChannel}
                </label>
                <input
                  id="edit-field-source"
                  type="text"
                  placeholder="e.g. ABA PAY"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Row 3: Merchant & Payer/Payee details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelMerchant}
                </label>
                <input
                  id="edit-field-merchant"
                  type="text"
                  placeholder="e.g. Starbucks"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelPayerPayee}
                </label>
                <input
                  id="edit-field-payerpayee"
                  type="text"
                  placeholder="e.g. SENG HOUR"
                  value={payerPayee}
                  onChange={(e) => setPayerPayee(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Row 4: Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelDate}
                </label>
                <input
                  id="edit-field-date"
                  type="text"
                  placeholder="e.g. Jun 12"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelTime}
                </label>
                <input
                  id="edit-field-time"
                  type="text"
                  placeholder="e.g. 12:26 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Row 5: Trx. ID & APV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelTrxId}
                </label>
                <input
                  id="edit-field-trxid"
                  type="text"
                  placeholder="e.g. 17812..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                  {t.labelApv}
                </label>
                <input
                  id="edit-field-apv"
                  type="text"
                  placeholder="e.g. 612744"
                  value={apv}
                  onChange={(e) => setApv(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 tracking-wide uppercase">
                {t.labelRemark}
              </label>
              <textarea
                id="edit-field-remark"
                rows={2}
                placeholder="Add customized notes here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Needs Review Flag Toggle */}
            <div className="flex items-center space-x-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/60">
              <input
                id="edit-field-review-checkbox"
                type="checkbox"
                checked={needsReview}
                onChange={(e) => setNeedsReview(e.target.checked)}
                className="h-4 w-4 rounded-sm border-gray-300 text-amber-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <label htmlFor="edit-field-review-checkbox" className="text-xs font-semibold text-amber-950 dark:text-amber-300 cursor-pointer">
                  {t.labelFlaggedReview}
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
            <button
              id="btn-edit-cancel"
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
            >
              {t.btnCancel}
            </button>
            <button
              id="btn-edit-save"
              type="submit"
              className={`inline-flex items-center gap-1.5 rounded-lg ${activeTheme.btnPrimaryBg} ${activeTheme.btnPrimaryHover} px-5 py-2 text-sm font-bold shadow-xs transition cursor-pointer`}
            >
              <Save className="h-4 w-4" />
              {isNew 
                ? (lang === 'en' ? 'Add Transaction' : 'បញ្ចូលប្រតិបត្តិការ') 
                : t.btnSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
