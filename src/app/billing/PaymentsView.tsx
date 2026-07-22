import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wallet, Landmark, Radio, Search, Filter, RefreshCw, AlertCircle, Sparkles, CheckCircle, ArrowDownLeft, XCircle, Trash2 } from 'lucide-react';

interface Payment {
  id: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  status: string;
  timestamp: string;
  is_seed_data?: number;
}

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludeSeed, setExcludeSeed] = useState(false);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Transaction simulation form state
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [simulationData, setSimulationData] = useState({
    customerName: 'Aisha Malik',
    amount: '$99',
    paymentMethod: 'EasyPaisa *******110',
    status: 'Authorized',
    timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ')
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/billing/payments?exclude_seed=${excludeSeed}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      } else {
        throw new Error('Failed to load transaction logs.');
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
        await fetchPayments();
      } else {
        throw new Error('Failed to delete seed payment database segments.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [excludeSeed]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationData)
      });
      if (res.ok) {
        await fetchPayments();
        setIsSimulateOpen(false);
        // Toast style alert
        alert(`Transaction generated successfully! Account synced.`);
      }
    } catch (err) {
      console.error('Simulation payment failure:', err);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Dynamic calculations
  const totalVolume = payments
    .filter(p => p.status === 'Authorized')
    .reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^0-9.]/g, '') || '0'), 0);

  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const failedCount = payments.filter(p => p.status === 'Failed').length;

  return (
    <div id="payments_scope" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Payment Ledger & Auditing
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry of credit cards (Mastercard/Visa), mobile wallets (EasyPaisa), & Payoneer business wires.
          </p>
        </div>
        <button
          onClick={() => setIsSimulateOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-emerald-100" /> Simulate Transaction
        </button>
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
        <div className="py-12 text-center text-slate-400 font-mono">Connecting to ledger streams...</div>
      ) : error ? (
        <div className="p-4 bg-red-900/45 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Ledger fetch failing: {error}</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Settled Gross Volume</span>
              <span className="text-2xl font-bold text-emerald-400 block mt-1">${totalVolume.toLocaleString()} USD</span>
              <span className="text-xs text-slate-500 block mt-1">Fully cleared in treasury</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Pending Settlement</span>
              <span className="text-2xl font-bold text-amber-500 block mt-1">{pendingCount} transactions</span>
              <span className="text-xs text-slate-500 block mt-1">Awaiting bank authorizations</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Liquidation Failures</span>
              <span className="text-2xl font-bold text-red-500 block mt-1">{failedCount} declines</span>
              <span className="text-xs text-slate-500 block mt-1">Declined or aborted attempts</span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by payee name or funding source..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> status:
              </span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Transactions</option>
                <option value="Authorized">Authorized</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Transaction Ledger list */}
          <div className="space-y-3">
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-sm border border-slate-800 rounded-xl bg-slate-900/10">
                No telemetry data found for active filter.
              </div>
            ) : (
              filteredPayments.map((p, idx) => {
                const isSuccess = p.status === 'Authorized';
                const isPending = p.status === 'Pending';
                
                // Icon picker based on payment description
                const paymentDescLower = p.paymentMethod.toLowerCase();
                const isEasyPaisa = paymentDescLower.includes('easypaisa');
                const isPayoneer = paymentDescLower.includes('payoneer');

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="p-4 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        isSuccess ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' :
                        isPending ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' :
                        'bg-red-950/45 text-red-400 border border-red-900/30'
                      }`}>
                        {isEasyPaisa ? (
                          <Wallet className="w-5 h-5" />
                        ) : isPayoneer ? (
                          <Landmark className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          {p.customerName}
                          {p.is_seed_data === 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-amber-500/15 text-amber-400 border border-amber-500/10 uppercase">
                              Seed
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-medium text-slate-500">#{p.id.substring(0, 8)}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{p.paymentMethod}</span>
                          <span>•</span>
                          <span>{p.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-base font-mono font-extrabold flex items-center gap-0.5 ${
                        isSuccess ? 'text-emerald-400' :
                        isPending ? 'text-amber-500' :
                        'text-red-500 line-through'
                      }`}>
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        {p.amount}
                      </span>
                      <span className={`text-[10px] tracking-wider uppercase font-mono font-bold mt-1 inline-block ${
                        isSuccess ? 'text-emerald-500' :
                        isPending ? 'text-amber-400 animate-pulse' :
                        'text-red-500'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Simulator Modal Box */}
      {isSimulateOpen && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Simulate Real-time Payment
              </h3>
              <p className="text-xs text-slate-400 mt-1">Inject an automated transaction wire to trace telemetry auditing paths.</p>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={simulationData.customerName}
                  onChange={e => setSimulationData(p => ({ ...p, customerName: e.target.value }))}
                  placeholder="e.g. Peter McKinnon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Settled Amount ($)</label>
                  <input
                    type="text"
                    required
                    value={simulationData.amount}
                    onChange={e => setSimulationData(p => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. $49 or $499"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Simulated Status</label>
                  <select
                    value={simulationData.status}
                    onChange={e => setSimulationData(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Authorized">Authorized (Paid)</option>
                    <option value="Pending">Pending (Escrow)</option>
                    <option value="Failed">Failed (Declined)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Payment Method (Channel)</label>
                <select
                  value={simulationData.paymentMethod}
                  onChange={e => setSimulationData(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                >
                  <option value="EasyPaisa Mobile Wallet">EasyPaisa (Mobile Balance)</option>
                  <option value="Visa Credit Card ending in 4242">Visa Credit Card</option>
                  <option value="Mastercard ending in 1024">Mastercard Credit Card</option>
                  <option value="Payoneer Business wire">Payoneer Business (ACH)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Timestamp</label>
                <input
                  type="text"
                  required
                  value={simulationData.timestamp}
                  onChange={e => setSimulationData(p => ({ ...p, timestamp: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Abstain
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Commit Ledger Wire
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
