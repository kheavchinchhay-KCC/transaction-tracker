/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTransactions: () => ipcRenderer.invoke('get-transactions'),
  saveTransactions: (txs) => ipcRenderer.invoke('save-transactions', txs),
  deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id),
  clearAllTransactions: () => ipcRenderer.invoke('clear-all-transactions')
});
