import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, Filter, Plus, Calendar, Mail, Tag, DollarSign, Edit, Trash2, Shield, Eye, AlertCircle, Sparkles } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  totalSpent: number;
  lastActive: string;
  planType: string;
  is_seed_data?: number;
}

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludeSeed, setExcludeSeed] = useState(false);
  
  // Filtering & searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subscriptionStatus: 'Active',
    totalSpent: '0.00',
    lastActive: new Date().toISOString().split('T')[0],
    planType: 'Technopreneur'
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/billing/customers?exclude_seed=${excludeSeed}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        throw new Error('Failed to fetch customers database');
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
        await fetchCustomers();
      } else {
        throw new Error('Failed to delete seed customer records.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [excludeSeed]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingCustomer?.id || null,
      ...formData,
      totalSpent: parseFloat(formData.totalSpent)
    };

    try {
      const res = await fetch('/api/billing/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchCustomers();
        setIsFormOpen(false);
        setEditingCustomer(null);
        setFormData({
          name: '',
          email: '',
          subscriptionStatus: 'Active',
          totalSpent: '0.00',
          lastActive: new Date().toISOString().split('T')[0],
          planType: 'Technopreneur'
        });
      }
    } catch (err) {
      console.error('Failed to save customer profiles:', err);
    }
  };

  const handleEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      email: cust.email,
      subscriptionStatus: cust.subscriptionStatus,
      totalSpent: cust.totalSpent.toString(),
      lastActive: cust.lastActive,
      planType: cust.planType
    });
    setIsFormOpen(true);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.planType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high quality stats
  const totalSubscribers = customers.filter(c => c.subscriptionStatus === 'Active').length;
  const averageLtv = customers.length > 0 
    ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)
    : '0.00';
  const totalLTVValue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div id="customers_scope" className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            CRM & Subscriber Directory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyze customer lifetime spends, subscription health, active status, and individual creator contracts.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Record
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
        <div className="py-12 text-center text-slate-400 font-mono">Querying subscriber tables...</div>
      ) : error ? (
        <div className="p-4 bg-red-905 border border-red-900/60 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading customer directories: {error}</span>
        </div>
      ) : (
        <>
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Subscribers Database</span>
              <span className="text-2xl font-bold text-white block mt-1">{totalSubscribers} active creators</span>
              <span className="text-xs text-slate-500 block mt-1">Total base: {customers.length} listings</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Total Lifetime Value (LTV)</span>
              <span className="text-2xl font-semibold text-emerald-400 block mt-1">${totalLTVValue.toLocaleString()}</span>
              <span className="text-xs text-slate-500 block mt-1">Gross accounts processed</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Average Subscriber Spends</span>
              <span className="text-2xl font-bold text-white block mt-1">${averageLtv}</span>
              <span className="text-xs text-slate-500 block mt-1">Per unique customer instance</span>
            </div>
          </div>

          {/* Search, Filter Tools */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customers, emails, plans..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter status:
              </span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Customer Records Table */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 text-xs font-mono tracking-wider uppercase">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Billing Status</th>
                  <th className="py-3 px-4 text-right">Lifetime Spends</th>
                  <th className="py-3 px-4 text-right">Last Interaction</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-sm">
                      No matching cohort or active subscriber profiles.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="border-b border-slate-800/70 hover:bg-slate-900/35 transition-colors text-sm text-slate-300"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          {c.name}
                          {c.is_seed_data === 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-amber-500/15 text-amber-400 border border-amber-500/10 uppercase">
                              Seed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {c.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="py-0.5 px-2 bg-slate-800 text-slate-300 border border-slate-700/60 rounded">
                          {c.planType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.subscriptionStatus === 'Active' 
                            ? 'bg-emerald-900/35 text-emerald-300 border border-emerald-900/45' 
                            : 'bg-slate-800/40 text-slate-400 border border-slate-700/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.subscriptionStatus === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {c.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                        ${c.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                        {c.lastActive}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Modify Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Customer Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? 'Update CRM Customer Record' : 'Register Customer Instance'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Keep subscriber records, lifetime value trackers, and plan states aligned.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Marques Brownlee"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. mkbhd@waveform.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Associated Tier</label>
                  <input
                    type="text"
                    required
                    value={formData.planType}
                    onChange={e => setFormData(p => ({ ...p, planType: e.target.value }))}
                    placeholder="e.g. Technopreneur"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Billing Status</label>
                  <select
                    value={formData.subscriptionStatus}
                    onChange={e => setFormData(p => ({ ...p, subscriptionStatus: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Total Lifetime Spent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.totalSpent}
                    onChange={e => setFormData(p => ({ ...p, totalSpent: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Last Interaction Date</label>
                  <input
                    type="date"
                    required
                    value={formData.lastActive}
                    onChange={e => setFormData(p => ({ ...p, lastActive: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Save Sync
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
