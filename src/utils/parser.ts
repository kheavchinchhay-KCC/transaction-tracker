/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, TransactionType, ParseResult } from '../types';

/**
 * Generate a unique ID (UUID style via random timestamp + crypto if available)
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'tx_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Translates Khmer numerals (០-៩) to normal Arabic digits (0-9)
 */
export function translateKhmerDigits(text: string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(khmerDigits[i], 'g'), String(i));
  }
  return result;
}

/**
 * Normalizes text to make duplicate checking and parsing highly tolerant
 */
export function normalizeText(text: string): string {
  const arabicStr = translateKhmerDigits(text);
  return arabicStr
    .toLowerCase()
    .replace(/[\s\r\n\t]+/g, ' ') // Collapse whitespaces
    .replace(/[^\w\s$.,៛]/g, '')   // Remove weird symbols, keep numbers, letters, currency ($, ៛)
    .trim();
}

/**
 * Generate a fingerprint for a transaction to prevent duplicates without Trx ID
 */
export function generateFingerprint(tx: {
  amount: number | null;
  currency: 'USD' | 'KHR';
  date: string;
  time: string;
  merchant: string;
  payerPayee: string;
  rawText: string;
}): string {
  const normRaw = normalizeText(tx.rawText);
  const normAmount = tx.amount !== null ? Number(tx.amount).toFixed(2) : 'no_amount';
  const normDate = tx.date.trim().toLowerCase();
  const normTime = tx.time.trim().toLowerCase();
  const normMerchant = tx.merchant.trim().toLowerCase();
  const normPayer = tx.payerPayee.trim().toLowerCase();
  
  return `fp__${normAmount}__${tx.currency}__${normDate}__${normTime}__${normMerchant}__${normPayer}__${normRaw.substring(0, 50)}`;
}

/**
 * Split pasted raw block of text into individual transactions candidates
 */
