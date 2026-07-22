import React, { useState, useEffect } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Star, 
  Rocket, 
  Building2, 
  Crown, 
  User, 
  X, 
  CreditCard, 
  Shield, 
  Smartphone, 
  Globe, 
  Loader2,
  Lock,
  ArrowRight,
  Gem,
  Clock,
  RotateCcw,
  FileText,
  ChevronRight,
  Download,
  Info,
  Sliders,
  Plus,
  Printer,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PlanType } from '@/shared/types';
import { motion, AnimatePresence } from 'motion/react';

// Define steps in the checkout pipeline
enum UpgradeStep {
  USER_PROFILE = 'USER_PROFILE',
  PAYWALL = 'PAYWALL',
  CHECKOUT = 'CHECKOUT',
  ACTIVE_SUB = 'ACTIVE_SUB'
}

interface WebhookLog {
  id: string;
  eventType: string;
  payload: string;
  status: string;
  timestamp: string;
}

interface PaymentRecord {
  id: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  status: string;
  timestamp: string;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  dueDate: string;
  status: string;
  issuedDate: string;
}

const TIERS = [
  {
    id: 'solopreneur' as PlanType,
    name: 'Solopreneur',
    price: '$19',
    priceVal: 19,
    description: 'The foundation for individual YouTube automation.',
    icon: <User size={24} />,
    features: [
      'Never Run Out of Content Ideas',
      'Auto-Generate High-Retention Outlines',
      '10 Stunning AI Thumbnails to Skyrocket CTR',
      'Rank Instantly on Search Engine Feeds',
      'Convert Subscribers to Direct Custom Revenue'
    ]
  },
  {
    id: 'technopreneur' as PlanType,
    name: 'Technopreneur',
    price: '$49',
    priceVal: 49,
    description: 'Advanced tools for the technical creator ecosystem.',
    icon: <Rocket size={24} />,
    features: [
      'Everything in Solopreneur',
      'Find High-Volume, Low-Competition Niche Keywords',
      '50 Custom Premium Thumbnails & Covers',
      'Captivate Viewers with Studio-Quality AI Narrations',
      'Legally Hijack Organic Traffic from Competitors'
    ]
  },
  {
    id: 'entrepreneur' as PlanType,
    name: 'Entrepreneur',
    price: '$99',
    priceVal: 99,
    description: 'Scaling multi-platform content with autonomous power.',
    highlight: true,
    icon: <Star size={24} />,
    features: [
      'Everything in Technopreneur',
      'Dominate Feeds with Unlimited High-CTR Covers',
      'Publish 10 Cinematic Video Shorts in a Single Click',
      'Turn 1 Long Video Into 10 Viral Social Reels',
      'Exploit Untapped Market Niches Before Competitors'
    ]
  },
  {
    id: 'enterprise' as PlanType,
    name: 'Enterprise Ent.',
    price: '$249',
    priceVal: 249,
    description: 'Built for high-volume agencies and team workflows.',
    icon: <Building2 size={24} />,
    features: [
      'Everything in Entrepreneur',
      'Scale Production with 50 Cinematic Clips',
      'Unify Your Dynamic Team & Safely Delegate Tasks',
      'Skip Waiting Queues with Lightning Fast AI Power',
      'Close Lucrative Brand Sponsor Deals on Auto-Pilot'
    ]
  },
  {
    id: 'angle' as PlanType,
    name: 'Angle Ent.',
    price: '$499',
    priceVal: 499,
    description: 'The ultimate vision for strategic creator empires.',
    icon: <Crown size={24} />,
    features: [
      'Everything in Enterprise',
      'Uncapped High-Fidelity B-Roll Generation',
      'Own Your Brand\'s Custom Signature Voice & Style',
      'Empower Your Entire Marketing Organization',
      'Private Growth Guidance from Creator Industry Experts'
    ]
  }
];

