import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Printer, ExternalLink, Calendar, DollarSign, Tag, CheckCircle, Clock, AlertCircle, X, Eye, Sparkles, Trash2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  dueDate: string;
  status: string;
  issuedDate: string;
  is_seed_data?: number;
}

export const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludeSeed, setExcludeSeed] = useState(false);
  
  // Selection state for opening invoice details modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices?exclude_seed=${excludeSeed}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        throw new Error('Failed to load invoices.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurgeSeed = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all simulated seed billing records from the database? This will allow you to rely solely on real Stripe webhook events to populate the billing tables.')) {
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/billing/purge-seed', { method: 'POST' });
      if (res.ok) {
        await fetchInvoices();
      } else {
        throw new Error('Failed to delete seed invoices database entries.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [excludeSeed]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40';
      case 'Open':
        return 'bg-amber-950/40 text-amber-300 border-amber-900/40';
      default:
        return 'bg-slate-800/40 text-slate-400 border-slate-700/60';
    }
  };

  // Stats
  const totalBilled = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);
  const outstandingBilled = invoices
    .filter(i => i.status === 'Open')
    .reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);

  return (
    <div id="invoices_scope" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Invoices & Manifest Archive
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Display historic client manifests, download invoices, print transaction receipts, or audit previous payments.
          </p>
        </div>
      </div>

      {/* Simulation/Seed Data Manager Banner */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400 shrink-0">
            <Sparkles className="w-5.5 h-5.5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Simulated Sandbox Environment</h4>
            <p className="text-xs text-slate-350 mt-1 leading-relaxed">
              Currently including SQLite seed data for display. You can exclude them from queries or permanently delete all seed data to rely purely on live Stripe checkout and subscription webhooks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto select-none">
          <button
            onClick={() => setExcludeSeed(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              excludeSeed 
                ? 'bg-amber-600/20 border-amber-500/30 text-amber-300' 
                : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {excludeSeed ? '✓ Showing Only Webhook Data' : 'Filter Out Seeds'}
          </button>
          <button
            onClick={handlePurgeSeed}
            className="px-3.5 py-1.5 bg-red-900/25 hover:bg-red-900/40 border border-red-800/60 text-red-200 hover:text-red-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Drop/Purge Seed Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 font-mono">Compiling ledger manifests...</div>
      ) : error ? (
        <div className="p-4 bg-red-900/45 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Invoice index failing: {error}</span>
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Paid/Settled Accounts</span>
              <span className="text-2xl font-bold text-emerald-400 block mt-1">${totalBilled.toLocaleString()}</span>
              <span className="text-xs text-slate-500 block mt-1">Accumulated tax settlements included</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Outstanding / Open Accounts</span>
              <span className="text-2xl font-bold text-amber-500 block mt-1">${outstandingBilled.toLocaleString()}</span>
              <span className="text-xs text-slate-500 block mt-1">Awaiting automatic settlement dates</span>
            </div>
          </div>

          {/* Invoices List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((inv, idx) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, delay: idx * 0.02 }}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700/80 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 tracking-wider font-bold">
                        {inv.invoiceNumber}
                      </span>
                      {inv.is_seed_data === 1 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-amber-500/15 text-amber-400 border border-amber-500/10 uppercase">
                          Seed
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${getStatusStyle(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-white truncate">{inv.customerName}</h4>
                  
                  <div className="mt-4 space-y-1.5 font-mono text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Issued:</span>
                      <span>{inv.issuedDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Due:</span>
                      <span>{inv.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/85 mt-4 pt-4 flex items-center justify-between">
                  <span className="text-xl font-mono font-black text-slate-200">
                    {inv.amount}
                  </span>

                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Biller
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Invoice Detail Modal Sheet / Printable Receipt */}
      {selectedInvoice && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static print:h-auto overflow-y-auto">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:border-0 print:shadow-none print:bg-white print:text-black text-slate-200"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between print:hidden">
              <span className="text-xs font-mono text-slate-400">Biller Workspace Receipt</span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Invoice body */}
            <div className="p-6 sm:p-10 space-y-8 print:p-0 print:space-y-6">
              {/* Top Meta info */}
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-black text-white print:text-black tracking-tight">RANKTICA STUDIO</h1>
                  <p className="text-sm text-slate-400 print:text-gray-600 mt-1">Creator Strategy & Multi-channel Agency LLC</p>
                  <p className="text-xs text-slate-500 mt-0.5 print:text-gray-500">support@ranktica.io | Wyoming, US</p>
                </div>

                <div className="mathrm sm:text-right font-mono text-xs text-slate-400 print:text-gray-600">
                  <h3 className="text-lg font-bold text-slate-200 print:text-black mb-1">{selectedInvoice.invoiceNumber}</h3>
                  <div>STATUS: <span className="font-bold uppercase text-slate-100 print:text-black">{selectedInvoice.status}</span></div>
                  <div>Issued Date: {selectedInvoice.issuedDate}</div>
                  <div>Due Date: {selectedInvoice.dueDate}</div>
                </div>
              </div>

              {/* Payee Bill to section */}
              <div className="border-t border-b border-slate-800/80 py-4 grid grid-cols-2 gap-4 print:border-gray-300">
                <div>
                  <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">Bill To:</span>
                  <div className="text-base font-bold text-white print:text-black mt-1">{selectedInvoice.customerName}</div>
                  <div className="text-xs text-slate-400 print:text-gray-600">Subscriber Client Account</div>
                </div>
                <div>
                  <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">Source Channel:</span>
                  <div className="text-base font-medium text-slate-300 print:text-black mt-1">Stripe Settlement Service</div>
                  <div className="text-xs text-slate-400 print:text-gray-600">Settled Currency (USD)</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 pb-2 text-slate-500 uppercase tracking-wider print:border-gray-300">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 print:text-black">
                    <tr className="border-b border-slate-800/40 print:border-gray-200">
                      <td className="py-3">
                        <div className="font-bold text-slate-200 print:text-black">Ranktica Studio Plan Bundle</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Enterprise Content Engine subscription</div>
                      </td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right">{selectedInvoice.amount}</td>
                      <td className="py-3 text-right">{selectedInvoice.amount}</td>
                    </tr>
                    <tr className="border-b border-slate-805/40 print:border-gray-200">
                      <td className="py-3">
                        <div className="font-bold text-slate-200 print:text-black">Secure Client IndexedDB Storage Migration</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Dedicated sandboxed data allocation</div>
                      </td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right">$0.00</td>
                      <td className="py-3 text-right">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sum calculator */}
              <div className="flex justify-end pt-4">
                <div className="w-60 space-y-2 text-sm font-mono">
                  <div className="flex justify-between text-slate-400 print:text-gray-600">
                    <span>Subtotal:</span>
                    <span>{selectedInvoice.amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 print:text-gray-600">
                    <span>Taxes (0%):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-white print:text-black pt-2 border-t border-slate-800 font-extrabold print:border-gray-200">
                    <span>Grand Total:</span>
                    <span>{selectedInvoice.amount}</span>
                  </div>
                </div>
              </div>

              {/* Signature footnote */}
              <div className="text-center font-serif italic text-xs text-slate-500 mt-12 print:text-gray-600">
                Thank you for being part of Ranktica Studio's verified creator ecosystem!
              </div>
            </div>

            {/* Action panel */}
            <div className="bg-slate-950/60 p-4 border-t border-slate-850 flex items-center justify-end gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" /> Print / PDF Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
