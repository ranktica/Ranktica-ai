import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudLightning, 
  Send, 
  Trash2, 
  Play, 
  FileCode, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Clock, 
  Info, 
  Sliders, 
  Plus, 
  Eye,
  AlertCircle
} from 'lucide-react';

interface WebhookLog {
  id: string;
  eventType: string;
  payload: string;
  status: string;
  timestamp: string;
}

const PRESETS: Record<string, any> = {
  'checkout.session.completed': {
    id: "evt_chk_1N924x9P7Gj4fH6b",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_b1K7eY2u8oLz4pQ",
        customer: "cus_O98f2b7y6d4c1",
        customer_details: {
          email: "sarah.connor@cyberdyne.co",
          name: "Sarah Connor"
        },
        amount_total: 9900,
        currency: "usd",
        payment_status: "paid",
        metadata: {
          planName: "Technopreneur Pro Bundle",
          planType: "Technopreneur"
        }
      }
    }
  },
  'customer.subscription.created': {
    id: "evt_sub_created_88203f7Gj5",
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_1N8y6aP7Gj4fH6a",
        customer: "cus_O98f2b7y6d4c1",
        customer_details: {
          email: "sarah.connor@cyberdyne.co"
        },
        status: "active",
        plan: {
          id: "price_1N8x2bP7Gj4f",
          amount: 9900,
          currency: "usd",
          name: "Technopreneur Pro Bundle"
        }
      }
    }
  },
  'customer.subscription.updated': {
    id: "evt_sub_updated_77192a2b3c",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_1N8y6aP7Gj4fH6a",
        customer: "cus_O98f2b7y6d4c1",
        status: "active",
        cancel_at_period_end: true,
        plan: {
          id: "price_1N8x2bP7Gj4f",
          amount: 9900
        }
      }
    }
  },
  'customer.subscription.deleted': {
    id: "evt_sub_deleted_88203a9Gj5",
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: "sub_1N8y6aP7Gj4fH6a",
        customer: "cus_O98f2b7y6d4c1"
      }
    }
  },
  'invoice.payment_succeeded': {
    id: "evt_inv_succeeded_22998a4f",
    type: "invoice.payment_succeeded",
    data: {
      object: {
        id: "in_1N924xP7Gj4f",
        number: "INV-290841",
        customer_email: "sarah.connor@cyberdyne.co",
        customer_name: "Sarah Connor",
        amount_paid: 9900,
        status: "paid"
      }
    }
  },
  'invoice.payment_failed': {
    id: "evt_inv_failed_33887b5e",
    type: "invoice.payment_failed",
    data: {
      object: {
        id: "in_1N924xP7Gj4f",
        number: "INV-290841",
        customer_email: "sarah.connor@cyberdyne.co",
        customer_name: "Sarah Connor",
        amount_due: 9900,
        status: "open"
      }
    }
  }
};

const SCHEMAS_HELP: Record<string, string> = {
  'checkout.session.completed': 'Triggers checkout resolution: Creates/activates customer record, adds invoice state, saves payment, provisions subscription.',
  'customer.subscription.created': 'Fired when subscription goes pending/is created. Places subscription row state to Active.',
  'customer.subscription.updated': 'Updates active states, downgrades, upgrades, or marks cancel_at_period_end (autoRenew set to false if cancelled).',
  'customer.subscription.deleted': 'Instantly closes subscription: state becomes Cancelled, customer account Status marked Inactive.',
  'invoice.payment_succeeded': 'Processes success receipt: increases CRM customer totalSpent count, creates invoice Paid record and Authorized payment ledger.',
  'invoice.payment_failed': 'Audits unsuccessful charge: registers failed payment logging block, marks invoice status as outstanding Open.'
};