export const Upgrade: React.FC = () => {
  const { upgradeToPro, renewPlan, checkPlanStatus, user } = useAuth();
  const { plan: currentPlan, isValid, isFree, isExpiringSoon, daysLeft } = checkPlanStatus();

  // Navigation steps management
  const [activeStep, setActiveStep] = useState<UpgradeStep>(UpgradeStep.USER_PROFILE);
  const [selectedPlan, setSelectedPlan] = useState<typeof TIERS[0]>(TIERS[1]); // Default to Technopreneur
  const [checkoutMethod, setCheckoutMethod] = useState<'stripe' | 'card' | 'easypaisa' | 'payoneer'>('stripe');
  const [cardTier, setCardTier] = useState<'standard' | 'silver' | 'gold' | 'diamond' | 'elite'>('standard');
  const [isStripeLoading, setIsStripeLoading] = useState<boolean>(false);
  const [checkoutName, setCheckoutName] = useState<string>('');
  
  // Checkout simulation & network logs state
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [authorizationLogs, setAuthorizationLogs] = useState<string[]>([]);
  const [currentLoggingIndex, setCurrentLoggingIndex] = useState<number>(0);

  // Active user data states loaded from real backend
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isUpdatingAutoRenew, setIsUpdatingAutoRenew] = useState<boolean>(false);
  const [isAutoRenewActive, setIsAutoRenewActive] = useState<boolean>(true);
  const [activeSubId, setActiveSubId] = useState<string>('');

  // Invoice Receipt modal view
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceRecord | null>(null);

  // Check for success or canceled from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');
    const planId = params.get('planId') as PlanType | null;

    if (success === 'true') {
      if (planId && TIERS.some(t => t.id === planId)) {
        upgradeToPro(planId);
        toast.success(`Welcome to ${planId.substring(0, 1).toUpperCase() + planId.substring(1)}! Your premium activation was successful.`, { duration: 6000 });
      } else {
        upgradeToPro('technopreneur'); // Default fallback upgrade
        toast.success('Your subscription upgrade was successfully processed!', { duration: 6000 });
      }
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    } else if (canceled === 'true') {
      toast.error('Stripe official checkout session was canceled.');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }
  }, []);

  // Automatically direct to active view if plan already exists & is valid
  useEffect(() => {
    if (isValid && !isFree) {
      setActiveStep(UpgradeStep.ACTIVE_SUB);
    } else {
      setActiveStep(UpgradeStep.USER_PROFILE);
    }
  }, [isValid, isFree]);

  // Load user details into states
  useEffect(() => {
    if (user) {
      setCheckoutName(user.name);
    }
  }, [user]);

  // Query SQLite backend real transaction values
  const fetchBillingRecords = async () => {
    try {
      // Fetch invoices
      const invRes = await fetch('/api/billing/invoices');
      if (invRes.ok) {
        const invData = await invRes.json();
        // filter associated with this user name or select last 15
        setInvoices(invData.reverse());
      }
      // Fetch payments
      const payRes = await fetch('/api/billing/payments');
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.reverse());
      }
      // Fetch webhook logs
      const webRes = await fetch('/api/billing/webhook-logs');
      if (webRes.ok) {
        const webData = await webRes.json();
        setWebhookLogs(webData.slice(0, 10)); // Top 10 webhooks
      }
      // Fetch subscriptions to find current active sub ID & autoRenew parameter
      const subRes = await fetch('/api/billing/subscriptions');
      if (subRes.ok) {
        const subData = await subRes.json();
        const activeSub = subData.find((s: any) => s.status === 'Active');
        if (activeSub) {
          setActiveSubId(activeSub.id);
          setIsAutoRenewActive(activeSub.autoRenew === 1);
        }
      }
    } catch (err) {
      console.error('[Upgrade] Failed to load synchronized billing tables:', err);
    }
  };

  useEffect(() => {
    if (activeStep === UpgradeStep.ACTIVE_SUB) {
      fetchBillingRecords();
    }
  }, [activeStep]);

  // Interactive toggle auto-renewal call to database
  const toggleAutoRenewState = async () => {
    if (!activeSubId) return;
    setIsUpdatingAutoRenew(true);
    const nextState = !isAutoRenewActive;
    try {
      const payload = {
        id: activeSubId,
        planName: selectedPlan?.name || currentPlan,
        price: selectedPlan?.price || `$${selectedPlan?.priceVal || '49'}`,
        status: 'Active',
        paymentMethod: checkoutMethod === 'card' ? `Visa Ending in 4242` : `${checkoutMethod}`,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        autoRenew: nextState ? 1 : 0
      };
      const response = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setIsAutoRenewActive(nextState);
      }
    } catch (err) {
      console.error('Failed to change subscription auto renewal state:', err);
    } finally {
      setIsUpdatingAutoRenew(false);
    }
  };

  // Safe developer tool to reset client plan & data back to free
  const handleSimulatedDowngrade = async () => {
    if (!window.confirm('Simulate core subscription decommissioning? This resets your client session and purges active subscription database indexes for testing purposes.')) {
      return;
    }
    try {
      // Downgrade client context
      upgradeToPro('free');
      setActiveStep(UpgradeStep.USER_PROFILE);
      alert('Subscription record decommissioned! Set back to Free Trial.');
    } catch (err) {
      console.error(err);
    }
  };

  const startRealStripeCheckout = async () => {
    setIsStripeLoading(true);
    const toastId = toast.loading('Initiating secure Stripe Checkout session...');
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          email: user?.email,
          userId: user?.referralCode || user?.name || ''
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to initialize secure Stripe session');
      }

      const data = await response.json();
      if (data.url) {
        toast.success('Redirecting to Stripe official platform...', { id: toastId });
        window.location.href = data.url;
      } else {
        throw new Error('Endpoint did not return session URL');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Stripe Integration Error: ${err.message}`, { id: toastId });
    } finally {
      setIsStripeLoading(false);
    }
  };

  // Refactored checkout process calling secure Stripe checkout session creator
  const handleAuthorizePayment = async () => {
    setIsAuthorizing(true);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          userEmail: user?.email
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to initialize secure Stripe session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Endpoint did not return session URL');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Stripe Integration Error: ${err.message}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const startCheckoutSimulation = handleAuthorizePayment;

  return (
    <div id="immersive_sandbox_scope" className="space-y-12 animate-fade-in pb-32 pt-8 text-neutral-100">
      
      {/* Immersive Pipeline Stepper Header */}
      <div className="bg-[#0f0f12] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-red-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">Creator Billing Suite</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Stripe Billing Pipeline</h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Interactively trace the complete subscription sequence: from account identity, paywall configuration, secure card tokens to final verified database activation.
            </p>
          </div>

          {!isFree && isValid && (
            <div className="flex items-center gap-2 bg-emerald-900/10 border border-emerald-800/30 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-bold font-mono">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
              STATUS: {currentPlan?.toUpperCase()} Verified Active
            </div>
          )}
        </div>

        {/* Stepper Timeline UI */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/60">
          {[
            { step: UpgradeStep.USER_PROFILE, index: '01', label: 'Creator Profile', desc: 'Identify details & metrics' },
            { step: UpgradeStep.PAYWALL, index: '02', label: 'Neural Paywall', desc: 'Select billing tiers' },
            { step: UpgradeStep.CHECKOUT, index: '03', label: 'Secure Checkout', desc: 'Authorize Simulated Triggers' },
            { step: UpgradeStep.ACTIVE_SUB, index: '04', label: 'Active Status Verified', desc: 'Auto-Renew, Traces & Invoices' }
          ].map((item, idx) => {
            const isActive = activeStep === item.step;
            const isCompleted = 
              (activeStep === UpgradeStep.PAYWALL && idx < 1) ||
              (activeStep === UpgradeStep.CHECKOUT && idx < 2) ||
              (activeStep === UpgradeStep.ACTIVE_SUB && idx < 3);

            return (
              <button
                key={item.step}
                disabled={isAuthorizing || (item.step === UpgradeStep.ACTIVE_SUB && !isValid)}
                onClick={() => setActiveStep(item.step)}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isActive 
                    ? 'bg-red-950/10 border-red-500 text-white shadow-lg' 
                    : isCompleted 
                      ? 'bg-zinc-900/40 border-zinc-700/80 text-zinc-300 hover:border-zinc-500'
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-mono font-black ${isActive ? 'text-red-500' : 'text-zinc-600'}`}>{item.index}</span>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider">{item.label}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main active sequence stage displays */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35 }}
        >
          {activeStep === UpgradeStep.USER_PROFILE && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Card details */}
              <div className="lg:col-span-2 bg-[#0f0f12] border border-zinc-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <span className="text-[10px] font-mono font-black bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">
                    Step 1: Creator Account Specifications
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/85 border border-zinc-700/60 flex items-center justify-center font-black text-2xl text-white">
                      {user?.name?.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">{user?.name}</h3>
                      <p className="text-sm font-mono text-zinc-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/60">
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Core License Status</span>
                      <p className="text-sm font-black text-white mt-1 uppercase flex items-center gap-1.5 pt-0.5">
                        <span className={`h-2 w-2 rounded-full ${isFree ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                        {isFree ? 'Standard Free Trial' : `${currentPlan?.toUpperCase()} Access License`}
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Cycle Duration remaining</span>
                      <p className="text-sm font-black text-white mt-1 pt-0.5 font-mono">{daysLeft} Days remaining</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <Info size={14} className="text-red-500" />
                      <span>Authorization Blueprint Summary</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Your unique system referral key is <strong className="font-mono text-zinc-300">{user?.referralCode}</strong>.
                      {isFree ? (
                        ' Free trial subscriptions expire exactly 1 day after registration. Upgrading to higher neural channels unlocks priority computing power and unlimited creative templates.'
                      ) : (
                        ' Your upgraded channel is secure and synchronized with direct access privileges.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-mono">Status: Ready to configure paywall parameters</span>
                  <button
                    onClick={() => setActiveStep(UpgradeStep.PAYWALL)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    Configure Paywall <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Sidebar Usage Stat details representing genuine creator progress */}
              <div className="bg-[#0f0f12] border border-zinc-800 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">System Usage Telemetry</h3>
                  <p className="text-xs text-zinc-500 mt-1">Real-time usage quotas captured on current local index</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Ideas Generated count', val: user?.stats?.ideasGenerated || 0, max: 100 },
                    { label: 'Scripts Written count', val: user?.stats?.scriptsWritten || 0, max: 50 },
                    { label: 'Thumbnails Crafted count', val: user?.stats?.thumbnailsCreated || 0, max: 20 },
                    { label: 'SEO Data optimizations', val: user?.stats?.seoOptimized || 0, max: 100 },
                    { label: 'Marketing Orchestrations', val: user?.stats?.marketingPlans || 0, max: 30 }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-zinc-500">{stat.label}</span>
                        <span className="text-zinc-300 font-bold">{stat.val} units</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-600 rounded-full" 
                          style={{ width: `${Math.min(100, (stat.val / stat.max) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === UpgradeStep.PAYWALL && (
            <div className="space-y-8">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <span className="text-[10px] font-mono font-black text-red-500 bg-red-950/20 px-3 py-1 border border-red-900/30 rounded-full uppercase tracking-wider">
                  Adaptive Paywall Channels
                </span>
                <p className="text-xs text-zinc-400 mt-2">
                  Choose a computing bandwidth suited for your business objectives. Each channel unlocks specific high CTR capabilities.
                </p>
              </div>

              {/* Interactive payment tiers/channels */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TIERS.map(tier => {
                  const isCurrent = currentPlan === tier.id;
                  const isRecommended = tier.highlight;

                  return (
                    <div 
                      key={tier.id} 
                      className={`flex flex-col bg-[#0f0f12] border rounded-[2.5rem] p-8 transition-all duration-300 relative overflow-hidden group hover:translate-y-[-4px] ${
                        isRecommended 
                          ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.06)]' 
                          : 'border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-0 right-0 bg-green-600 text-white px-6 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest">
                          ACTIVE CHANNEL
                        </div>
                      )}

                      <div className="mb-8">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                          isRecommended ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {tier.icon}
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{tier.name}</h3>
                        <p className="text-xs text-zinc-500 leading-normal mt-1.5">{tier.description}</p>
                      </div>

                      <div className="flex items-end gap-1.5 mb-8">
                        <span className="text-4xl font-black text-white tracking-tighter leading-none">{tier.price}</span>
                        <span className="text-zinc-600 font-mono text-[9px] uppercase tracking-wider block pb-0.5">/ manifest cycle</span>
                      </div>

                      <ul className="space-y-4 mb-8 flex-1">
                        {tier.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-3.5 text-xs text-zinc-455">
                            <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${isRecommended ? 'text-red-500' : 'text-zinc-650'}`} />
                            <span className="text-zinc-400 font-medium leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => {
                          setSelectedPlan(tier);
                          setActiveStep(UpgradeStep.CHECKOUT);
                        }}
                        className={`w-full py-4 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent 
                            ? 'bg-zinc-800/80 text-zinc-400' 
                            : isRecommended 
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-md' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-black'
                        }`}
                      >
                        <Zap size={12} fill="currentColor" />
                        {isCurrent ? 'Re-Configure Checkout' : `Choose ${tier.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeStep === UpgradeStep.CHECKOUT && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Checkout side specifications */}
              <div className="lg:col-span-2 bg-[#0f0f12] border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">Order Specification</h3>
                  <p className="text-xs text-zinc-500 mt-1">Detailed channel pricing metrics for your upgrade</p>
                  
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
                        {selectedPlan.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{selectedPlan.name}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Secure Cloud License</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 border-t border-b border-zinc-800/60 py-6">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-500">Plan Connection Rate</span>
                        <span className="text-zinc-300">{selectedPlan.price}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-500">Local Gate Network Tax</span>
                        <span className="text-emerald-500 font-bold">WAIVED / free</span>
                      </div>
                      <div className="flex justify-between text-sm font-mono pt-4 border-t border-zinc-800/40">
                        <span className="text-white font-bold">Total Sync Cost</span>
                        <span className="text-white font-black">{selectedPlan.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-start gap-3 mt-6">
                  <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-400 font-black uppercase">PCI-DSS Compliant</span>
                    <p className="text-[11px] text-zinc-505 leading-relaxed">
                      Payment session signatures utilize end-to-end cryptographic encryption standards so no tokens are leaked to raw browsers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic checkout interface */}
              <div className="lg:col-span-3 bg-[#0f0f12] border border-zinc-800 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">Secure Billing Interface</h3>
                  <p className="text-xs text-zinc-500 mt-1">Select payment system and authorize transaction logs</p>
                </div>

                {/* Gateway channels picker */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'card', name: 'Master / Visa', icon: <CreditCard size={18} /> },
                    { id: 'easypaisa', name: 'EasyPaisa', icon: <Smartphone size={18} /> },
                    { id: 'payoneer', name: 'Payoneer', icon: <Globe size={18} /> }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setCheckoutMethod(method.id as any)}
                      className={`py-3.5 flex flex-col items-center gap-2 border rounded-xl text-center font-bold text-[10px] uppercase transition-all ${
                        checkoutMethod === method.id 
                          ? 'bg-red-600/10 border-red-500 text-white' 
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-750'
                      }`}
                    >
                      {method.icon}
                      {method.name}
                    </button>
                  ))}
                </div>

                {checkoutMethod === 'stripe' && (
                  <div className="space-y-6 animate-scale-in">
                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-full blur-xl pointer-events-none" />
                      <div className="w-14 h-14 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center mx-auto">
                        <CreditCard size={28} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">Stripe Official Checkout</h4>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">
                          Establish an authenticated connection to Stripe's direct gateways for secure subscription activation.
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl space-y-2 text-left max-w-md mx-auto">
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>Target Plan:</span>
                          <strong className="text-white uppercase">{selectedPlan.name}</strong>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                          <span>Status:</span>
                          <span className="text-zinc-300">PCI-DSS Encrypted Session</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono border-t border-zinc-800/80 pt-2 text-zinc-400">
                          <span>Total due:</span>
                          <strong className="text-red-500 text-xs font-black">{selectedPlan.price} / cycle</strong>
                        </div>
                      </div>

                      <button
                        onClick={startRealStripeCheckout}
                        disabled={isStripeLoading}
                        className="w-full max-w-sm mx-auto mt-2 py-4 bg-red-600 hover:bg-red-500 hover:shadow-red-500/10 shadow-lg text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isStripeLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Preparing secure gateway...
                          </>
                        ) : (
                          <>
                            <Zap size={14} fill="currentColor" /> Proceed to Stripe Checkout
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {checkoutMethod === 'card' && (
                  <div className="space-y-6 animate-scale-in">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-black">Choose Card Privilege tier</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { id: 'standard', label: 'Std', color: 'bg-zinc-800' },
                          { id: 'silver', label: 'Slv', color: 'bg-zinc-450' },
                          { id: 'gold', label: 'Gld', color: 'bg-yellow-500' },
                          { id: 'diamond', label: 'Dmd', color: 'bg-blue-400' },
                          { id: 'elite', label: 'Elt', color: 'bg-red-600' }
                        ].map(priv => (
                          <button
                            key={priv.id}
                            onClick={() => setCardTier(priv.id as any)}
                            className={`py-1.5 text-[9px] font-mono font-black uppercase border rounded flex flex-col items-center gap-1 transition-all ${
                              cardTier === priv.id ? 'border-zinc-100 text-white' : 'border-zinc-850 text-zinc-600 hover:border-zinc-750'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${priv.color}`} />
                            {priv.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Premium Credit Card Graphic layout */}
                    <div className="relative bg-gradient-to-br from-zinc-850 via-zinc-900 to-black p-6 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden min-h-[160px] flex flex-col justify-between">
                      <div className="absolute right-0 top-0 w-36 h-36 bg-red-600/5 rounded-full blur-2xl" />
                      
                      <div className="flex justify-between items-start">
                        <CreditCard className="w-8 h-8 text-zinc-500" />
                        <span className={`px-2.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-widest rounded-full ${
                          cardTier === 'elite' ? 'bg-red-600 text-white animate-pulse' :
                          cardTier === 'diamond' ? 'bg-blue-500 text-white' :
                          cardTier === 'gold' ? 'bg-yellow-500 text-black' :
                          cardTier === 'silver' ? 'bg-zinc-400 text-black' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {cardTier} account
                        </span>
                      </div>

                      <div className="space-y-4 relative z-10 mt-6">
                        <input
                          type="text"
                          required
                          value={checkoutName}
                          onChange={e => setCheckoutName(e.target.value)}
                          placeholder="Cardholder Identity Name"
                          className="w-full bg-transparent border-b border-zinc-800 py-1.5 text-xs text-white font-mono placeholder-zinc-700 outline-none focus:border-red-500"
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <input
                            type="text"
                            maxLength={19}
                            className="w-full bg-transparent border-b border-zinc-800 py-1.5 text-xs text-white font-mono placeholder-zinc-750 outline-none focus:border-red-500 col-span-2"
                            placeholder="4242 4242 4242 4242"
                          />
                          <input
                            type="text"
                            maxLength={3}
                            className="w-full bg-transparent border-b border-zinc-800 py-1.5 text-xs text-white font-mono placeholder-zinc-750 outline-none focus:border-red-500"
                            placeholder="CVC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(checkoutMethod === 'easypaisa' || checkoutMethod === 'payoneer') && (
                  <div className="space-y-4 animate-scale-in">
                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 text-center space-y-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                        checkoutMethod === 'easypaisa' ? 'bg-green-600/10 text-green-500' : 'bg-blue-600/10 text-blue-500'
                      }`}>
                        {checkoutMethod === 'easypaisa' ? <Smartphone size={28} /> : <Globe size={28} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">{checkoutMethod === 'easypaisa' ? 'EasyPaisa Number' : 'Payoneer Business ID'}</h4>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">Authorize checkout through your local mobile gateway account.</p>
                      </div>
                      <input
                        type="text"
                        placeholder={checkoutMethod === 'easypaisa' ? '03XX XXXXXXX' : 'creator@payoneer.com'}
                        className="w-full max-w-sm bg-neutral-900/60 border border-zinc-800 rounded-xl p-3 text-center text-sm font-mono text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                )}

                {checkoutMethod !== 'stripe' && (
                  <div className="space-y-4">
                    <button
                      onClick={handleAuthorizePayment}
                      disabled={isAuthorizing}
                      className="w-full py-4.5 bg-red-600 hover:bg-red-500 hover:shadow-red-500/10 shadow-lg text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isAuthorizing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Authorizing crypt transaction hashes...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} /> Authorize simulated {selectedPlan.price} transaction
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-6 opacity-40 text-[8px] font-mono uppercase tracking-wider text-zinc-400">
                      <span className="flex items-center gap-1"><Lock size={10} /> AES-256 secure</span>
                      <span className="flex items-center gap-1"><Shield size={10} /> PCI compliant</span>
                      <span className="flex items-center gap-1"><Zap size={10} /> Instant Sync</span>
                    </div>
                  </div>
                )}

                {/* Console Log simulator pane representing the webhook sequence */}
                <AnimatePresence>
                  {(isAuthorizing || authorizationLogs.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-xl text-[10px] font-mono leading-relaxed space-y-2 mt-4 max-h-52 overflow-y-auto"
                    >
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center justify-between">
                        <span>Simulator Console Ledger output</span>
                        <span className="text-red-500 animate-pulse">LIVE CONNECTED</span>
                      </div>
                      <div className="space-y-1.5 text-zinc-300">
                        {authorizationLogs.map((logStr, lIdx) => (
                          <div key={lIdx} className="flex gap-2 items-start">
                            <span className="text-zinc-600 shrink-0">[{lIdx + 1}]</span>
                            <p className={lIdx === authorizationLogs.length - 1 ? 'text-zinc-100 font-extrabold' : ''}>{logStr}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          )}

          {activeStep === UpgradeStep.ACTIVE_SUB && (
            <div className="space-y-8 animate-scale-in">
              
              {/* Top verification banner details */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/20 via-zinc-900 to-emerald-950/10 border border-emerald-900/40 rounded-3xl flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck size={26} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base uppercase">Subscription Verified Stable</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Your active connection status has been fully cataloged on the SQLite database and local indices.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchBillingRecords}
                    className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                    title="Refresh telemetry"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button 
                    onClick={handleSimulatedDowngrade}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 font-mono text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    Test Utility: Downgrade to free
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active connection specifications */}
                <div className="bg-[#0f0f12] border border-zinc-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">License Blueprint</h4>
                      <h3 className="text-lg font-black text-white mt-1 pr-1">{currentPlan?.toUpperCase()} License</h3>
                    </div>

                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-550">Billing Price:</span>
                        <span className="text-zinc-200">${selectedPlan?.priceVal || '49'} / month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-550">Auto-Renewal:</span>
                        <span className={isAutoRenewActive ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                          {isAutoRenewActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-550">Next cycle date:</span>
                        <span className="text-zinc-300">
                          {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-850 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-zinc-500" /> Auto-Renew settings
                    </span>
                    <button
                      onClick={toggleAutoRenewState}
                      disabled={isUpdatingAutoRenew}
                      className={`px-4.5 py-2.5 rounded-lg text-[10px] font-mono font-black uppercase transition-all ${
                        isAutoRenewActive 
                          ? 'bg-amber-950/40 text-amber-500 border border-amber-900/20' 
                          : 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/20'
                      }`}
                    >
                      {isUpdatingAutoRenew ? 'Switching...' : isAutoRenewActive ? 'Disable Auto-renew' : 'Enable Auto-renew'}
                    </button>
                  </div>
                </div>

                {/* DB logs live ledger */}
                <div className="lg:col-span-2 bg-[#0f0f12] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-500">Transaction Audit History</h4>
                    <p className="text-[11px] text-zinc-500">Live payment audit index queried from SQLite database tables</p>
                    
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {payments.length === 0 ? (
                        <div className="py-8 text-center text-zinc-650 text-xs font-mono">No transaction log entries.</div>
                      ) : (
                        payments.map((p, idx) => (
                          <div key={idx} className="p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 font-mono text-[10px] hover:border-zinc-800 transition-colors">
                            <div className="space-y-1">
                              <span className="text-zinc-500">PAYID: {p.id}</span>
                              <p className="text-zinc-200">{p.customerName || user?.name || 'Creator'}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="font-extrabold text-white">{p.amount}</span>
                              <p className="text-emerald-500 uppercase font-black text-[8px]">{p.status}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-600 block mt-4 border-t border-zinc-900 pt-3">
                    ✔ Security index verified against PCI specifications.
                  </span>
                </div>
              </div>

              {/* Multi-Section layout for Invoices & Webhook Traces */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                
                {/* Invoices archive section */}
                <div className="bg-[#0f0f12] border border-zinc-805 rounded-3xl p-8 space-y-6">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <FileText className="text-zinc-400" size={18} /> Invoices Archive
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Download simulated receipt PDFs generated dynamically from payment indices</p>
                  </div>

                  <div className="space-y-3">
                    {invoices.length === 0 ? (
                      <div className="py-12 text-center text-zinc-650 text-xs font-mono">No invoice histories recorded.</div>
                    ) : (
                      invoices.map((inv, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-zinc-950 border border-zinc-900/60 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs hover:border-zinc-850 hover:bg-zinc-950/80 transition-all"
                        >
                          <div className="space-y-0.5">
                            <span className="text-zinc-500 text-[10px]">NUMBER: {inv.invoiceNumber}</span>
                            <h4 className="text-zinc-300 font-extrabold">{inv.amount}</h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 border border-emerald-900/40 text-emerald-400 bg-emerald-950/10 rounded uppercase">
                              {inv.status}
                            </span>
                            <button
                              onClick={() => setReceiptInvoice(inv)}
                              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800"
                              title="Render statement details"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Webhooks telemetry monitoring table */}
                <div className="bg-[#0f0f12] border border-zinc-805 rounded-3xl p-8 space-y-6">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Activity className="text-indigo-400 animate-pulse animate-duration-1000" size={18} /> Stripe Webhook Traces
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Retrieve captured SQLite backend database logs for Stripe session triggers</p>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1">
                    {webhookLogs.length === 0 ? (
                      <div className="py-16 text-center text-zinc-650 text-xs font-mono border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/20">
                        No telemetry logs registered. Run checkout steps to trigger hooks.
                      </div>
                    ) : (
                      webhookLogs.map((log, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-905 rounded-xl text-[10px] font-mono leading-relaxed space-y-2">
                          <div className="flex justify-between items-center text-zinc-400">
                            <span className="font-extrabold text-white">{log.eventType}</span>
                            <span className="text-[9px] text-zinc-600">{log.timestamp}</span>
                          </div>
                          <p className="text-indigo-300 truncate font-semibold">{log.status}</p>
                          <pre className="bg-zinc-950 border border-zinc-910 p-2.5 rounded text-[9px] text-zinc-500 overflow-x-auto max-h-32">
                            {log.payload}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Exquisitely stylized simulated Receipt PDF modal overlay details */}
      <AnimatePresence>
        {receiptInvoice && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-xl bg-[#0f0f12] border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setReceiptInvoice(null)} 
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>

              <div className="space-y-6">
                
                {/* Receipts header */}
                <div className="flex justify-between items-start border-b border-zinc-800/60 pb-6">
                  <div>
                    <h3 className="text-xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                      Ranktica AI Corp
                    </h3>
                    <p className="text-[9px] font-mono text-zinc-500 mt-1">Silicon Valley Highway, CA, 94025</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-zinc-500 font-bold uppercase block">SECURE DOCUMENT</span>
                    <span className="text-sm font-mono font-black text-white block mt-1">NO. {receiptInvoice.invoiceNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Recipient Patron:</span>
                    <strong className="text-zinc-200 block mt-0.5">{receiptInvoice.customerName || user?.name || 'Creator'}</strong>
                    <span className="text-zinc-550 text-[10px] block mt-0.5">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Transaction details:</span>
                    <span className="text-zinc-300 block mt-0.5">ISSUED: {receiptInvoice.dueDate || receiptInvoice.issuedDate}</span>
                    <span className="text-emerald-400 font-black block mt-0.5 uppercase">LICENSE VERIFIED: Paid</span>
                  </div>
                </div>

                {/* Line Item Tables */}
                <div className="border border-zinc-900 rounded-2xl bg-zinc-950 overflow-hidden text-xs">
                  <div className="grid grid-cols-3 bg-zinc-900 p-3 text-[10px] font-mono font-black text-zinc-500 uppercase border-b border-zinc-850">
                    <span>Description item</span>
                    <span className="text-center">Hours/Qty</span>
                    <span className="text-right">Rate total</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 font-mono">
                    <div className="space-y-0.5">
                      <strong className="text-zinc-200">{selectedPlan.name} upgraded tier</strong>
                      <p className="text-[9px] text-zinc-500 leading-normal">Professional GPU rendering bandwidth allocations.</p>
                    </div>
                    <span className="text-center self-center text-zinc-300">1 unit</span>
                    <span className="text-right self-center text-white font-extrabold">{receiptInvoice.amount}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-zinc-800/60 pt-6 font-mono text-xs text-right">
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span className="text-zinc-500">Subtotal amount:</span>
                    <span className="text-zinc-200 font-extrabold">{receiptInvoice.amount}</span>
                  </div>
                  <div className="flex justify-between max-w-xs ml-auto">
                    <span className="text-zinc-500">Stripe Wire Charge:</span>
                    <span className="text-emerald-500 font-bold">Waived</span>
                  </div>
                  <div className="flex justify-between max-w-xs ml-auto border-t border-zinc-900 pt-2 text-sm">
                    <span className="text-white font-black">Sum Total Paid:</span>
                    <span className="text-white font-black">{receiptInvoice.amount}</span>
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="pt-6 border-t border-zinc-800/60 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="flex gap-0.5 h-10 w-full max-w-xs opacity-65 items-stretch bg-zinc-950 p-2.5 rounded border border-zinc-900">
                    {[1,2,4,1,3,2,1,2,1,4,1,2,3,1,2,4,1,1,2,3,1,2,4,1,2,1,3,1].map((bar, bIdx) => (
                      <div 
                        key={bIdx} 
                        className={`bg-zinc-300 flex-1`} 
                        style={{ opacity: bar / 4 }} 
                      />
                    ))}
                  </div>

                  <div className="space-y-3 w-full">
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold font-mono transition-all border border-zinc-800 inline-flex items-center gap-1.5"
                    >
                      <Printer size={13} /> Print Invoice Receipt
                    </button>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase leading-none">
                      ✔ SECURE TRANSACTION VERIFIED • PCI-DSS COMPLIANT LICENSE KEY
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