export function splitIntoTransactions(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (!cleanedLine) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      continue;
    }

    // Translate Khmer numerals for testing starts-with
    const processedLine = translateKhmerDigits(cleanedLine);

    // Identifiers for start of a new transaction
    const startsWithBracketTimestamp = /^\[[\d\s/.,:apm-]+\]/i.test(cleanedLine);
    const startsWithBankName = /^(?:PayWay|ABA\s*Bank|ABA\s*PAY|ACLEDA|Wing|Canadia|Sathapana|Prince|Bakong|TrueMoney|Chip\s*Mong|KB\s*PRASAC|FTB|Mobile\s*Banking)/i.test(cleanedLine);
    const startsWithDate = /^(?:\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3,10}\s+\d{2,4})/i.test(processedLine);
    const startsWithAmount = /^(?:\+|-)?\s*(?:\$|USD|KHR|EUR|€|៛|រៀល)\s*\d+/i.test(processedLine) || 
                             /^\d+(?:\.\d+)?\s*(?:USD|KHR|៛|រៀល)/i.test(processedLine);
    const startsWithKeyword = /^(?:USD|KHR|Spent|Paid|Received|Sent|Deposit|Debited|Credited|Transfer|Incoming|Outgoing|បានទូទាត់|បានផ្ញើ|បានទទួល|ផ្ទេរប្រាក់|ផ្ទេរចូល|ផ្ទេរចេញ)/i.test(cleanedLine);
    const hasStrictBankKeywords = cleanedLine.includes('paid by') || 
                                  cleanedLine.includes('paid to') || 
                                  cleanedLine.includes('Trx. ID:') ||
                                  cleanedLine.includes('Txn ID:') ||
                                  cleanedLine.includes('APV:') ||
                                  cleanedLine.includes('បានទូទាត់ដោយ') ||
                                  cleanedLine.includes('បានទូទាត់ទៅ') ||
                                  cleanedLine.includes('លេខប្រតិបត្តិការ');

    const isNewTransaction = startsWithBracketTimestamp || startsWithBankName || startsWithDate || startsWithAmount || startsWithKeyword || (hasStrictBankKeywords && (!currentChunk || currentChunk.includes('Trx. ID:') || currentChunk.includes('APV:')));

    if (isNewTransaction && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = cleanedLine;
    } else {
      if (currentChunk) {
        currentChunk += ' ' + cleanedLine;
      } else {
        currentChunk = cleanedLine;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Map Khmer month names to English or maintain standardized dates
 */
export function parseKhmerMonthToEn(text: string): string {
  const kmMonths = [
    { km: 'មករា', en: 'Jan' },
    { km: 'កុម្ភៈ', en: 'Feb' },
    { km: 'មីនា', en: 'Mar' },
    { km: 'មេសា', en: 'Apr' },
    { km: 'ឧសភា', en: 'May' },
    { km: 'មិថុនា', en: 'Jun' },
    { km: 'កក្កដា', en: 'Jul' },
    { km: 'សីហា', en: 'Aug' },
    { km: 'កញ្ញា', en: 'Sep' },
    { km: 'តុលា', en: 'Oct' },
    { km: 'វិច្ឆិកា', en: 'Nov' },
    { km: 'ធ្នូ', en: 'Dec' },
  ];
  let res = text;
  kmMonths.forEach((m) => {
    res = res.replace(new RegExp(m.km, 'gi'), m.en);
  });
  return res;
}

/**
 * Parse a single transaction text chunk
 */
export function parseSingleTransaction(rawText: string): Transaction {
  // Translate Khmer digits for mathematical evaluations
  const processedText = translateKhmerDigits(rawText.trim().replace(/\s+/g, ' '));
  const originalText = rawText.trim().replace(/\s+/g, ' ');

  // 1. Determine Type (INCOME / EXPENSE / UNKNOWN)
  let type: TransactionType = 'UNKNOWN';

  // Strict & Comprehensive Income Checks (Khmer & English)
  const isIncome = 
    /paid by/i.test(originalText) ||
    /received from/i.test(originalText) ||
    /transferred from/i.test(originalText) ||
    /transfer from/i.test(originalText) ||
    /incoming transfer/i.test(originalText) ||
    /deposit/i.test(originalText) ||
    /credited/i.test(originalText) ||
    /inflow/i.test(originalText) ||
    /refund/i.test(originalText) ||
    /^\s*\+\s*[0-9]/i.test(originalText) ||
    /\+\s*(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9]/i.test(originalText) ||
    /បានទូទាត់ដោយ/i.test(originalText) ||
    /បានបង់ដោយ/i.test(originalText) ||
    /ផ្ទេរពី/i.test(originalText) ||
    /ផ្ទេរប្រាក់ពី/i.test(originalText) ||
    /បានផ្ទេរពី/i.test(originalText) ||
    /បានទទួលពី/i.test(originalText) ||
    /បានទទួលប្រាក់ពី/i.test(originalText) ||
    /ទទួលពី/i.test(originalText) ||
    /ទទួលបាន/i.test(originalText) ||
    /បានទទួល/i.test(originalText) ||
    /ទទួលប្រាក់/i.test(originalText) ||
    /ផ្ទេរចូល/i.test(originalText) ||
    /ផ្ទេរប្រាក់ចូល/i.test(originalText) ||
    /ចំណូលពី/i.test(originalText) ||
    /ចំណូល/i.test(originalText);

  // Strict & Comprehensive Expense Checks (Khmer & English)
  const isExpense =
    /paid to/i.test(originalText) ||
    /paid\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?to/i.test(originalText) ||
    /paid\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?at/i.test(originalText) ||
    /paid\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?for/i.test(originalText) ||
    /payment to/i.test(originalText) ||
    /payment at/i.test(originalText) ||
    /payment for/i.test(originalText) ||
    /payment of\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?to/i.test(originalText) ||
    /bill payment/i.test(originalText) ||
    /qr payment/i.test(originalText) ||
    /merchant payment/i.test(originalText) ||
    /sent to/i.test(originalText) ||
    /sent\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?to/i.test(originalText) ||
    /send to/i.test(originalText) ||
    /transfer to/i.test(originalText) ||
    /transferred to/i.test(originalText) ||
    /transferred\s+(?:(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9,.]+\s+)?to/i.test(originalText) ||
    /debited/i.test(originalText) ||
    /spent/i.test(originalText) ||
    /spent on/i.test(originalText) ||
    /spent at/i.test(originalText) ||
    /withdrawal/i.test(originalText) ||
    /withdrew/i.test(originalText) ||
    /purchase/i.test(originalText) ||
    /purchased/i.test(originalText) ||
    /bought/i.test(originalText) ||
    /charged/i.test(originalText) ||
    /cash out/i.test(originalText) ||
    /outflow/i.test(originalText) ||
    /^\s*-\s*[0-9]/i.test(originalText) ||
    /-\s*(?:\$|USD|KHR|EUR|៛|រៀល)?\s*[0-9]/i.test(originalText) ||
    /បានទូទាត់ទៅ/i.test(originalText) ||
    /បានទូទាត់ចំនួន.*?ទៅ/i.test(originalText) ||
    /បានទូទាត់នៅ/i.test(originalText) ||
    /បានទូទាត់/i.test(originalText) ||
    /បានបង់ប្រាក់/i.test(originalText) ||
    /បង់ប្រាក់/i.test(originalText) ||
    /ទូទាត់ទៅ/i.test(originalText) ||
    /ទូទាត់ប្រាក់/i.test(originalText) ||
    /ផ្ទេរទៅ/i.test(originalText) ||
    /បានផ្ញើទៅ/i.test(originalText) ||
    /ផ្ទេរប្រាក់ទៅ/i.test(originalText) ||
    /ផ្ទេរចេញ/i.test(originalText) ||
    /បានផ្ញើ/i.test(originalText) ||
    /ទិញទំនិញ/i.test(originalText) ||
    /ទិញ/i.test(originalText) ||
    /ដកប្រាក់/i.test(originalText) ||
    /ចំណាយទៅ/i.test(originalText) ||
    /ចំណាយ/i.test(originalText);

  if (isIncome && !isExpense) {
    type = 'INCOME';
  } else if (isExpense && !isIncome) {
    type = 'EXPENSE';
  } else if (isIncome && isExpense) {
    // Conflict resolution: check whether 'paid by' or 'paid to' is present
    if (/paid by|បានទូទាត់ដោយ|ផ្ទេរពី|បានទទួល/i.test(originalText)) {
      type = 'INCOME';
    } else {
      type = 'EXPENSE';
    }
  }

  // 2. Determine Currency Mode (USD or KHR)
  let currency: 'USD' | 'KHR' = 'USD';
  if (/៛|KHR|riel|riels|រៀល/i.test(processedText)) {
    currency = 'KHR';
  } else if (/\$|USD/i.test(processedText)) {
    currency = 'USD';
  }

  // 3. Extract Amount (Must be an actual currency figure, never matching timestamp, Trx ID, APV, or phone suffix)
  let amount: number | null = null;
  
  // Patterns strictly looking for currency symbols, keywords, or signed amounts
  const amountPatterns = [
    // 1. Currency prefix: e.g. "$14.00", "USD 34.35", "KHR 50,000", "៛ 40000", "EUR 20"
    /(?:\$|USD|KHR|EUR|€|៛|រៀល)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/i,
    // 2. Currency suffix: e.g. "14.00$", "34.35 USD", "50,000 KHR", "40000 ៛", "50000 រៀល", "20 riels"
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:USD|KHR|EUR|€|៛|riel|riels|រៀល)/i,
    // 3. Explicit label e.g., "Amount: 14.00", "Amt: $34.35", "ទឹកប្រាក់៖ 14.00"
    /(?:Amount|Amt|Value|ទឹកប្រាក់|ចំនួនទឹកប្រាក់|ចំនួន)\s*[:=-]?\s*(?:\$|USD|KHR|៛|រៀល)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/i,
    // 4. Directly following bank header: e.g. "PayWay by ABA: $14.00" or "ABA PAY: 14.00"
    /(?:PayWay\s*by\s*ABA|ABA\s*PAY|ABA\s*Bank|ACLEDA|Wing|Canadia|Bakong)\s*[:=-]?\s*(?:\+|-)?\s*(?:\$|USD|KHR|៛|រៀល)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)(?=\s+(?:paid|from|to|by|on|at|via)|$)/i,
    // 5. Standalone signed decimal amount at start: e.g. "+$14.00", "+14.00", "-$34.35"
    /(?:^|\s)(?:\+|-)\s*(?:\$|USD|KHR|៛|រៀល)?\s*([0-9]+(?:\.[0-9]{2})|[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))(?:\s|$)/i,
  ];

  for (const regex of amountPatterns) {
    const match = processedText.match(regex);
    if (match && match[1]) {
      const parsedVal = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        break;
      }
    }
  }

  // 4. Extract Trx. ID and APV
  let transactionId = '';
  const trxMatch = processedText.match(/(?:Trx\.?\s*ID|Transaction\s*ID|Txn\s*ID|លេខប្រតិបត្តិការ|លេខយោង|លេខ\s*Trx|Ref\.?|App\.\s*ID)\s*[:=]?\s*([A-Za-z0-9_-]+)/i);
  if (trxMatch && trxMatch[1]) {
    transactionId = trxMatch[1].replace(/[.,]$/, '').trim();
  }

  let apv = '';
  const apvMatch = processedText.match(/(?:APV|Auth\s*Code|Approval\s*Code|កូដ\s*APV|លេខកូដអនុម័ត|កូដអនុម័ត)\s*[:=]?\s*([A-Za-z0-9]+)/i);
  if (apvMatch && apvMatch[1]) {
    apv = apvMatch[1].replace(/[.,]$/, '').trim();
  }

  // 5. Extract Date and Time (with support for English & Khmer dates)
  let date = '';
  let time = '';

  // Standardize Khmer month in string for matching
  const preProcessedDateText = parseKhmerMonthToEn(processedText);

  // Check bracketed timestamp at start: e.g. [8/1/2026 8:05 AM] or [8/1/2026, 8:05 AM]
  const bracketMatch = preProcessedDateText.match(/^\[\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3,10}\s+\d{2,4})(?:,?\s+|\s+)(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*\]/i);
  if (bracketMatch) {
    date = bracketMatch[1].trim();
    time = bracketMatch[2].trim();
  }

  // Look for: "on Aug 01, 08:05 AM" or "on Jun 12 at 12:26 PM" in body
  if (!date || !time) {
    const dateAndTimeMatch = preProcessedDateText.match(/on\s+([A-Za-z]{3,10}\s+\d{1,2})(?:,?\s+at\s+|\s+|,?\s+)(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
    if (dateAndTimeMatch) {
      if (!date) date = dateAndTimeMatch[1];
      if (!time) time = dateAndTimeMatch[2];
    }
  }

  if (!date) {
    const dateMatch = preProcessedDateText.match(/on\s+([A-Za-z]{3,10}\s+\d{1,2}(?:,?\s+\d{4})?)/i) || 
                      preProcessedDateText.match(/(?:Date|Dated|កាលបរិច្ឆេទ|ថ្ងៃខែ|ថ្ងៃទី)\s*[:=-]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i) ||
                      preProcessedDateText.match(/(\d{1,2}\s+[A-Za-z]{3,10}\s+\d{2,4})/i) ||
                      preProcessedDateText.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
    if (dateMatch) {
      date = dateMatch[1].replace(/[.,៖]$/, '').trim();
    }
  }

  if (!time) {
    const timeMatch = preProcessedDateText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i) || 
                      preProcessedDateText.match(/(?:at|Time|ម៉ោង)\s*[:=-]?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i) ||
                      preProcessedDateText.match(/(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      time = timeMatch[1].trim();
    }
  }

  // Fallbacks
  if (!date) {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    date = `${months[today.getMonth()]} ${today.getDate()}`;
  }

  // 5b. Year-detection integration. Append current year if missing (e.g. "Aug 01" -> "Aug 01, 2026")
  const currentYear = new Date().getFullYear();
  const hasYear = /\b(?:19|20)\d{2}\b/.test(date);
  if (!hasYear && date) {
    if (date.includes('/')) {
      date = `${date}/${currentYear}`;
    } else if (date.includes('-')) {
      date = `${date}-${currentYear}`;
    } else {
      date = `${date}, ${currentYear}`;
    }
  }

  if (!time) {
    const today = new Date();
    let hours = today.getHours();
    const minutes = today.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    time = `${hours}:${minutes} ${ampm}`;
  }

  // 6. Extract Payer/Payee details (supporting Khmer names)
  let payerPayee = '';
  if (type === 'INCOME') {
    const payerMatch = originalText.match(/(?:paid by|from|ផ្ទេរពី|បានទទួលពី|ទទួលពី|ចំណូលពី)\s+(.+?)(?:\s+(?:on|via|at|Remark:|By|Trx\. ID|APV|តាមរយៈ|នៅហាង|នៅ|លេខប្រតិបត្តិការ)|$)/i);
    if (payerMatch) {
      payerPayee = payerMatch[1].replace(/[.,៖]$/, '').trim();
    }
  } else {
    const payeeMatch = originalText.match(/(?:paid to|to|ផ្ទេរទៅ|បានផ្ញើទៅ|ចំណាយទៅ|ទូទាត់ទៅ)\s+(.+?)(?:\s+(?:on|via|at|Remark:|By|Trx\. ID|APV|តាមរយៈ|នៅហាង|នៅ|លេខប្រតិបត្តិការ)|$)/i);
    if (payeeMatch) {
      payerPayee = payeeMatch[1].replace(/[.,៖]$/, '').trim();
    }
  }

  // 7. Extract Source Channel (detect standard Cambodian banks)
  let source = '';
  const sourceMatch = originalText.match(/(?:via|តាមរយៈ)\s+([A-Za-z0-9 ]+?)(?:\s+(?:at|by|Remark:|Trx\. ID|APV|on|នៅហាង|នៅ|លេខប្រតិបត្តិការ)|$)/i);
  if (sourceMatch) {
    source = sourceMatch[1].replace(/[.,៖]$/, '').trim();
  } else {
    // Heuristics for Cambodian bank apps
    if (/ABA PAY|ABA Bank/i.test(originalText)) source = 'ABA PAY';
    else if (/ACLEDA Mobile|ACLEDA Bank/i.test(originalText)) source = 'ACLEDA Mobile';
    else if (/Wing Bank|Wing Pay/i.test(originalText)) source = 'Wing Bank';
    else if (/Sathapana ToanChet|Sathapana/i.test(originalText)) source = 'Sathapana ToanChet';
    else if (/Canadia/i.test(originalText)) source = 'Canadia Bank';
    else if (/Prince/i.test(originalText)) source = 'Prince Mobile';
    else if (/Bakong/i.test(originalText)) source = 'Bakong';
    else source = 'Mobile Banking';
  }

  // 8. Extract Merchant / Location
  let merchant = '';
  const merchantMatch = originalText.match(/(?:at|នៅ|នៅហាង)\s+(.+?)(?:\s+(?:via|Remark:|Trx\. ID|APV|on|តាមរយៈ|លេខយោង|លេខប្រតិបត្តិការ)|$)/i);
  if (merchantMatch) {
    let rawMerchant = merchantMatch[1].replace(/[.,៖]$/, '').trim();
    if (rawMerchant.toLowerCase().includes(' by ')) {
      const parts = rawMerchant.split(/\s+by\s+/i);
      merchant = parts[0].trim();
    } else {
      merchant = rawMerchant;
    }
  }

  if (!merchant && type === 'EXPENSE' && payerPayee) {
    merchant = payerPayee;
  }

  // 9. Extract Remark
  let remark = '';
  const remarkMatch = originalText.match(/(?:Remark|Note|សម្គាល់|ចំណាំ|ព័ត៌មានបន្ថែម)\s*:\s*([^.]*)(?:\.|$)/i) ||
                      originalText.match(/(?:Remark|Note|សម្គាល់|ចំណាំ|ព័ត៌មានបន្ថែម)៖\s*([^.]*)(?:\.|$)/i);
  if (remarkMatch) {
    remark = remarkMatch[1].trim();
    if (remark === '.') remark = '';
  }

  // Clean elements if empty/unresolved
  if (!payerPayee) payerPayee = type === 'INCOME' ? 'Unknown Payer' : 'Unknown Payee';
  if (!merchant) merchant = type === 'EXPENSE' ? payerPayee : 'Direct Deposit';

  // Determine if it needs review: Missing Detect if no Amount, no APV, no TRX ID, no Date, or UNKNOWN type
  const isMissingAmount = amount === null || isNaN(amount) || amount <= 0;
  const isMissingTrxId = !transactionId || !transactionId.trim();
  const isMissingApv = !apv || !apv.trim();
  const isMissingDate = !date || !date.trim();
  const isUnknownType = type === 'UNKNOWN';

  const needsReview = isMissingAmount || isMissingTrxId || isMissingApv || isMissingDate || isUnknownType;

  // Build temporary object to generate fingerprint
  const tempTx = {
    amount,
    currency,
    date,
    time,
    merchant,
    payerPayee,
    rawText: originalText
  };

  const fingerprint = generateFingerprint(tempTx);
  const createdAt = Date.now();

  const finalTx: Transaction = {
    id: generateId(),
    type,
    amount,
    currency,
    date,
    time,
    merchant,
    payerPayee,
    source,
    transactionId,
    apv,
    remark,
    rawText: originalText,
    fingerprint,
    needsReview,
    createdAt,
    updatedAt: createdAt,
  };

  return finalTx;
}

/**
 * Filter duplicates and compile statistics for batch parse inputs
 */
export function processRawPastedText(
  text: string, 
  existingTransactions: Transaction[]
): ParseResult {
  const chunks = splitIntoTransactions(text);
  const parsed: Transaction[] = [];
  const duplicates: Transaction[] = [];
  let skippedCount = 0;
  let reviewCount = 0;

  // Build fast lookups for existing transactions
  const existingTrxIds = new Set<string>();
  const existingApvs = new Set<string>();
  const existingFingerprints = new Set<string>();

  existingTransactions.forEach((tx) => {
    if (tx.transactionId && tx.transactionId.trim()) {
      existingTrxIds.add(tx.transactionId.toLowerCase().trim());
    }
    if (tx.apv && tx.apv.trim()) {
      existingApvs.add(tx.apv.toLowerCase().trim());
    }
    if (tx.fingerprint) {
      existingFingerprints.add(tx.fingerprint);
    }
  });

  const currentBatchTrxIds = new Set<string>();
  const currentBatchApvs = new Set<string>();
  const currentBatchFingerprints = new Set<string>();

  for (const chunk of chunks) {
    if (!chunk || !chunk.trim()) continue;
    
    const tx = parseSingleTransaction(chunk);

    let isDuplicate = false;
    const cleanTrxId = tx.transactionId ? tx.transactionId.toLowerCase().trim() : '';
    const cleanApv = tx.apv ? tx.apv.toLowerCase().trim() : '';

    // Check duplicate by Trx. ID
    if (cleanTrxId) {
      if (existingTrxIds.has(cleanTrxId) || currentBatchTrxIds.has(cleanTrxId)) {
        isDuplicate = true;
      }
    }

    // Check duplicate by APV (when APV exists and no Trx ID or both match)
    if (!isDuplicate && cleanApv) {
      if (existingApvs.has(cleanApv) || currentBatchApvs.has(cleanApv)) {
        isDuplicate = true;
      }
    }

    // Check duplicate by fingerprint
    if (!isDuplicate && tx.fingerprint) {
      if (existingFingerprints.has(tx.fingerprint) || currentBatchFingerprints.has(tx.fingerprint)) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      duplicates.push(tx);
      skippedCount++;
    } else {
      parsed.push(tx);
      if (cleanTrxId) currentBatchTrxIds.add(cleanTrxId);
      if (cleanApv) currentBatchApvs.add(cleanApv);
      if (tx.fingerprint) currentBatchFingerprints.add(tx.fingerprint);

      if (tx.needsReview) {
        reviewCount++;
      }
    }
  }

  return {
    parsed,
    duplicates,
    skippedCount,
    reviewCount,
  };
}
