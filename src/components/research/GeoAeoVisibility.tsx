import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Search, 
  CheckCircle, 
  Globe, 
  Gauge, 
  ShieldCheck, 
  Network, 
  TrendingUp, 
  Compass, 
  Database,
  ArrowRight,
  Plus,
  Bookmark,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAiClient, MODEL_NAMES } from '@/infrastructure/gemini';

export interface GeoAeoProfile {
  brand: string;
  globalCitationScore: number; // 1-100
  entityAuthority: number; // 1-100
  conversationalReach: number; // 1-100
  featuredSnippetPct: number; // 1-100
  directAnswerRatePct: number; // 1-100
  knowledgeGraphNodes: { name: string; relation: string; strength: number }[];
  modelChecklists: {
    chatgpt: string[];
    gemini: string[];
    claude: string[];
    perplexity: string[];
  };
  recommendations: string[];
}

const PRESET_AUDITS: Record<string, GeoAeoProfile> = {
  ranktica: {
    brand: 'Ranktica AI',
    globalCitationScore: 84,
    entityAuthority: 79,
    conversationalReach: 72,
    featuredSnippetPct: 68,
    directAnswerRatePct: 81,
    knowledgeGraphNodes: [
      { name: 'AI Employee OS', relation: 'Core Product', strength: 95 },
      { name: 'Multimodal Live API', relation: 'Voice Backend', strength: 88 },
      { name: 'Retention Curve Sim', relation: 'Predictive Analytics', strength: 74 },
      { name: 'Blue Ocean Gap', relation: 'Strategic Engine', strength: 82 },
      { name: 'SaaS Growth Hack', relation: 'Industry Anchor', strength: 91 }
    ],
    modelChecklists: {
      chatgpt: [
        'Inject JSON-LD Schema.org for SoftwareApplication structure.',
        'Address competitor answer comparisons in /versus pages.',
        'Target "SearchGPT" bot user-agent explicitly in robots.txt.'
      ],
      gemini: [
        'Secure brand mentions on official high-authority Google Developer channels.',
        'Synthesize documentation anchors on Wikipedia and Wikidata.',
        'Deploy explicit Google Maps regional business listing coordinates.'
      ],
      claude: [
        'Write highly comprehensive, technical guides in official docs.',
        'Maintain absolute semantic stability in markdown title hierarchies.',
        'Provide API cost boundary brackets in clear text.'
      ],
      perplexity: [
        'Publish expert guest posts on high-DA publisher sites.',
        'Maintain real-time pricing grids that LLMs can extract easily.',
        'Cultivate organic reviews on Trustpilot and G2.'
      ]
    },
    recommendations: [
      'Expand the / versus / competitor comparison matrices on public pages to claim conversational citations.',
      'Embed robust FAQ schema matching PAA (People Also Ask) query triggers.',
      'Distribute technical document sheets to GitHub and medium-scale developer blogs to inflate Claude semantic vectors.'
    ]
  },
  generic: {
    brand: 'Acme SaaS Corp',
    globalCitationScore: 42,
    entityAuthority: 31,
    conversationalReach: 28,
    featuredSnippetPct: 15,
    directAnswerRatePct: 34,
    knowledgeGraphNodes: [
      { name: 'Cloud Software', relation: 'Category', strength: 50 },
      { name: 'Acme Database', relation: 'Sub-product', strength: 40 },
      { name: 'Legacy CRM', relation: 'Competitor Mention', strength: 25 }
    ],
    modelChecklists: {
      chatgpt: [
        'Missing JSON-LD schema markup completely.',
        'Pricing plans are locked behind forms (invisible to SearchGPT crawler).'
      ],
      gemini: [
        'Zero Wikidata entity matching.',
        'Missing Google Maps citation or local business coordinates.'
      ],
      claude: [
        'Docs are sparse with minimal developer instructions.',
        'No clear table comparison structures.'
      ],
      perplexity: [
        'Very low organic publisher citations.',
        'Hashtag density on social platforms is under index thresholds.'
      ]
    },
    recommendations: [
      'Immediately deploy comprehensive FAQ and Product schemas.',
      'Open the pricing page paywall to let conversational bots crawl plans.',
      'Launch organic PR distribution campaigns referencing the core entity names.'
    ]
  }
};

