import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Check, 
  Settings, 
  Sparkles, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  HelpCircle, 
  Heart, 
  Trash2, 
  Edit2,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';

interface Subscription {
  id: string;
  planName: string;
  price: string;
  status: string;
  paymentMethod: string;
  nextBillingDate: string;
  autoRenew: number;
  is_seed_data?: number;
}

export const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludeSeed, setExcludeSeed] = useState(false);
  
  // Trial-to-paid conversion sandbox states
  const [exitIntent, setExitIntent] = useState(true);
  const [discountEmails, setDiscountEmails] = useState(true);
  const [interactiveWalkthrough, setInteractiveWalkthrough] = useState(false);
  const [trialCount, setTrialCount] = useState(1280);
  
  // Modal / Form state for adding/editing a subscription
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    planName: 'Technopreneur',
    price: '$49',
    status: 'Active',
    paymentMethod: 'Visa ending in 4242',
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    autoRenew: true
  });

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/billing/subscriptions?exclude_seed=${excludeSeed}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      } else {
        throw new Error('Failed to load subscriptions');
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
        await fetchSubscriptions();
      } else {
        throw new Error('Failed to delete seed billing entries.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [excludeSeed]);

  const handleToggleAutoRenew = async (sub: Subscription) => {
    const updated = {
      ...sub,
      autoRenew: sub.autoRenew === 1 ? 0 : 1
    };

    try {
      const res = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? updated : s));
      }
    } catch (err) {
      console.error('Failed to toggle auto renewal:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel and delete this subscription manifest?')) return;
    try {
      const res = await fetch(`/api/billing/subscriptions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingSub?.id || null,
      ...formData,
      autoRenew: formData.autoRenew ? 1 : 0
    };

    try {
      const res = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchSubscriptions();
        setIsFormOpen(false);
        setEditingSub(null);
        // Reset form
        setFormData({
          planName: 'Technopreneur',
          price: '$49',
          status: 'Active',
          paymentMethod: 'Visa ending in 4242',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          autoRenew: true
        });
      }
    } catch (err) {
      console.error('Failed to save subscription:', err);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      planName: sub.planName,
      price: sub.price,
      status: sub.status,
      paymentMethod: sub.paymentMethod,
      nextBillingDate: sub.nextBillingDate,
      autoRenew: sub.autoRenew === 1
    });
    setIsFormOpen(true);
  };

  // Stats calculations
  const totalMRR = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + parseFloat(s.price.replace(/[^0-9.]/g, '') || '0'), 0);
  
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const averagePlanValue = activeCount > 0 ? (totalMRR / activeCount).toFixed(2) : '0.00';

  // Dynamic Trial-to-Paid conversion metrics calculation
  const baseRate = 3.6;
  const conversionRate = parseFloat((baseRate + (exitIntent ? 0.9 : 0) + (discountEmails ? 1.3 : 0) + (interactiveWalkthrough ? 0.8 : 0)).toFixed(2));
  const convertedPaidCount = Math.round((trialCount * conversionRate) / 100);

  return (
    <div id="subscriptions_scope" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Subscriptions Directory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage premium tier memberships, trigger renewals, toggle automated cycles, & map creator plans.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSub(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Subscription
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
        <div className="py-12 text-center text-slate-400">Loading subscription records from core data lake...</div>
      ) : error ? (
        <div className="p-4 bg-red-900/40 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading subscriptions: {error}</span>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid with Trial-to-Paid Conversion Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-lg">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Total Creator MRR</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">${totalMRR.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 font-medium block mt-2">● Real-time active cache value</span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-lg">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Active Subscribers</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">{activeCount} manifest accounts</span>
              <span className="text-xs text-indigo-400 font-medium block mt-2">● Across enterprise tiers</span>
            </div>
            <div className="p-4 bg-[#0f0f12] border border-zinc-800 rounded-xl shadow-lg">
              <span className="text-xs text-zinc-400 font-mono tracking-wider uppercase block font-semibold text-zinc-300">Conversion Rate (Trial to Paid)</span>
              <span className={`text-2xl font-black block mt-1 font-mono ${conversionRate > 5.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {conversionRate}%
              </span>
              <span className={`text-xs font-semibold block mt-2 ${conversionRate > 5.0 ? 'text-emerald-400/90' : 'text-amber-450'}`}>
                {conversionRate > 5.0 ? '✓ Exceeds 5.0% Premium Goal' : '⚠ Below 5.0% Goal'}
              </span>
            </div>
            <div className="p-4 bg-[#0f0f12] border border-zinc-800 rounded-xl shadow-lg">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase block">Average Plan Value</span>
              <span className="text-2xl font-bold text-slate-100 block mt-1">${averagePlanValue}</span>
              <span className="text-xs text-slate-400 block mt-2">Balanced pricing average</span>
            </div>
          </div>

          {/* Interactive Trial-to-Paid Optimization Suite */}
          <div className="bg-[#0b0b0d] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-650/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/60 pb-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Growth Intelligence Suite</span>
                </div>
                <h3 className="text-base font-black text-white mt-0.5">Trial-to-Paid Growth Sandbox</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Simulate marketing and UX strategies to organically scale standard client conversions beyond the target 5% rate.
                </p>
              </div>

              <div>
                {conversionRate > 5.0 ? (
                  <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/40 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                    GROWTH BENCHMARK SMASHED
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-900/40 px-3.5 py-1.5 rounded-full text-amber-400 text-xs font-mono font-black">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    RATE BELOW 5% BENCHMARK
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              
              {/* Campaign Switches */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 block">Deploy Converted Campaigns</span>
                
                <div className="space-y-3">
                  <div className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between transition-all hover:bg-zinc-950">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">Exit-Intent Checkout Overlays</h4>
                      <p className="text-[10px] text-zinc-500">Detect checkout abandonments and offer rapid help (+0.90% conversion boost)</p>
                    </div>
                    <button
                      onClick={() => setExitIntent(prev => !prev)}
                      className="text-zinc-350 hover:text-indigo-450 transition-all shrink-0"
                    >
                      {exitIntent ? (
                        <ToggleRight className="w-7 h-7 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-zinc-700" />
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between transition-all hover:bg-zinc-950">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">Automated Day-3 Pro discount triggers</h4>
                      <p className="text-[10px] text-zinc-500">Identify highly engaged trial users and offer instant discounts (+1.30% conversion boost)</p>
                    </div>
                    <button
                      onClick={() => setDiscountEmails(prev => !prev)}
                      className="text-zinc-350 hover:text-indigo-450 transition-all shrink-0"
                    >
                      {discountEmails ? (
                        <ToggleRight className="w-7 h-7 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-zinc-700" />
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between transition-all hover:bg-zinc-950">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">Interactive walk-through of Developer Console</h4>
                      <p className="text-[10px] text-zinc-500">Enable guided onboarding for newly registered creators (+0.80% conversion boost)</p>
                    </div>
                    <button
                      onClick={() => setInteractiveWalkthrough(prev => !prev)}
                      className="text-zinc-350 hover:text-indigo-450 transition-all shrink-0"
                    >
                      {interactiveWalkthrough ? (
                        <ToggleRight className="w-7 h-7 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-zinc-700" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Graphical Funnel */}
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 block">Sandbox Pipeline Visualizer</span>
                  
                  <div className="space-y-4 mt-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-505">1. Total Trials Registered</span>
                        <span className="text-zinc-300 font-bold">{trialCount} accounts</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-505">2. Converted to Paid Subscription</span>
                        <span className="text-zinc-200 font-bold">{convertedPaidCount} accounts</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${conversionRate > 5.0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${(convertedPaidCount / trialCount) * 100 * 3}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">Live Yield Efficiency:</span>
                    <span className={`font-bold ${conversionRate > 5.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {conversionRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-650">Required Margin:</span>
                    <strong className="text-zinc-400 ml-1">5.0%</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Subscriptions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((sub, idx) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-5 bg-gradient-to-br from-slate-900 to-slate-950 border ${
                  sub.status === 'Active' ? 'border-slate-800' : 'border-slate-900 opacity-65'
                } rounded-xl shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {sub.planName}
                      </span>
                      {sub.is_seed_data === 1 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-amber-500/15 text-amber-400 border border-amber-500/10 uppercase">
                          Seed
                        </span>
                      )}
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      sub.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`} title={sub.status} />
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-white">{sub.price}</span>
                    <span className="text-xs text-slate-400 ml-1 font-mono">/ month</span>
                  </div>

                  <div className="space-y-2.5 mb-6 text-sm">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Payment instrument:</span>
                      <span className="font-mono text-xs">{sub.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Next billing cycle:</span>
                      <span className="font-mono text-xs">{sub.nextBillingDate}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 mt-auto">
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Automated Renewal
                    </span>
                    <button
                      onClick={() => handleToggleAutoRenew(sub)}
                      className="text-slate-300 hover:text-indigo-400 transition-colors"
                    >
                      {sub.autoRenew === 1 ? (
                        <ToggleRight className="w-7 h-7 text-indigo-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Info
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="py-1.5 px-2.5 bg-red-950/35 hover:bg-red-900/40 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-xs transition-colors"
                      title="Decommission Subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Subscription Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingSub ? 'Modify Subscription Profile' : 'Add Creative Tier Subscription'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Update database billing cycles and plan conditions.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={e => setFormData(p => ({ ...p, planName: e.target.value }))}
                  placeholder="e.g. Creator Plus, Technopreneur"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Monthly Cost</label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. $49 or $249"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Payment Instrument</label>
                <input
                  type="text"
                  required
                  value={formData.paymentMethod}
                  onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                  placeholder="e.g. Visa ending in 4242, EasyPaisa, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Billing Date</label>
                  <input
                    type="date"
                    required
                    value={formData.nextBillingDate}
                    onChange={e => setFormData(p => ({ ...p, nextBillingDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoRenew}
                      onChange={e => setFormData(p => ({ ...p, autoRenew: e.target.checked }))}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Automated Cycle</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingSub(null);
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