export const StripeWebhooksView: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<string>('checkout.session.completed');
  const [payloadText, setPayloadText] = useState<string>('');
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Load preset on change
  useEffect(() => {
    if (PRESETS[currentEvent]) {
      setPayloadText(JSON.stringify(PRESETS[currentEvent], null, 2));
    }
  }, [currentEvent]);

  // Fetch telemetry logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/billing/webhook-logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to query webhook telemetry logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Submit webhook POST trigger
  const triggerWebhook = async () => {
    setIsSimulating(true);
    setFeedback(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(payloadText);
      } catch (err) {
        throw new Error('Invalid JSON format in the message body');
      }

      const res = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      const responseData = await res.json();
      if (res.ok) {
        setFeedback({
          success: true,
          message: `Endpoint response: Completed successfully. Status: ${responseData.status}`
        });
        await fetchLogs();
      } else {
        setFeedback({
          success: false,
          message: `Endpoint returned error: ${responseData.error || 'Server error'}`
        });
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: (err as Error).message
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Clear log history
  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to purge all simulated webhook telemetry logs?')) return;
    try {
      const res = await fetch('/api/billing/webhook-logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        setSelectedLog(null);
      }
    } catch (err) {
      console.error('Clear logs error:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.eventType.toLowerCase().includes(term) ||
      log.status.toLowerCase().includes(term) ||
      log.payload.toLowerCase().includes(term)
    );
  });

  return (
    <div id="stripe_sandbox_scope" className="space-y-6">
      {/* Banner introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">Stripe API Developer Suite</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Stripe Webhook Sandbox & Telemetry</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Test and route real Stripe payload schemas with instantaneous synchronization to local CRM, payments ledger, user subscriptions, and invoicing engines.
          </p>
        </div>
      </div>

      {/* Two-Column split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor (Left column) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                Select Event Type
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">
                Sandbox Mode
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(PRESETS).map(presetKey => (
                <button
                  key={presetKey}
                  onClick={() => setCurrentEvent(presetKey)}
                  className={`text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex flex-col justify-between ${
                    currentEvent === presetKey
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-md'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <p className="font-bold truncate w-full">{presetKey}</p>
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs leading-relaxed text-slate-400 flex gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{SCHEMAS_HELP[currentEvent]}</span>
            </div>

            {/* Code editor surface */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Payload Raw Request Body (JSON)</span>
                <span className="text-[10px] text-slate-500">Edit values and simulate live event</span>
              </div>
              <textarea
                value={payloadText}
                onChange={e => setPayloadText(e.target.value)}
                className="w-full h-80 bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800/80 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/60 mt-4">
            <button
              onClick={triggerWebhook}
              disabled={isSimulating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.99] disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Simulating Wire Sync...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Trigger Simulated Webhook Post
                </>
              )}
            </button>

            {/* Flash Feedback */}
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`p-3.5 rounded-lg border text-xs flex gap-2.5 items-start ${
                    feedback.success 
                      ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-300' 
                      : 'bg-red-950/35 border-red-900/30 text-red-300'
                  }`}
                >
                  {feedback.success ? (
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="font-mono">{feedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Telemetry/Monitor logs (Right column) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Webhook Traces Live Log
            </span>

            {logs.length > 0 && (
              <button
                onClick={clearLogs}
                className="text-xs text-red-400 hover:text-red-300 font-mono flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Logs
              </button>
            )}
          </div>

          {/* Log search utility */}
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter traces by event type, status message..."
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          />

          {/* Logs container */}
          <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-2.5">
            {isLoadingLogs ? (
              <div className="py-20 text-center font-mono text-xs text-slate-500 flex items-center justify-center gap-2">
                <Spinner /> Querying database telemetry logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <CloudLightning className="w-8 h-8 text-slate-700 mx-auto opacity-50 mb-2.5" />
                <p className="font-mono text-xs text-slate-500">No Webhook interactions captured yet</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">Trigger an event on the left compiler column to trace live DB routing.</p>
              </div>
            ) : (
              filteredLogs.map(log => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`p-3 bg-slate-950/60 border rounded-lg transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/10 bg-indigo-950/5' 
                        : 'border-slate-800/80 hover:border-slate-700/80 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold font-mono text-xs text-white">
                        {log.eventType}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </div>

                    <p className={`text-[11px] font-mono mt-1.5 leading-relaxed truncate ${
                      log.status.includes('error') || log.status.includes('Ignored')
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                    }`}>
                      {log.status}
                    </p>

                    {/* Expandable JSON details of this particular logged webhook response */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 overflow-hidden text-[10px]"
                      >
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                          <span>Log Record ID: {log.id}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(null);
                            }}
                            className="hover:text-slate-200"
                          >
                            Collapse
                          </button>
                        </div>
                        <pre className="bg-slate-900 border border-slate-800/60 p-2.5 rounded text-[10px] overflow-auto font-mono text-slate-300 max-h-48 leading-relaxed">
                          {log.payload}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
