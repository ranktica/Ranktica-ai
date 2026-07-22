import React, { useState } from 'react';
import { generatePersona, findNicheGaps, forecastTrends } from '@/infrastructure/gemini';
import { CustomerPersona, NicheGap, TrendForecast } from '@/shared/types';
import { Loader2, Users, Search, TrendingUp, Target, User, LineChart, MessageSquare, Quote, MapPin, Briefcase, GraduationCap, Heart, DollarSign, Home, Clock, ShoppingBag, Download, FileText } from 'lucide-react';
import { LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'react-hot-toast';

export const MarketStrategist: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'persona' | 'gaps' | 'trends'>('persona');
  const [input, setInput] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Results
  const [persona, setPersona] = useState<CustomerPersona | null>(null);
  const [gaps, setGaps] = useState<NicheGap[]>([]);
  const [forecast, setForecast] = useState<TrendForecast | null>(null);

  const hasData = (activeTab === 'persona' && persona) || 
                  (activeTab === 'gaps' && gaps.length > 0) || 
                  (activeTab === 'trends' && forecast);

  const handleExportCSV = () => {
    let csvRows: string[] = [];
    
    if (activeTab === 'persona' && persona) {
      csvRows.push("SECTION,FIELD,VALUE");
      csvRows.push(`Persona Profile,Name,"${persona.name.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Occupation,"${persona.occupation.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Age Range,"${persona.ageRange.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Gender,"${persona.gender.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Quote,"${persona.quote.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Daily Routine,"${persona.dailyRoutine.replace(/"/g, '""')}"`);
      csvRows.push(`Persona Profile,Buying Behavior,"${persona.buyingBehavior.replace(/"/g, '""')}"`);
      csvRows.push(`Demographics,Location,"${(persona.demographics?.location || '').replace(/"/g, '""')}"`);
      csvRows.push(`Demographics,Income Level,"${(persona.demographics?.incomeLevel || '').replace(/"/g, '""')}"`);
      csvRows.push(`Demographics,Education,"${(persona.demographics?.education || '').replace(/"/g, '""')}"`);
      csvRows.push(`Demographics,Family Status,"${(persona.demographics?.familyStatus || '').replace(/"/g, '""')}"`);
      
      persona.psychographics?.goals?.forEach((g, i) => {
        csvRows.push(`Goals,Goal ${i+1},"${g.replace(/"/g, '""')}"`);
      });
      persona.psychographics?.painPoints?.forEach((p, i) => {
        csvRows.push(`Pain Points,Pain Point ${i+1},"${p.replace(/"/g, '""')}"`);
      });
      persona.psychographics?.values?.forEach((v, i) => {
        csvRows.push(`Values,Value ${i+1},"${v.replace(/"/g, '""')}"`);
      });
      persona.psychographics?.fears?.forEach((f, i) => {
        csvRows.push(`Fears,Fear ${i+1},"${f.replace(/"/g, '""')}"`);
      });
    } else if (activeTab === 'gaps' && gaps.length > 0) {
      csvRows.push("GAP,OPPORTUNITY SCORE,DESCRIPTION,CURRENT SOLUTIONS");
      gaps.forEach((g) => {
        csvRows.push(`"${g.gap.replace(/"/g, '""')}",${g.opportunityScore},"${g.description.replace(/"/g, '""')}","${g.currentSolutions.replace(/"/g, '""')}"`);
      });
    } else if (activeTab === 'trends' && forecast) {
      csvRows.push(`TREND METRIC,TOPIC,"${forecast.topic.replace(/"/g, '""')}"`);
      csvRows.push(`TREND SUMMARY,SUMMARY,"${forecast.summary.replace(/"/g, '""')}"`);
      csvRows.push("YEAR,INTEREST VALUE (OUT OF 100),KEY DRIVER");
      forecast.forecast?.forEach((f) => {
        csvRows.push(`${f.year},${f.interest},"${f.keyDriver.replace(/"/g, '""')}"`);
      });
    } else {
      toast.error("No active report data to export. Please generate data first.");
      return;
    }

    const blob = new Blob([csvRows.join("\r\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ranktica_market_strategist_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully! 📊");
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up window blocked. Please permit pop-ups to preview and print report.');
      return;
    }

    let reportHtml = '';

    if (activeTab === 'persona' && persona) {
      reportHtml = `
        <div class="report-header">
          <h1>CUSTOMER PERSONA REPORT</h1>
          <p class="subtitle">Synthesized by Ranktica AI Market Strategist</p>
        </div>
        
        <div class="grid">
          <div class="card profile-card">
            <h2>${persona.name}</h2>
            <p class="occupation">${persona.occupation}</p>
            <p class="meta">${persona.ageRange} • ${persona.gender}</p>
            
            <div class="demographics">
              <p><strong>Location:</strong> ${persona.demographics?.location || 'N/A'}</p>
              <p><strong>Income:</strong> ${persona.demographics?.incomeLevel || 'N/A'}</p>
              <p><strong>Education:</strong> ${persona.demographics?.education || 'N/A'}</p>
              <p><strong>Family Status:</strong> ${persona.demographics?.familyStatus || 'N/A'}</p>
            </div>
          </div>
          
          <div class="card">
            <h3>Bio & Quote</h3>
            <p class="quote">"${persona.quote}"</p>
            <p><strong>Daily Routine:</strong></p>
            <p class="routine">${persona.dailyRoutine}</p>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Goals & Values</h3>
            <ul>
              ${persona.psychographics?.goals?.map(g => `<li>${g}</li>`).join('') || ''}
            </ul>
            <p><strong>Core Values:</strong></p>
            <div class="tags">
              ${persona.psychographics?.values?.map(v => `<span class="tag tag-green">${v}</span>`).join('') || ''}
            </div>
          </div>

          <div class="card">
            <h3>Pains & Fears</h3>
            <ul>
              ${persona.psychographics?.painPoints?.map(p => `<li>${p}</li>`).join('') || ''}
            </ul>
            <p><strong>Fears:</strong></p>
            <div class="tags">
              ${persona.psychographics?.fears?.map(f => `<span class="tag tag-red">${f}</span>`).join('') || ''}
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Buying Behavior</h3>
          <p>${persona.buyingBehavior}</p>
          <p><strong>Favorite Brands:</strong></p>
          <div class="tags">
            ${persona.favoriteBrands?.map(b => `<span class="tag">${b}</span>`).join('') || ''}
          </div>
        </div>
      `;
    } else if (activeTab === 'gaps' && gaps.length > 0) {
      reportHtml = `
        <div class="report-header">
          <h1>BLUE OCEAN GAP DOSSIER</h1>
          <p class="subtitle">Synthesized by Ranktica AI Market Strategist</p>
        </div>
        
        <div class="gaps-list">
          ${gaps.map((gap, idx) => `
            <div class="card gap-card">
              <div class="gap-title-row">
                <h2>${idx + 1}. ${gap.gap}</h2>
                <div class="score-badge">Opp. Score: ${gap.opportunityScore}</div>
              </div>
              <p class="description">${gap.description}</p>
              <div class="problem-block">
                <strong>Current Problem / Solutions:</strong>
                <p>${gap.currentSolutions}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'trends' && forecast) {
      reportHtml = `
        <div class="report-header">
          <h1>5-YEAR MARKET TREND FORECAST</h1>
          <p class="subtitle">Synthesized by Ranktica AI Market Strategist</p>
        </div>
        
        <div class="card">
          <h2>Topic: ${forecast.topic}</h2>
          <p class="summary">${forecast.summary}</p>
        </div>

        <div class="card">
          <h3>Forecast Timeline</h3>
          <table class="timeline-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Interest (out of 100)</th>
                <th>Key Driver</th>
              </tr>
            </thead>
            <tbody>
              ${forecast.forecast?.map(f => `
                <tr>
                  <td><strong>${f.year}</strong></td>
                  <td class="interest-cell">${f.interest}</td>
                  <td>${f.keyDriver}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>
      `;
    } else {
      toast.error("No active report data to export. Please generate data first.");
      return;
    }

    const printDoc = printWindow.document;
    printDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Market Strategist Report - Ranktica AI</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              line-height: 1.5;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
            }
            
            .report-header {
              border-bottom: 2px solid #ef4444;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .report-header h1 {
              font-size: 28px;
              font-weight: 900;
              letter-spacing: -0.025em;
              color: #0f172a;
              margin: 0;
              text-transform: uppercase;
            }
            
            .report-header .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 4px 0 0 0;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.05em;
            }
            
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              background: #f8fafc;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            h2 {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 8px 0;
            }
            
            h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            
            .occupation {
              font-weight: 600;
              color: #6366f1;
              margin: 0;
            }
            
            .meta {
              font-size: 12px;
              color: #64748b;
              margin: 4px 0 16px 0;
            }
            
            .demographics p {
              font-size: 13px;
              margin: 6px 0;
              color: #334155;
            }
            
            .quote {
              font-style: italic;
              color: #475569;
              font-size: 14px;
              border-left: 3px solid #6366f1;
              padding-left: 12px;
              margin-bottom: 16px;
            }
            
            ul {
              margin: 0 0 16px 0;
              padding-left: 20px;
            }
            
            li {
              font-size: 13px;
              color: #334155;
              margin-bottom: 6px;
            }
            
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-top: 8px;
            }
            
            .tag {
              font-size: 11px;
              font-weight: 600;
              padding: 4px 8px;
              border-radius: 6px;
              background: #e2e8f0;
              color: #334155;
            }
            
            .tag-green {
              background: #dcfce7;
              color: #15803d;
            }
            
            .tag-red {
              background: #fee2e2;
              color: #b91c1c;
            }
            
            .gap-card {
              border-left: 4px solid #3b82f6;
            }
            
            .gap-title-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .gap-title-row h2 {
              font-size: 18px;
              margin: 0;
            }
            
            .score-badge {
              font-size: 11px;
              font-weight: 800;
              background: #dcfce7;
              color: #166534;
              padding: 4px 8px;
              border-radius: 9999px;
              text-transform: uppercase;
            }
            
            .problem-block {
              margin-top: 14px;
              padding-top: 12px;
              border-top: 1px dashed #cbd5e1;
              font-size: 13px;
            }
            
            .timeline-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            
            .timeline-table th, .timeline-table td {
              text-align: left;
              padding: 10px;
              border-bottom: 1px solid #cbd5e1;
              font-size: 13px;
            }
            
            .timeline-table th {
              background: #f1f5f9;
              font-weight: 700;
              color: #0f172a;
            }
            
            .interest-cell {
              font-weight: bold;
              color: #8b5cf6;
            }
            
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${reportHtml}
          
          <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Synthesized via Ranktica Enterprise AI Client Authentication Tunnel • Secure ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printDoc.close();
    toast.success("PDF Dossier compiled and preview opened! 📄");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    try {
      if (activeTab === 'persona') {
        const res = await generatePersona(input, gender);
        setPersona(res);
      } else if (activeTab === 'gaps') {
        const res = await findNicheGaps(input);
        setGaps(res);
      } else if (activeTab === 'trends') {
        const res = await forecastTrends(input);
        setForecast(res);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPersonaImage = (p: CustomerPersona) => {
    const genderTerm = p.gender === 'Female' ? 'women' : p.gender === 'Male' ? 'men' : 'women'; 
    const id = p.name.length % 90;
    return `https://randomuser.me/api/portraits/${genderTerm}/${id}.jpg`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-4 py-4">
        <h2 className="text-3xl font-bold text-white">Market Strategist</h2>
        <p className="text-zinc-400">Deep strategic insights powered by AI.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 inline-flex justify-center w-full max-w-md">
          <button 
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'persona' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
          >
             Persona Builder
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('gaps')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'gaps' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
          >
             Gap Hunter
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'trends' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
          >
             Trend Forecast
          </button>
        </div>

        <div className="flex items-center gap-2 justify-center md:justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!hasData}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Export synthesized research data as a CSV spreadsheet"
          >
            <Download size={14} className="text-zinc-400" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={!hasData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-600/10"
            title="Print or export current strategic report as formatted PDF"
          >
            <FileText size={14} /> Export PDF Brief
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
         <form onSubmit={handleGenerate} className="flex gap-4">
            <div className="flex-1 flex gap-2">
               {activeTab === 'persona' && (
                  <select
                     value={gender}
                     onChange={(e) => setGender(e.target.value)}
                     className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none w-32"
                  >
                     <option value="">Any</option>
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                  </select>
               )}
               <input 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={activeTab === 'persona' ? "Enter Niche (e.g. Eco-friendly Skincare)" : activeTab === 'gaps' ? "Enter Market (e.g. Productivity Apps)" : "Enter Topic (e.g. AI Agents)"}
                 className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
               />
            </div>
            <button 
              type="submit" 
              disabled={loading || !input}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
            >
               {loading ? <Loader2 className="animate-spin" /> : activeTab === 'trends' ? 'Forecast' : 'Analyze'}
            </button>
         </form>
      </div>

      {/* --- PERSONA VIEW --- */}
      {activeTab === 'persona' && persona && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
           {/* Background Accents */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
              
              {/* Left Column: Profile */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-lg">
                     <div className="w-32 h-32 rounded-full border-4 border-zinc-800 mx-auto overflow-hidden shadow-xl mb-4">
                        <img src={getPersonaImage(persona)} alt="Persona" className="w-full h-full object-cover" />
                     </div>
                     <h3 className="text-2xl font-bold text-white">{persona.name}</h3>
                     <p className="text-purple-400 font-medium">{persona.occupation}</p>
                     <p className="text-sm text-zinc-500 mt-1">{persona.ageRange} • {persona.gender}</p>
                     
                     <div className="mt-6 pt-6 border-t border-zinc-800 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                           <MapPin size={16} className="text-zinc-500" /> {persona.demographics?.location}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                           <DollarSign size={16} className="text-zinc-500" /> {persona.demographics?.incomeLevel}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                           <GraduationCap size={16} className="text-zinc-500" /> {persona.demographics?.education}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                           <Home size={16} className="text-zinc-500" /> {persona.demographics?.familyStatus}
                        </div>
                     </div>
                 </div>

                 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><Briefcase size={16} /> Bio</h4>
                    <p className="text-sm text-zinc-300 italic mb-4">"{persona.quote}"</p>
                    <div className="text-xs text-zinc-400 border-l-2 border-purple-500 pl-3 leading-relaxed">
                        {persona.dailyRoutine}
                    </div>
                 </div>
              </div>

              {/* Right Column: Details */}
              <div className="lg:col-span-2 space-y-6">
                 
                 {/* Psychographics Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-green-500 uppercase mb-4 flex items-center gap-2"><Target size={16} /> Goals & Values</h4>
                        <ul className="space-y-2 mb-4">
                           {persona.psychographics.goals.map((g, i) => (
                              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2"><span className="text-green-500 mt-1">•</span> {g}</li>
                           ))}
                        </ul>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                           {persona.psychographics.values.map((v, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">{v}</span>
                           ))}
                        </div>
                     </div>

                     <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-red-500 uppercase mb-4 flex items-center gap-2"><Heart size={16} /> Pains & Fears</h4>
                        <ul className="space-y-2 mb-4">
                           {persona.psychographics.painPoints.map((p, i) => (
                              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2"><span className="text-red-500 mt-1">•</span> {p}</li>
                           ))}
                        </ul>
                         <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                           {persona.psychographics.fears.map((v, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">{v}</span>
                           ))}
                        </div>
                     </div>
                 </div>

                 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2"><ShoppingBag size={16} /> Buying Behavior</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                       {persona.buyingBehavior}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                        <div>
                           <span className="text-xs font-bold text-zinc-500 block mb-2">Favorite Brands</span>
                           <div className="flex flex-wrap gap-2">
                              {persona.favoriteBrands.map((b, i) => (
                                 <span key={i} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{b}</span>
                              ))}
                           </div>
                        </div>
                        <div>
                           <span className="text-xs font-bold text-zinc-500 block mb-2">Hobbies & Interests</span>
                           <div className="flex flex-wrap gap-2">
                              {persona.psychographics.hobbies.map((h, i) => (
                                 <span key={i} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{h}</span>
                              ))}
                           </div>
                        </div>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* --- GAPS VIEW --- */}
      {activeTab === 'gaps' && gaps.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gaps.map((gap, idx) => (
               <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                     <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{gap.gap}</h3>
                     <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-green-500">{gap.opportunityScore}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">Opp. Score</span>
                     </div>
                  </div>
                  <p className="text-zinc-300 text-sm mb-4 leading-relaxed">{gap.description}</p>
                  
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                     <span className="text-xs font-bold text-red-400 block mb-1">Current Problem:</span>
                     <p className="text-xs text-zinc-400">{gap.currentSolutions}</p>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* --- TRENDS VIEW --- */}
      {activeTab === 'trends' && forecast && (
         <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <h3 className="text-2xl font-bold text-white">{forecast.topic}</h3>
                     <p className="text-sm text-zinc-500">5-Year Growth Forecast</p>
                  </div>
                  <LineChart className="text-green-500" size={32} />
               </div>

               <div className="h-80 w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                     <ReLineChart data={forecast.forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="year" stroke="#52525b" />
                        <YAxis stroke="#52525b" domain={[0, 100]} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="interest" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6' }} />
                     </ReLineChart>
                  </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  {forecast.forecast.map((f, i) => (
                     <div key={i} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center">
                        <div className="text-zinc-500 text-xs mb-1">{f.year}</div>
                        <div className="text-white font-bold mb-2">{f.interest}/100</div>
                        <div className="text-[10px] text-purple-400 leading-tight">{f.keyDriver}</div>
                     </div>
                  ))}
               </div>

               <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-xl">
                  <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2"><TrendingUp size={16}/> Strategic Outlook</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">{forecast.summary}</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};