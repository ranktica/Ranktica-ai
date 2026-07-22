import React, { useState } from 'react';
import { auditVideoMetadata } from '@/infrastructure/gemini';
import { VideoAudit } from '@/shared/types';
import { Loader2, ClipboardCheck, CheckCircle2, XCircle, Printer } from 'lucide-react';

export const ChannelAudit: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [audit, setAudit] = useState<VideoAudit | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    if (!title || !description) return;
    setLoading(true);
    try {
      const result = await auditVideoMetadata(title, description, tags);
      setAudit(result);
    } catch (e) {
      console.error(e);
      alert("Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!audit) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked. Please permit popups to export the PDF.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Channel Metadata Audit Report - ${title.substring(0, 30)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #111827;
              padding: 40px;
              margin: 0;
              background: #ffffff;
              line-height: 1.5;
            }
            .header {
              border-bottom: 3px solid #dc2626;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title-badge {
              font-size: 9px;
              font-weight: 900;
              color: #dc2626;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin-bottom: 4px;
              display: block;
            }
            h1 {
              font-size: 22px;
              font-weight: 900;
              margin: 0;
            }
            .score-badge {
              font-size: 32px;
              font-weight: 900;
              color: #10b981;
            }
            .score-badge.warn {
              color: #f59e0b;
            }
            .score-badge.danger {
              color: #ef4444;
            }
            .section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .section h3 {
              margin-top: 0;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #4b5563;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .meta-field {
              margin-bottom: 12px;
            }
            .meta-field strong {
              font-size: 10px;
              text-transform: uppercase;
              color: #6b7280;
              display: block;
              margin-bottom: 2px;
            }
            .meta-field span {
              font-size: 12px;
              color: #111827;
              font-weight: 600;
            }
            .checklist-item {
              display: flex;
              align-items: start;
              gap: 12px;
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .checklist-item:last-child {
              border-bottom: none;
            }
            .checklist-status {
              font-size: 10px;
              font-weight: 900;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .checklist-status.pass { background: #d1fae5; color: #065f46; }
            .checklist-status.fail { background: #fee2e2; color: #dc2626; }
            .feedback-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e3a8a;
              border-radius: 12px;
              padding: 16px;
              font-size: 11px;
              line-height: 1.6;
            }
            .footer {
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              margin-top: 40px;
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="title-badge">Ranktica AI Channel Optimizer</span>
              <h1>Channel Metadata Audit Report</h1>
            </div>
            <div class="score-badge ${audit.score >= 90 ? '' : audit.score >= 70 ? 'warn' : 'danger'}">
              ${audit.score}%
            </div>
          </div>

          <div class="section">
            <h3>Analyzed Metadata Source</h3>
            <div class="meta-field">
              <strong>Source Title</strong>
              <span>${title}</span>
            </div>
            <div class="meta-field">
              <strong>Source Description</strong>
              <p style="font-size: 11px; color: #374151; white-space: pre-wrap; margin: 4px 0 0 0;">${description}</p>
            </div>
            ${tags ? `
              <div class="meta-field">
                <strong>Source Tags</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                  ${tags.split(',').map(tag => `<span style="font-size: 9.5px; font-family: monospace; background: #e5e7eb; color: #4b5563; padding: 2px 6px; border-radius: 4px;">#${tag.trim()}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>YouTube Best Practices Checklist</h3>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${audit.checklist?.map((item) => `
                <div class="checklist-item">
                  <span class="checklist-status ${item.passed ? 'pass' : 'fail'}">
                    ${item.passed ? 'PASSED' : 'FAILED'}
                  </span>
                  <div>
                    <div style="font-size: 11px; font-weight: 700; color: #111827;">${item.label}</div>
                    ${!item.passed ? `<div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Tip: ${item.tip}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="feedback-box">
            <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Optimization Coach's Assessment</h4>
            <p style="margin: 0; text-align: justify;">${audit.overallFeedback}</p>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} Ranktica AI Corporation. Stamped on ${new Date().toLocaleDateString()}.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
       {/* Input Side */}
       <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="space-y-2">
             <h2 className="text-2xl font-bold text-white">Video Audit</h2>
             <p className="text-zinc-400 text-sm">Check your metadata against YouTube Best Practices.</p>
          </div>
          
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 overflow-y-auto">
             <div>
               <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Title</label>
               <input 
                 value={title} 
                 onChange={e => setTitle(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm"
                 placeholder="Video Title..."
               />
               <span className={`text-xs ${title.length > 60 ? 'text-red-500' : 'text-zinc-500'}`}>{title.length} / 100</span>
             </div>

             <div>
               <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Description</label>
               <textarea 
                 value={description} 
                 onChange={e => setDescription(e.target.value)}
                 className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm resize-none"
                 placeholder="Video Description..."
               />
               <span className="text-xs text-zinc-500">{description.split(' ').length} words</span>
             </div>

             <div>
               <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Tags (Comma Separated)</label>
               <textarea 
                 value={tags} 
                 onChange={e => setTags(e.target.value)}
                 className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm resize-none"
                 placeholder="tag1, tag2, tag3..."
               />
             </div>

             <button 
               onClick={handleAudit}
               disabled={loading || !title}
               className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" /> : <><ClipboardCheck size={18} /> Audit Video</>}
             </button>
          </div>
       </div>

       {/* Result Side */}
       <div className="w-full md:w-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          {!audit ? (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
               <ClipboardCheck size={64} className="mb-4 opacity-50" />
               <p>Enter details to get your score.</p>
             </div>
          ) : (
             <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                   <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-white">Audit Report</h3>
                      <button
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer w-fit"
                      >
                        <Printer size={12} className="text-red-500" /> Export PDF Report
                      </button>
                   </div>
                   <div className={`text-3xl font-bold ${
                      audit.score >= 90 ? 'text-green-500' : audit.score >= 70 ? 'text-yellow-500' : 'text-red-500'
                   }`}>
                      {audit.score}%
                   </div>
                </div>

                <div className="space-y-3">
                   {audit.checklist?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                         {item.passed ? <CheckCircle2 className="text-green-500 shrink-0" size={20} /> : <XCircle className="text-red-500 shrink-0" size={20} />}
                         <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            {!item.passed && <p className="text-xs text-zinc-400 mt-1">{item.tip}</p>}
                         </div>
                      </div>
                   ))}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                   <h4 className="text-sm font-bold text-blue-300 mb-2">Coach's Feedback</h4>
                   <p className="text-sm text-zinc-300 leading-relaxed">{audit.overallFeedback}</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};