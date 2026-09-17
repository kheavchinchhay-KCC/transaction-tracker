/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';
import { parseTxDateObject, formatDateToISO } from './dateHelper';

/**
 * Retrieve the active Google OAuth token if not expired
 */
export function getGoogleAccessToken(): string | null {
  const token = localStorage.getItem('google-sheets-token');
  const expiry = localStorage.getItem('google-sheets-token-expiry');
  if (token && expiry) {
    if (Date.now() < parseInt(expiry, 10)) {
      return token;
    }
  }
  // Clear stale tokens
  localStorage.removeItem('google-sheets-token');
  localStorage.removeItem('google-sheets-token-expiry');
  return null;
}

/**
 * Find or create a spreadsheet named "Transaction Tracker by KCC"
 */
async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  // Check if we already have the spreadsheetId cached
  const cachedId = localStorage.getItem('google-sheets-spreadsheet-id');
  if (cachedId) {
    try {
      // Validate that it still exists by fetching its metadata
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cachedId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        return cachedId;
      }
    } catch (e) {
      console.warn('Cached spreadsheet ID validation failed, searching Drive...', e);
    }
    localStorage.removeItem('google-sheets-spreadsheet-id');
  }

  // Search in Google Drive for "Transaction Tracker by KCC"
  const q = encodeURIComponent("name = 'Transaction Tracker by KCC' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const fileId = data.files[0].id;
      localStorage.setItem('google-sheets-spreadsheet-id', fileId);
      return fileId;
    }
  }

  // Create a new spreadsheet if not found
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Transaction Tracker by KCC'
      }
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const newSheetData = await createRes.json();
  const fileId = newSheetData.spreadsheetId;
  localStorage.setItem('google-sheets-spreadsheet-id', fileId);
  return fileId;
}

/**
 * Retrieve list of sheet names from a spreadsheet
 */
async function getExistingSheets(spreadsheetId: string, accessToken: string): Promise<string[]> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error('Failed to retrieve spreadsheet metadata.');
  }
  const data = await res.json();
  return (data.sheets || []).map((s: any) => s.properties.title);
}

/**
 * Add a new sheet (tab) to the spreadsheet
 */
async function createSheet(spreadsheetId: string, title: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: title
            }
          }
        }
      ]
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to create tab "${title}": ${txt}`);
  }
}

/**
 * Format a merchant name to be a clean, valid sheet title (max 30 chars, no special sheet characters)
 */
function cleanSheetTitle(name: string): string {
  const clean = name.replace(/[:\\\/\?\*\[\]]/g, '').trim();
  const finalTitle = clean || 'Unknown';
  return finalTitle.substring(0, 30);
}

/**
 * Sync transaction list to Google Sheets
 */
export async function syncToGoogleSheets(
  transactions: Transaction[],
  groupByMerchant: boolean
): Promise<void> {
  const accessToken = getGoogleAccessToken();
  if (!accessToken) {
    throw new Error('Google connection expired or missing. Please reconnect.');
  }

  // 1. Get or Create Spreadsheet
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);

  // 2. Fetch list of existing sheets (tabs)
  const existingSheets = await getExistingSheets(spreadsheetId, accessToken);

  // Helper to sort transactions chronologically by Date (oldest first, so the sheet acts as a clean continuous log)
  const sortChronologically = (list: Transaction[]) => {
    return [...list].sort((a, b) => {
      const dObjA = parseTxDateObject(a.date);
      const dObjB = parseTxDateObject(b.date);
      const scoreA = dObjA ? dObjA.getTime() : a.createdAt;
      const scoreB = dObjB ? dObjB.getTime() : b.createdAt;
      return scoreA - scoreB;
    });
  };

  // Pre-formatted Header Row
  const headers = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Currency',
    'Store / Receiver',
    'Payer / Payee Detail',
    'Source (Bank)',
    'Transaction ID',
    'APV Code',
    'Remark',
    'Needs Review?'
  ];

  const mapTxToRow = (tx: Transaction) => [
    tx.date,
    tx.time || '',
    tx.type,
    tx.amount !== null ? String(tx.amount) : '',
    tx.currency || 'USD',
    tx.merchant || 'Unknown',
    tx.payerPayee || '',
    tx.source || '',
    tx.transactionId || '',
    tx.apv || '',
    tx.remark || '',
    tx.needsReview ? 'Yes' : 'No'
  ];

  // 1. Handle Expenses (all go to exactly "expense" sheet, sorted chronologically)
  const expenseTransactions = transactions.filter(tx => tx.type === 'EXPENSE');
  const otherTransactions = transactions.filter(tx => tx.type !== 'EXPENSE');

  // Always ensure "expense" sheet exists
  const expenseSheetName = 'expense';
  if (!existingSheets.includes(expenseSheetName)) {
    await createSheet(spreadsheetId, expenseSheetName, accessToken);
    existingSheets.push(expenseSheetName);
  }

  const sortedExpenses = sortChronologically(expenseTransactions);
  const expenseRows = [headers, ...sortedExpenses.map(mapTxToRow)];

  // Clear existing values in the "expense" sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(expenseSheetName)}!A1:Z:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new values to "expense" sheet
  if (expenseTransactions.length > 0) {
    const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(expenseSheetName)}!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: expenseRows })
    });
    if (!writeRes.ok) {
      throw new Error(`Failed to write values to sheet "${expenseSheetName}"`);
    }
  }

  if (groupByMerchant) {
    // Group OTHER transactions by Cleaned Merchant Name
    const groups: { [merchant: string]: Transaction[] } = {};
    otherTransactions.forEach((tx) => {
      const title = cleanSheetTitle(tx.merchant || 'Unknown');
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(tx);
    });

    // Create tabs and write data for each merchant
    for (const sheetName of Object.keys(groups)) {
      if (!existingSheets.includes(sheetName)) {
        await createSheet(spreadsheetId, sheetName, accessToken);
        existingSheets.push(sheetName);
      }

      const sortedGroup = sortChronologically(groups[sheetName]);
      const rows = [headers, ...sortedGroup.map(mapTxToRow)];

      // Clear existing values in the sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Write new values
      const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      });

      if (!writeRes.ok) {
        throw new Error(`Failed to write values for "${sheetName}"`);
      }
    }
  } else {
    // Single Sheet mode
    const sheetName = 'Transactions';
    if (!existingSheets.includes(sheetName)) {
      await createSheet(spreadsheetId, sheetName, accessToken);
      existingSheets.push(sheetName);
    }

    const sortedAll = sortChronologically(otherTransactions);
    const rows = [headers, ...sortedAll.map(mapTxToRow)];

    // Clear existing values
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Write new values to "Transactions" sheet
    if (otherTransactions.length > 0) {
      const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      });

      if (!writeRes.ok) {
        throw new Error(`Failed to write values to sheet "${sheetName}"`);
      }
    }
  }
}