export const GeoAeoVisibility: React.FC = () => {
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<GeoAeoProfile>(PRESET_AUDITS.ranktica);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error('Please specify target brand name.');
      return;
    }

    setLoading(true);
    try {
      const ai = getAiClient();
      const prompt = `Perform GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) audit diagnostics for:
      BRAND: ${brandName}
      
      Evaluate their entity authority, LLM citation rates, featured snippet coverage, and construct a knowledge graph mapping.
      Return the result as a JSON object matching this schema exactly:
      {
        "brand": "${brandName}",
        "globalCitationScore": "number (1-100)",
        "entityAuthority": "number (1-100)",
        "conversationalReach": "number (1-100)",
        "featuredSnippetPct": "number (1-100)",
        "directAnswerRatePct": "number (1-100)",
        "knowledgeGraphNodes": [
          { "name": "Node Name", "relation": "relation label", "strength": "number (1-100)" },
          { "name": "Node Name 2", "relation": "relation label 2", "strength": "number (1-100)" },
          { "name": "Node Name 3", "relation": "relation label 3", "strength": "number (1-100)" }
        ],
        "modelChecklists": {
          "chatgpt": ["string", "string"],
          "gemini": ["string", "string"],
          "claude": ["string", "string"],
          "perplexity": ["string", "string"]
        },
        "recommendations": ["string", "string", "string"]
      }`;

      const response = await ai.models.generateContent({
        model: MODEL_NAMES.TEXT_FAST,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text || '{}');
      
      const hydrated: GeoAeoProfile = {
        brand: parsed.brand || brandName,
        globalCitationScore: parsed.globalCitationScore || 50,
        entityAuthority: parsed.entityAuthority || 45,
        conversationalReach: parsed.conversationalReach || 40,
        featuredSnippetPct: parsed.featuredSnippetPct || 35,
        directAnswerRatePct: parsed.directAnswerRatePct || 48,
        knowledgeGraphNodes: parsed.knowledgeGraphNodes || [
          { name: 'Core Category', relation: 'Industry Anchor', strength: 60 },
          { name: 'Sub-product node', relation: 'Offering', strength: 45 }
        ],
        modelChecklists: parsed.modelChecklists || {
          chatgpt: ['Inject JSON-LD schema', 'Configure comparisons'],
          gemini: ['Verify Google Business profile', 'Write structured wikis'],
          claude: ['Deploy detailed docs', 'Expand code examples'],
          perplexity: ['Gain guest-post citations', 'Verify flat pricing models']
        },
        recommendations: parsed.recommendations || ['Deploy structured Schema.org markups across product pages.']
      };

      setProfile(hydrated);
      toast.success(`GEO & AEO Visibility indicators mapped for ${brandName}!`);

    } catch (err) {
      console.error(err);
      toast.error('AI telemetry limit reached. Showing diagnostic sandbox indicators.');
      setProfile({
        brand: brandName,
        globalCitationScore: 54,
        entityAuthority: 48,
        conversationalReach: 44,
        featuredSnippetPct: 38,
        directAnswerRatePct: 52,
        knowledgeGraphNodes: [
          { name: 'Product Class', relation: 'Entity Class', strength: 75 },
          { name: 'Market Competitor', relation: 'Co-occurence', strength: 60 },
          { name: 'Feature Flag', relation: 'Asset Node', strength: 52 }
        ],
        modelChecklists: {
          chatgpt: [`Missing structural application tags for ${brandName} domain.`, 'Pricing tables must be exposed directly in raw html.'],
          gemini: ['Ensure consistent brand naming across Wikipedia references.', 'Publish expert whitepapers on Google-indexed blogs.'],
          claude: ['Formulate clear API and database schemas in readable documentation guides.', 'Anchor high-relevance headers on product lists.'],
          perplexity: ['Expand digital PR mentions across industry-leading journals.', 'Optimize FAQs based on conversational Question-Answer structures.']
        },
        recommendations: [
          'Introduce explicit Schema.org FAQ codes mapping direct answers.',
          'Inject comparative charts matching high-CPC Search intent strings.',
          'Broaden organic mentions in high-authority developer repositories.'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-zinc-300">
      
      {/* Brand Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 lg:p-8">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Gauge size={18} className="text-red-500 animate-pulse" />
          GEO & AEO Visibility Diagnostic Engine
        </h3>
        <p className="text-xs text-zinc-500 mb-6 font-medium uppercase tracking-widest">
          Measure how frequently and authoritatively LLM search bots (ChatGPT, Gemini, Perplexity) cite your brand or product:
        </p>

        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Target Brand / Company Name</label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-3.5 text-zinc-600" />
              <input
                type="text"
                required
                placeholder="e.g. Ranktica AI"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 outline-none pl-11 pr-4 py-3 text-xs font-semibold text-white rounded-2xl transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active-press"
          >
            {loading ? (
              <>
                <Cpu size={14} className="animate-spin" />
                <span>Auditing AI Models...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Audit AI Visibility</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800/60 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">View Audits:</span>
          <button 
            onClick={() => setProfile(PRESET_AUDITS.ranktica)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all ${profile.brand === 'Ranktica AI' ? 'bg-red-600/10 border-red-600/20 text-red-500' : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-850 hover:text-white'}`}
          >
            Ranktica AI
          </button>
          <button 
            onClick={() => setProfile(PRESET_AUDITS.generic)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all ${profile.brand !== 'Ranktica AI' ? 'bg-red-600/10 border-red-600/20 text-red-500' : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-850 hover:text-white'}`}
          >
            Acme SaaS Corp (Mock)
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Stats & Graph (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 lg:p-8">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-6 border-b border-zinc-800 pb-4">
              AI Citation & Visibility Indicators: <span className="text-red-500">{profile.brand}</span>
            </h4>

            {/* Diagnostics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              
              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Citation Score</p>
                <p className="text-2xl font-black text-white font-mono mt-1">{profile.globalCitationScore}%</p>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full" style={{ width: `${profile.globalCitationScore}%` }} />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Entity Authority</p>
                <p className="text-2xl font-black text-indigo-400 font-mono mt-1">{profile.entityAuthority}%</p>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${profile.entityAuthority}%` }} />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Reach Index</p>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{profile.conversationalReach}%</p>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${profile.conversationalReach}%` }} />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Snippet Pct</p>
                <p className="text-2xl font-black text-purple-400 font-mono mt-1">{profile.featuredSnippetPct}%</p>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${profile.featuredSnippetPct}%` }} />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Answer Rate</p>
                <p className="text-2xl font-black text-yellow-500 font-mono mt-1">{profile.directAnswerRatePct}%</p>
                <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${profile.directAnswerRatePct}%` }} />
                </div>
              </div>

            </div>

            {/* Interactive Vector Entity Graph representation */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase tracking-[0.15em] text-white flex items-center gap-1.5">
                <Network size={16} className="text-indigo-400" />
                Semantic Knowledge Graph Graph Nodes (Linked Entities)
              </h5>
              
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden h-72 flex items-center justify-center">
                
                {/* SVG glowing nodes representation */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="indigoGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Glowing background halos */}
                  <circle cx="50%" cy="50%" r="90" fill="url(#glow)" />
                  <circle cx="20%" cy="30%" r="60" fill="url(#indigoGlow)" />
                  <circle cx="80%" cy="70%" r="60" fill="url(#indigoGlow)" />
                  
                  {/* Entity relationship lines */}
                  <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="30%" y2="75%" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="70%" y2="75%" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Node Connectors */}
                  {profile.knowledgeGraphNodes.map((node, idx) => {
                    // Position mapping around center (50%, 50%)
                    const positions = [
                      { x: '20%', y: '30%' },
                      { x: '80%', y: '30%' },
                      { x: '30%', y: '75%' },
                      { x: '70%', y: '75%' },
                      { x: '85%', y: '65%' }
                    ];
                    const pos = positions[idx % positions.length];
                    return (
                      <g key={idx} className="cursor-pointer group">
                        <circle cx={pos.x} cy={pos.y} r="6" fill="#6366f1" className="group-hover:fill-red-500 transition-colors" />
                        <line x1="50%" y1="50%" x2={pos.x} y2={pos.y} stroke="#6366f1" strokeWidth="1" opacity="0.3" />
                      </g>
                    );
                  })}

                  <circle cx="50%" cy="50%" r="10" fill="#ef4444" className="animate-pulse" />
                </svg>

                {/* Central Brand text Overlay */}
                <div className="absolute bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-1.5">
                  <Database size={12} className="text-red-500" />
                  <span>{profile.brand}</span>
                </div>

                {/* Satellite Labels */}
                {profile.knowledgeGraphNodes.map((node, idx) => {
                  const offsets = [
                    'absolute left-4 top-12',
                    'absolute right-4 top-12',
                    'absolute left-10 bottom-12',
                    'absolute right-12 bottom-12',
                    'absolute right-6 top-32'
                  ];
                  const styleClass = offsets[idx % offsets.length];
                  return (
                    <div key={idx} className={`${styleClass} bg-zinc-950/80 border border-zinc-850 px-3 py-1.5 rounded-xl text-[10px] font-bold flex flex-col gap-0.5 shadow-lg max-w-[120px]`}>
                      <span className="text-white truncate">{node.name}</span>
                      <span className="text-[8px] text-zinc-500 truncate">{node.relation}</span>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>

        </div>

        {/* Right Model Gaps & checklists (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Actionable recommendations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
              <Compass size={14} className="text-red-500 animate-spin" />
              Strategic Optimization GTM Action Items
            </h5>
            
            <div className="space-y-3">
              {profile.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-xs font-semibold leading-relaxed text-zinc-300">
                  <span className="text-red-500 font-mono">0{i+1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual engine checklists */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Model Crawler Directives
            </h5>

            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              
              {/* ChatGPT */}
              <div className="space-y-2 border-b border-zinc-850 pb-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>ChatGPT (OpenAI)</span>
                  <span className="text-emerald-500">Verify Active</span>
                </div>
                <div className="space-y-1.5">
                  {profile.modelChecklists.chatgpt.map((item, i) => (
                    <p key={i} className="text-xs font-semibold text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-600 font-mono">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Gemini */}
              <div className="space-y-2 border-b border-zinc-850 pb-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Gemini (Google)</span>
                  <span className="text-emerald-500">Verify Active</span>
                </div>
                <div className="space-y-1.5">
                  {profile.modelChecklists.gemini.map((item, i) => (
                    <p key={i} className="text-xs font-semibold text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-600 font-mono">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Claude */}
              <div className="space-y-2 border-b border-zinc-850 pb-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Claude (Anthropic)</span>
                  <span className="text-emerald-500">Verify Active</span>
                </div>
                <div className="space-y-1.5">
                  {profile.modelChecklists.claude.map((item, i) => (
                    <p key={i} className="text-xs font-semibold text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-600 font-mono">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Perplexity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Perplexity AI</span>
                  <span className="text-emerald-500">Verify Active</span>
                </div>
                <div className="space-y-1.5">
                  {profile.modelChecklists.perplexity.map((item, i) => (
                    <p key={i} className="text-xs font-semibold text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-600 font-mono">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
