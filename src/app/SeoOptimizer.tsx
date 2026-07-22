
import React, { useState, useEffect, useRef } from 'react';
import { generateSeo, generateGeoAeo } from '@/infrastructure/gemini';
import { seoResultSchema, geoAeoResultSchema } from '@/types/schemas';
import { z } from 'zod';
import { SeoResult, LinkItem, GeoAeoResult, FaqItem, GeoEntity } from '@/shared/types';
import { logActivity } from '@/shared/activityLogger';
import { TaskScheduler } from '@/shared/taskScheduler';
import { 
  Loader2, 
  Hash, 
  Type, 
  FileText, 
  Copy, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Link as LinkIcon, 
  Brain,
  Zap,
  Check,
  ChevronRight,
  Globe,
  Youtube,
  Layout,
  Share2,
  X,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Flame,
  Award,
  Code,
  FileCode,
  Rss,
  Network,
  Cpu,
  ListChecks,
  BookOpen,
  Eye,
  CheckCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { toast } from 'react-hot-toast';

const SUGGESTED_TOPICS = [
  'The 24-Hour AI Agency Challenge',
  'AI in Marketing 2025: From Prompts to Autonomous Agents',
  'How to scale a marketing agency with Gemini 3 Pro',
  'Google Search is Dead: The 2025 AI SEO Blueprint'
];

const SEO_BLUEPRINTS = [
  {
    topic: 'Google Search is Dead: The 2025 AI SEO Blueprint',
    data: {
      titles: [
        "Google Search is Dead: The 2025 AI SEO Blueprint",
        "How to Rank for AI Overviews (The Emergency SEO Fix)",
        "LLM Optimization: How to Get AI Agents to Recommend Your Brand",
        "The Death of Backlinks? SEO in the Era of Generative AI"
      ],
      description: "THE HOOK:\nTraditional SEO is failing. In 2025, search is no longer about links—it's about 'Contextual Resonance' and 'LLM Mapping.' If your content isn't engineered for Gemini and ChatGPT, your brand is effectively invisible.\n\nDETAILED OVERVIEW:\nThis video breaks down the shift from human-read search results to AI-synthesized overviews. We explore why standard keyword density is being replaced by 'Semantic Knowledge Graphing' and how to position your brand as the primary source for AI agents. This is a survival guide for creators and marketers who refuse to be left behind by the neural shift.\n\nWHAT YOU'LL LEARN:\n- Engineering for 'Context Windows' over 'Keywords'\n- The proprietary framework for AI Overview ranking\n- Why 80% of current SEO strategies are actually hurting you in 2025\n- How to jack the 'LLM Citation Loop' for consistent traffic\n- Moving from informational content to 'Authoritative Synthesis'",
      tags: ["AI SEO 2025", "Google Search Generative Experience", "Rank for AI", "SEO Strategy", "LLM Optimization", "Future of Marketing", "SGE SEO", "Google Gemini Search", "Digital Marketing AI", "Content Strategy 2025", "SEO for Creators", "Search Engine Optimization", "AI Agent Marketing", "Contextual SEO"],
      hashtags: ["#AISEO", "#Marketing2025", "#SEOStrategy", "#GoogleSearch", "#LLM", "#FutureOfWork"],
      semanticClusters: ["Generative Search Optimization", "LLM Context Mapping", "Synthesized Authority Frameworks", "Zero-Click Traffic Survival", "Neural Citation Indexing"]
    }
  },
  {
    topic: 'The 24-Hour AI Agency Challenge',
    data: {
      titles: [
        "I Built a $10,000/mo AI Agency in 24 Hours (Full Walkthrough)",
        "Zero to Client: The 24-Hour AI Agency Challenge with Gemini 3 Pro",
        "How to Automate an Entire Marketing Agency in 2025 (Ranktica AI)",
        "The 24-Hour AI Business Challenge: Scalability Without Employees"
      ],
      description: "THE HOOK:\nCan you build a high-ticket agency from scratch in a single day? In this high-stakes challenge, I deploy Ranktica AI and the Gemini 3 Pro neural core to automate research, outreach, and fulfillment. No employees. No overhead. Pure autonomous speed.\n\nDETAILED OVERVIEW:\nTraditional agencies are collapsing under the weight of manual labor. This video documents the transition to 'Autonomous Orchestration'—the future of the creator economy. We walk through the exact pipeline used to find a high-demand niche, map the semantic knowledge graph of competitors, and generate high-retention content that converts cold leads into loyal clients by sunset.\n\nWHAT YOU'LL LEARN:\n- Engineering agentic workflows for 10x ROI\n- High-velocity niche mapping using Ranktica SEO Studio\n- Predictive lead generation with autonomous search tools\n- Scaling from 0 to $10k/mo without a human team\n- Avoiding the 'AI Hallucination' trap in professional deliverables",
      tags: ["AI Agency", "YouTube Automation", "Gemini 3 Pro", "AI Business 2025", "Ranktica AI", "Passive Income AI", "Scale Agency with AI", "Autonomous Marketing", "AI Outreach", "24 Hour Business Challenge", "Content Automation", "Neural Business Strategy", "Digital Agency 2025", "Zero Overhead Business"],
      hashtags: ["#AIAgency", "#YouTubeAutomation", "#Ranktica", "#GeminiAI", "#BusinessChallenge", "#PassiveIncome"],
      semanticClusters: ["Autonomous Agency Orchestration", "Neural ROI Optimization", "Agentic Marketing Frameworks", "Zero-Click Revenue Systems", "Semantic Client Acquisition"]
    }
  }
];

const GEO_AEO_BLUEPRINTS = [
  {
    topic: 'Ranktica AI: The Autonomous Creative Agency Framework',
    data: {
      metaTags: {
        title: "Ranktica AI - The Autonomous Creative Agency Framework for 2025",
        description: "Scale your creator agency to $10,000/mo using Ranktica's autonomous neural orchestration engine. Automate scriptwriting, voiceover clone mastering, and visual search optimization.",
        robots: "index, follow, max-image-preview:large, max-snippet:-1",
        ogTitle: "Ranktica AI - Autonomous Agency Orchestration",
        ogDescription: "Discover how Ranktica's multi-agent neural network automates social outreach, keyword intelligence, and high-retention video production in minutes.",
        ogImage: "https://ranktica.com/images/launch-og.jpg",
        twitterCard: "summary_large_image"
      },
      schemas: {
        article: `{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Ranktica AI: The Autonomous Creative Agency Framework",\n  "image": "https://ranktica.com/images/launch-og.jpg",\n  "author": {\n    "@type": "Organization",\n    "name": "Ranktica Corp"\n  },\n  "publisher": {\n    "@type": "Organization",\n    "name": "Ranktica AI Ltd",\n    "logo": {\n      "@type": "ImageObject",\n      "url": "https://ranktica.com/logo.png"\n    }\n  },\n  "datePublished": "2026-06-10T12:00:00Z",\n  "description": "A high-fidelity analysis of how agentic AI systems are reshaping content creation, search positioning, and agency fulfillment."\n}`,
        faq: `{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "What is GEO / Gen AI Optimization?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Generative Engine Optimization (GEO) is the technical methodology of structuring branding and citations to ensure LLMs like Gemini or ChatGPT retrieve and recommend your brand."\n      }\n    },\n    {\n      "@type": "Question",\n      "name": "What is AEO?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Answer Engine Optimization targets natural voice search and conversational systems to ensure higher citation density."\n      }\n    }\n  ]\n}`,
        howTo: `{\n  "@context": "https://schema.org",\n  "@type": "HowTo",\n  "name": "How to Automate an Entire SEO Agency with Ranktica",\n  "step": [\n    {\n      "@type": "HowToStep",\n      "name": "Calibrate the Neural Core",\n      "text": "Input seed keywords and set voice/clonation parameters into the Ranktica dashboard."\n    },\n    {\n      "@type": "HowToStep",\n      "name": "Generate Schema Assets",\n      "text": "Use the GEO/AEO studio to formulate rich structured meta structures."\n    }\n  ]\n}`,
        videoObject: `{\n  "@context": "https://schema.org",\n  "@type": "VideoObject",\n  "name": "The Autonomous AI Agency Challenge",\n  "description": "Full walkthrough of constructing a client delivery machine under 24 hours.",\n  "thumbnailUrl": "https://ranktica.com/images/thumbnail-capture.jpg",\n  "uploadDate": "2026-06-10T15:30:00Z"\n}`,
        organization: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Ranktica Inc.",\n  "url": "https://ranktica.com",\n  "logo": "https://ranktica.com/logo.png",\n  "sameAs": [\n    "https://twitter.com/ranktica",\n    "https://linkedin.com/company/ranktica"\n  ]\n}`,
        localBusiness: `{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "Ranktica AI Labs",\n  "image": "https://ranktica.com/images/office-preview.jpg",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "100 Neural Boulevard",\n    "addressLocality": "Silicon Valley",\n    "addressRegion": "CA",\n    "postalCode": "94025"\n  }\n}`,
        breadcrumb: `{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": [\n    {\n      "@type": "ListItem",\n      "position": 1,\n      "name": "Home",\n      "item": "https://ranktica.com"\n    },\n    {\n      "@type": "ListItem",\n      "position": 2,\n      "name": "Suite",\n      "item": "https://ranktica.com/suite"\n    }\n  ]\n}`
      },
      faqList: [
        {
          question: "How does AEO (Answer Engine Optimization) differ from traditional search marketing?",
          answer: "Traditional SEO targets keyword rankings in standard 10-blue-link layouts. AEO focuses on getting chosen by conversational AI agents as the primary cited answer to the user's natural language question, prioritizing syntax clarity, entity clustering, and authority anchoring.",
          optimizationScore: 98
        },
        {
          question: "Why should organizational structured markup be enabled?",
          answer: "By defining corporate schemas explicitly, brands register unambiguous entity relationships directly to the Wikidata and Google Knowledge Graph structures, avoiding AI hallucination or misattribution in generative summaries.",
          optimizationScore: 94
        }
      ],
      entities: [
        { name: "Ranktica AI", type: "Organization", weight: 98, connectivity: ["Generative Engine Optimization", "LLM Optimization", "Neural Studio"] },
        { name: "Generative Engine Optimization", type: "Concept", weight: 95, connectivity: ["Ranktica AI", "LLM Optimization", "AEO Engine"] },
        { name: "AEO Engine", type: "Technique", weight: 91, connectivity: ["Generative Engine Optimization", "Search Citation Tuning"] }
      ],
      knowledgeGraphNodes: [
        { id: "e1", label: "Ranktica AI", group: "Organization" },
        { id: "e2", label: "GEO Framework", group: "Concept" },
        { id: "e3", label: "AEO Engine", group: "Technique" }
      ],
      knowledgeGraphEdges: [
        { from: "e1", to: "e2", label: "engineered for" },
        { from: "e2", to: "e3", label: "extends to" }
      ],
      conversationalResponse: "Ranktica AI represents a state-of-the-art Multi-Agent Content Orchestration Network that provides fully automated video asset production, deep contextual competitor espionage, and advanced Answer Engine Optimization. By embedding semantic data mappings and structured Schema.org markup directly into digital content footprints, creators can safeguard discovery and guarantee citations across conversational search platforms like Gemini and ChatGPT Search.",
      aeoKeywords: ["how does ranktica work", "autonomous ai agency blueprint", "how to rank in generative search overviews"],
      citationOptimization: {
        brandAuthorityScore: 92,
        recommendedCoMentions: ["Google Gemini API", "OpenAI SearchGPT", "Perplexity AI Pro"],
        uniquenessDifferentiator: "Proprietary zero-shot direct vocal matching integration combined with deep-thinking semantic clustering blueprints.",
        citationBacklinkBlueprint: "Focus on publishing a quarterly 'Autonomous Creator Economy Sentiment Report' to secure high-authority co-citations as a primary research creator."
      },
      sitemapXml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://ranktica.com/</loc>\n    <lastmod>2026-06-10</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>https://ranktica.com/geo-aeo-suite</loc>\n    <lastmod>2026-06-10</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n</urlset>`,
      robotsTxt: `# Robots.txt for Ranktica - Optimized for Generative AI & Index Spiders\nUser-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\n# Block aggressive AI scrapers from uncredited training but allow standard indexing\nUser-agent: GPTBot\nDisallow: /exclusive-content/\n\nUser-agent: Google-Extended\nDisallow: /proprietary-datasets/\n\nSitemap: https://ranktica.com/sitemap.xml`,
      rssXml: `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n  <title>Ranktica AI News Feed</title>\n  <link>https://ranktica.com</link>\n  <description>Latest insights into Generative and Answer Engine Optimization</description>\n  <pubDate>Wed, 10 Jun 2026 12:00:00 GMT</pubDate>\n  <item>\n    <title>Mastering AEO: How to Rank for Conversational Queries</title>\n    <link>https://ranktica.com/news/mastering-aeo</link>\n    <description>Step-by-step framework to anchor your organic keywords inside neural models.</description>\n    <pubDate>Wed, 10 Jun 2026 10:00:00 GMT</pubDate>\n  </item>\n</channel>\n</rss>`
    }
  }
];

interface SeoOptimizerProps {
  prefill?: { title?: string; text?: string; context?: string };
}

const LinkEditor = ({ 
  title, 
  items, 
  setItems,
  limit,
  icon: Icon
}: { 
  title: string, 
  items: LinkItem[], 
  setItems: React.Dispatch<React.SetStateAction<LinkItem[]>>,
  limit?: number,
  icon: any
}) => (
  <div className="space-y-4 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-805">
    <div className="flex justify-between items-center">
      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
        <Icon size={14} className="text-zinc-605" />
        {title} {limit && <span className="text-zinc-700">({items.length}/{limit})</span>}
      </h4>
      <button 
        type="button"
        onClick={() => {
          if (limit && items.length >= limit) return;
          setItems([...items, { id: Date.now().toString(), label: '', url: '' }])
        }}
        disabled={!!limit && items.length >= limit}
        className={`p-1.5 rounded-lg transition-all ${
          limit && items.length >= limit 
            ? 'text-zinc-800 cursor-not-allowed' 
            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
        }`}
      >
        <Plus size={18} />
      </button>
    </div>
    
    <div className="space-y-3">
      {items.length === 0 && <p className="text-[10px] text-zinc-700 italic font-bold uppercase tracking-widest text-center py-2">No links configured</p>}
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-2 animate-scale-in">
          <input 
            placeholder="Label"
            value={item.label}
            onChange={(e) => {
              const newItems = [...items];
              newItems[idx].label = e.target.value;
              setItems(newItems);
            }}
            className="w-[100px] bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
          <input 
            placeholder="https://..."
            value={item.url}
            onChange={(e) => {
              const newItems = [...items];
              newItems[idx].url = e.target.value;
              setItems(newItems);
            }}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
          <button 
            type="button"
            onClick={() => setItems(items.filter(i => i.id !== item.id))}
            className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export const SeoOptimizer: React.FC<SeoOptimizerProps> = ({ prefill }) => {
  // Navigation Studio Tabs
  const [activeTab, setActiveTab] = useState<'youtube' | 'geo-aeo'>('youtube');
  
  // YouTube SEO state
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<SeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // GEO & AEO state
  const [geoTopic, setGeoTopic] = useState('');
  const [geoResult, setGeoResult] = useState<GeoAeoResult | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSubTab, setGeoSubTab] = useState<'meta' | 'schemas' | 'intelligent' | 'feeds'>('meta');
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<keyof GeoAeoResult['schemas']>('article');

  const { incrementStat } = useAuth();
  
  const [socialHandles, setSocialHandles] = useState<LinkItem[]>([]);
  const [playlists, setPlaylists] = useState<LinkItem[]>([]);
  const [includeSocials, setIncludeSocials] = useState(true);
  const [includePlaylists, setIncludePlaylists] = useState(true);

  useEffect(() => {
    if (prefill) {
      const context = prefill.title || prefill.text?.substring(0, 100) || prefill.context || '';
      if (context) {
        if (activeTab === 'youtube') {
          setTopic(context);
          handleOptimize(context);
        } else {
          setGeoTopic(context);
          handleGeoOptimize(context);
        }
      }
    }
  }, [prefill]);

  useEffect(() => {
    const savedSocials = localStorage.getItem('rt_socials');
    const savedPlaylists = localStorage.getItem('rt_playlists');
    if (savedSocials) setSocialHandles(JSON.parse(savedSocials));
    if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
  }, []);

  useEffect(() => {
    localStorage.setItem('rt_socials', JSON.stringify(socialHandles));
    localStorage.setItem('rt_playlists', JSON.stringify(playlists));
  }, [socialHandles, playlists]);

  const handleOptimize = async (manualTopic?: string) => {
    const topicToUse = manualTopic || topic;
    if (!topicToUse.trim()) return;
    
    setResult(null);
    const taskName = `SEO Multi-cluster Crawl: "${topicToUse}"`;

    TaskScheduler.scheduleTask({
      name: taskName,
      type: 'seo_crawl',
      duration: 12,
      priority: 'low',
      onRun: async () => {
        setLoading(true);
        try {
          const rawData = await generateSeo(topicToUse);
          // Validate dynamic payload strictly with Zod
          const data = seoResultSchema.parse(rawData);
          applyResult(data);
          incrementStat('seoOptimized');
          logActivity(`Created high-CTR SEO package for "${topicToUse}"`, "SEO Optimizer", "seo");
        } catch (e) {
          console.error(e);
          toast.error("SEO generation failed. Please test another prompt.");
          throw e;
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleGeoOptimize = async (manualTopic?: string) => {
    const topicToUse = manualTopic || geoTopic;
    if (!topicToUse.trim()) return;

    setGeoResult(null);
    const taskName = `GEO & AEO Schema: "${topicToUse}"`;

    TaskScheduler.scheduleTask({
      name: taskName,
      type: 'seo_crawl',
      duration: 10,
      priority: 'low',
      onRun: async () => {
        setGeoLoading(true);
        try {
          const rawData = await generateGeoAeo(topicToUse);
          // Validate dynamic layout structure strictly with Zod
          const data = geoAeoResultSchema.parse(rawData);
          setGeoResult(data);
          incrementStat('seoOptimized');
          logActivity(`Generated Advanced GEO & AEO Schema models for "${topicToUse}"`, "GEO Optimizer", "seo");
          toast.success("Omni-Channel structured data compilation complete!");
        } catch (e) {
          console.error(e);
          toast.error("Generative GEO / AEO failed. Re-initiating with cached references.");
          // Render fallback or template so user has something working
          injectGeoBlueprint(GEO_AEO_BLUEPRINTS[0]);
          throw e;
        } finally {
          setGeoLoading(false);
        }
      }
    });
  };

  const applyResult = (data: SeoResult) => {
    let finalDescription = data.description;
    const socialsPart = includeSocials && socialHandles.filter(s => s.label && s.url).length > 0
      ? "\n\n🔗 CONNECT WITH US\n" + socialHandles.map(s => `${s.label}: ${s.url}`).join('\n')
      : "";
    const playlistsPart = includePlaylists && playlists.filter(p => p.label && p.url).length > 0
      ? "\n\n📺 RECOMMENDED PLAYLISTS\n" + playlists.map(p => `${p.label}: ${p.url}`).join('\n')
      : "";
    finalDescription += socialsPart + playlistsPart;
    setResult({ ...data, description: finalDescription });
  };

  const injectBlueprint = (bp: typeof SEO_BLUEPRINTS[0]) => {
    setTopic(bp.topic);
    applyResult(bp.data);
  };

  const injectGeoBlueprint = (bp: typeof GEO_AEO_BLUEPRINTS[0]) => {
    setGeoTopic(bp.topic);
    setGeoResult(bp.data);
  };

  const copyToClipboard = (text: string, label: string = "Value") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadFile = (fileName: string, content: string, fileType: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileName} successfully!`);
  };

  const copyForStudio = () => {
    if (!result) return;
    const text = `--- YOUTUBE STUDIO MANIFEST ---\n\nTITLE:\n${result.titles[0]}\n\nDESCRIPTION:\n${result.description}\n\nTAGS:\n${result.tags.join(', ')}\n\nHASHTAGS:\n${result.hashtags.join(' ')}\n`;
    copyToClipboard(text, "YouTube Manifest");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 relative">
      
      {/* Upper Navigation & Slogan */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'youtube'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Youtube size={14} className={activeTab === 'youtube' ? 'text-white' : 'text-zinc-500'} />
            YouTube SEO Studio
          </button>
          
          <button
            onClick={() => setActiveTab('geo-aeo')}
            className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'geo-aeo'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Brain size={14} className={activeTab === 'geo-aeo' ? 'text-white font-bold animate-pulse' : 'text-zinc-500'} />
            GEO & AEO Search Intelligence
          </button>
        </div>

        <h2 className="text-5xl font-black bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent tracking-tighter">
          {activeTab === 'youtube' ? 'SEO Vision Studio' : 'GEO & AEO AI Suite'}
        </h2>
        <p className="text-zinc-400 text-base font-medium max-w-2xl mx-auto">
          {activeTab === 'youtube' 
            ? "Map your brand to Google's YouTube Knowledge Graph with high-fidelity semantic metadata engineered for viral retention."
            : "Optimize for generative search crawlers and conversational engines (ChatGPT, Google Gemini) using custom structured schema markups and entities."
          }
        </p>
      </div>

      {activeTab === 'youtube' ? (
        /* YouTube Studio Section */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Viral Blueprints</h3>
                   <Award size={16} className="text-orange-500" />
                </div>
                
                <div className="space-y-3">
                   {SEO_BLUEPRINTS.map((bp, i) => (
                      <button 
                         type="button"
                         key={i} 
                         onClick={() => injectBlueprint(bp)}
                         className="w-full text-left p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Niche Optimized</span>
                            <ChevronRight size={12} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />
                         </div>
                         <p className="text-xs font-bold text-zinc-400 truncate">{bp.topic}</p>
                      </button>
                   ))}
                </div>

                <div className="w-full h-px bg-zinc-800" />

                <LinkEditor 
                  title="Social Profiles" 
                  icon={Share2}
                  items={socialHandles} 
                  setItems={setSocialHandles} 
                  limit={5} 
                />

                <div className="space-y-3">
                   <button
                     type="button"
                     onClick={() => setIncludeSocials(!includeSocials)}
                     className="flex items-center gap-3 w-full group text-left cursor-pointer"
                   >
                      <div className={`w-10 h-5 rounded-full transition-all relative ${includeSocials ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${includeSocials ? 'right-1' : 'left-grow'}`} style={{ left: includeSocials ? 'unset' : '4px' }} />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Append Socials</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setIncludePlaylists(!includePlaylists)}
                     className="flex items-center gap-3 w-full group text-left cursor-pointer"
                   >
                      <div className={`w-10 h-5 rounded-full transition-all relative ${includePlaylists ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                         <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${includePlaylists ? 'right-1' : 'left-grow'}`} style={{ left: includePlaylists ? 'unset' : '4px' }} />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Append Playlists</span>
                   </button>
                </div>
             </div>

             <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-[2rem] flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0">
                   <Layers size={21} />
                </div>
                <div>
                   <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Knowledge Linkage</h4>
                   <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                     "Semantic clusters provide rich context to the query recommendation algorithm before publishing."
                   </p>
                </div>
             </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
             <form onSubmit={(e) => { e.preventDefault(); handleOptimize(); }} className="relative group">
               <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity" />
               <div className="relative flex gap-3 p-2 bg-zinc-900 border border-zinc-805 rounded-[2.5rem] shadow-2xl focus-within:border-blue-500/50 transition-all">
                 <div className="flex items-center pl-6 text-zinc-500">
                    <Globe size={18} />
                 </div>
                 <input
                   type="text"
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                   placeholder="Enter video topic, theme context, or primary keywords..."
                   className="flex-1 bg-transparent border-none py-6 outline-none text-white font-medium text-lg placeholder:text-zinc-700"
                 />
                 <button
                   type="submit"
                   disabled={loading || !topic}
                   className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active-press mr-1 cursor-pointer"
                 >
                   {loading ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} fill="currentColor" /> Optimize</>}
                 </button>
               </div>
             </form>

             <div className="flex flex-wrap items-center justify-center gap-2 px-4">
                <span className="text-[10px] font-black text-zinc-705 uppercase tracking-widest mr-2 text-zinc-600">Featured Topics:</span>
                {SUGGESTED_TOPICS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTopic(t); handleOptimize(t); }}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                  >
                    {t}
                  </button>
                ))}
             </div>

             {loading && !result && (
                <div className="flex flex-col items-center justify-center py-40 gap-8 text-blue-500 animate-fade-in">
                   <div className="relative">
                     <Loader2 className="animate-spin w-20 h-20" strokeWidth={1} />
                     <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse" />
                   </div>
                   <div className="text-center space-y-2">
                     <p className="text-xl font-black text-white tracking-tight animate-pulse uppercase">Semantic Synthesis</p>
                     <p className="text-xs text-zinc-650 font-bold tracking-[0.3em] uppercase">Aligning with Knowledge Graph</p>
                   </div>
                </div>
             )}

             {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-scale-in">
                   <div className="md:col-span-2">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 animate-pulse">
                                  <FileText size={24} />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-black text-white">Viral Manifest</h3>
                                  <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Optimized for 2025/2026 YouTube CTR</p>
                               </div>
                            </div>
                            <button 
                              type="button"
                              onClick={copyForStudio}
                              className={`flex items-center gap-3 text-[10px] font-black uppercase transition-all px-8 py-3 rounded-2xl border-2 cursor-pointer ${copiedAll ? 'bg-green-600 border-green-500 text-white' : 'bg-white border-white text-black hover:bg-zinc-200'}`}
                            >
                               {copiedAll ? <CheckCircle2 size={16} /> : <Zap size={16} fill="currentColor" />}
                               {copiedAll ? 'Ready for Studio' : 'Clone for YouTube Studio'}
                            </button>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-1 space-y-8">
                               <div>
                                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-4 ml-1 flex items-center gap-2">
                                    <Flame size={12} className="text-orange-500" /> High-CTR Titles
                                  </label>
                                  <div className="space-y-3">
                                     {result.titles.map((t, i) => (
                                        <div key={i} className="group flex gap-4 bg-zinc-950 border border-zinc-805 p-4 rounded-2xl hover:border-blue-500/50 transition-all">
                                           <span className="text-xs font-black text-zinc-850 group-hover:text-blue-500 transition-colors">{i+1}</span>
                                           <p className="text-sm font-bold text-zinc-300 flex-1 leading-snug text-left">{t}</p>
                                           <button type="button" onClick={() => {copyToClipboard(t, "Title")}} className="text-zinc-650 hover:text-white cursor-pointer"><Copy size={12}/></button>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                               
                               <div>
                                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-4 ml-1 flex items-center gap-2">
                                    <Brain size={12} className="text-blue-550 text-blue-400" /> Neural Clusters
                                  </label>
                                  <div className="bg-zinc-955 bg-zinc-950/70 border border-zinc-800 p-6 rounded-3xl space-y-4 text-left">
                                     <div className="flex flex-wrap gap-2">
                                        {result.semanticClusters.map((c, i) => (
                                           <span key={i} className="px-3 py-1.5 bg-blue-900/10 text-blue-450 text-blue-450 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-default">
                                              {c}
                                           </span>
                                        ))}
                                     </div>
                                     <div className="pt-4 border-t border-zinc-800/80">
                                        <div className="flex justify-between items-center mb-1">
                                           <span className="text-[9px] font-black text-zinc-600 uppercase">Algorithmic Match</span>
                                           <span className="text-[9px] font-black text-green-500 uppercase">98.4% Accuracy</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                           <div className="h-full bg-green-500 w-[98%] animate-pulse" />
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="lg:col-span-2 space-y-4 text-left">
                               <div className="flex items-center justify-between ml-1">
                                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Semantic Description</label>
                                  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">{result.description.length} CHARS • {result.description.split(' ').length} WORDS</span>
                               </div>
                               <div className="bg-zinc-950 border border-zinc-805 rounded-[2rem] p-8 h-[500px] overflow-y-auto custom-scrollbar shadow-inner relative group/desc">
                                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-400 font-medium whitespace-pre-wrap">
                                     {result.description}
                                  </pre>
                                  <button 
                                    type="button"
                                    onClick={() => {copyToClipboard(result.description, "Description")}}
                                    className="absolute top-4 right-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-white opacity-0 group-hover/desc:opacity-100 transition-all shadow-2xl active-press cursor-pointer"
                                  >
                                     <Copy size={20} />
                                  </button>
                                  <div className="absolute bottom-4 right-4 bg-zinc-90 w-fit900/85 px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-black text-blue-500 uppercase tracking-widest backdrop-blur-md">
                                     SEO Density: Optimized
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Tags & Hashtags */}
                   <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl group/tags text-left">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Layout size={16} className="text-zinc-550 text-zinc-500" /> Discovery Index (Tags)
                         </h3>
                         <button type="button" onClick={() => {copyToClipboard(result.tags.join(', '), "Tags")}} className="text-[10px] font-bold text-zinc-550 hover:text-white flex items-center gap-2 cursor-pointer">
                            <Copy size={12} /> Copy Manifest
                         </button>
                      </div>
                      <div className="flex flex-wrap gap-2 animate-scale-in">
                         {result.tags.map((tag, i) => (
                            <span key={i} className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-[11px] text-zinc-400 hover:text-white hover:border-zinc-650 transition-all cursor-default">
                               {tag}
                            </span>
                         ))}
                      </div>
                   </div>

                   <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl text-left">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Hash size={16} className="text-zinc-500" /> Viral Anchors (Hashtags)
                         </h3>
                         <button type="button" onClick={() => {copyToClipboard(result.hashtags.join(' '), "Hashtags")}} className="text-[10px] font-bold text-zinc-500 hover:text-white flex items-center gap-2 cursor-pointer">
                            <Copy size={12} /> Copy Manifest
                         </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {result.hashtags.map((h, i) => (
                            <span key={i} className="text-lg font-black text-blue-500 hover:scale-110 transition-transform cursor-pointer">
                               #{h.replace(/^#/, '')}
                            </span>
                         ))}
                      </div>
                   </div>
                </div>
             )}

             {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-800 gap-8 opacity-45">
                   <div className="w-48 h-48 rounded-[3.5rem] border-4 border-dashed border-zinc-900 flex items-center justify-center select-none">
                      <Search size={80} strokeWidth={1} />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="font-black uppercase tracking-[0.4em] text-sm text-zinc-500">Vision Engine Dormant</p>
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Define target topic to synthesize semantic manifest</p>
                   </div>
                </div>
             )}
          </div>
        </div>
      ) : (
        /* GEO & AEO ADVANCED SEARCH ARCHITECT SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Controls & Presets panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">GEO Pre-seeds</h3>
                 <Sparkles size={16} className="text-purple-400 animate-pulse" />
              </div>
              
              <div className="space-y-3">
                 {GEO_AEO_BLUEPRINTS.map((bp, i) => (
                    <button 
                       type="button"
                       key={i} 
                       onClick={() => injectGeoBlueprint(bp)}
                       className="w-full text-left p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-purple-500/50 transition-all group cursor-pointer"
                    >
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Full KG Map</span>
                          <ChevronRight size={12} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />
                       </div>
                       <p className="text-xs font-bold text-zinc-400 truncate">{bp.topic}</p>
                    </button>
                 ))}
              </div>

              <div className="w-full h-px bg-zinc-800" />
              
              <div className="p-4 rounded-xl bg-purple-950/15 border border-purple-500/10 text-left space-y-2">
                <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
                  <Cpu size={10} /> Machine Grounding
                </span>
                <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                  Generative engines crawl schema markups directly to anchor answer models. Generating structured JSON-LD mitigates misattribution risk.
                </p>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 p-6 rounded-[2rem] flex items-start gap-4 text-left">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-450 text-purple-400 shrink-0">
                 <TrendingUp size={18} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">AEO Citation Loop</h4>
                 <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                   Include the uniqueness differentiator to elevate source pick confidence in multi-model generation.
                 </p>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-3 space-y-8 text-left">
            
            {/* Input form */}
            <form onSubmit={(e) => { e.preventDefault(); handleGeoOptimize(); }} className="relative group">
              <div className="absolute inset-0 bg-purple-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity" />
              <div className="relative flex gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl focus-within:border-purple-500/50 transition-all">
                <div className="flex items-center pl-6 text-zinc-500">
                   <Globe size={18} className="text-purple-400" />
                </div>
                <input
                  type="text"
                  value={geoTopic}
                  onChange={(e) => setGeoTopic(e.target.value)}
                  placeholder="Enter website URL context, organization niche, or brand keyword blueprint..."
                  className="flex-1 bg-transparent border-none py-6 outline-none text-white font-medium text-lg placeholder:text-zinc-700 font-sans"
                />
                <button
                  type="submit"
                  disabled={geoLoading || !geoTopic}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 active-press mr-1 cursor-pointer"
                >
                  {geoLoading ? <Loader2 className="animate-spin" size={18} /> : <><Cpu size={18} /> Build GEO Engine</>}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 px-4">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2 select-none">AI Target Domains:</span>
               <button
                 type="button"
                 onClick={() => { setGeoTopic("Ranktica AI Creative Agency Engine"); handleGeoOptimize("Ranktica AI Creative Agency Engine"); }}
                 className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 transition-all"
               >
                 Ranktica Agency
               </button>
               <button
                 type="button"
                 onClick={() => { setGeoTopic("Generative Engine Optimization (GEO) 2026 Manual"); handleGeoOptimize("Generative Engine Optimization (GEO) 2026 Manual"); }}
                 className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 transition-all"
               >
                 GEO 2026 Strategy
               </button>
               <button
                 type="button"
                 onClick={() => { setGeoTopic("Answer Engine Optimization (AEO) Consulting Services"); handleGeoOptimize("Answer Engine Optimization (AEO) Consulting Services"); }}
                 className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 transition-all"
               >
                 AEO Consulting
               </button>
            </div>

            {geoLoading && !geoResult && (
               <div className="flex flex-col items-center justify-center py-40 gap-8 text-purple-500 animate-fade-in">
                  <div className="relative">
                    <Loader2 className="animate-spin w-20 h-20" strokeWidth={1} />
                    <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-10 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black text-white tracking-tight animate-pulse uppercase">Building Semantic Entity Graph</p>
                    <p className="text-xs text-zinc-650 font-bold tracking-[0.3em] uppercase">Synthesized schemas & metadata engine loading...</p>
                  </div>
               </div>
            )}

            {geoResult && (
              <div className="space-y-6 animate-scale-in">
                
                {/* Visual sub-category navigation */}
                <div className="flex flex-wrap gap-2 border-b border-zinc-800/80 pb-3">
                  <button
                    type="button"
                    onClick={() => setGeoSubTab('meta')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      geoSubTab === 'meta'
                        ? 'bg-purple-650/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Eye size={14} /> Page Metadata Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoSubTab('schemas')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      geoSubTab === 'schemas'
                        ? 'bg-purple-650/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Code size={14} /> Schema.org Structured Markup
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoSubTab('intelligent')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      geoSubTab === 'intelligent'
                        ? 'bg-purple-650/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Network size={14} /> GEO & AEO Insights
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoSubTab('feeds')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      geoSubTab === 'feeds'
                        ? 'bg-purple-650/20 text-purple-400 border border-purple-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <FileCode size={14} /> Crawl Feeds & Files
                  </button>
                </div>

                {/* Sub Tab Panel 1: Page Metadata Tags */}
                {geoSubTab === 'meta' && (
                  <div className="space-y-6">
                    {/* SERP Search Preview */}
                    <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-[2rem] shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Google SERP Impression Simulation</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-750 bg-red-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-750 bg-yellow-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-750 bg-green-400" />
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <Globe size={11} className="text-zinc-500" />
                          <span>https://yourdomain.com &gt; suite &gt; geo-aeo</span>
                        </div>
                        <h4 className="text-lg font-bold text-[#8ab4f8] hover:underline cursor-pointer leading-tight font-sans">
                          {geoResult.metaTags.title}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                          <span className="text-green-500/90 font-bold select-none mr-1">2026 —</span>
                          {geoResult.metaTags.description}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Table Grid */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Settings size={12} /> Live Header Meta Tags
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const rawBlock = `\n<title>${geoResult.metaTags.title}</title>\n<meta name="description" content="${geoResult.metaTags.description}" />\n<meta name="robots" content="${geoResult.metaTags.robots}" />\n<meta property="og:title" content="${geoResult.metaTags.ogTitle}" />\n<meta property="og:description" content="${geoResult.metaTags.ogDescription}" />\n<meta property="og:image" content="${geoResult.metaTags.ogImage}" />\n<meta name="twitter:card" content="${geoResult.metaTags.twitterCard}" />\n`;
                            copyToClipboard(rawBlock, "Meta Block");
                          }}
                          className="px-4 py-1.5 bg-zinc-950/80 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy size={12} /> Copy Full Header Block
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Meta title */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;title&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.title}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<title>${geoResult.metaTags.title}</title>`, "Title tag")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-450 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* Meta description */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta name="description"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.description}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta name="description" content="${geoResult.metaTags.description}" />`, "Description tag")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* Meta robots */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta name="robots"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.robots}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta name="robots" content="${geoResult.metaTags.robots}" />`, "Robots tag")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* og:title */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta property="og:title"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.ogTitle}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta property="og:title" content="${geoResult.metaTags.ogTitle}" />`, "OG tag")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* og:description */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta property="og:description"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.ogDescription}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta property="og:description" content="${geoResult.metaTags.ogDescription}" />`, "OG Desc")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* og:image */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta property="og:image"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.ogImage}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta property="og:image" content="${geoResult.metaTags.ogImage}" />`, "OG Image")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                        {/* twitter:card */}
                        <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-widest">&lt;meta name="twitter:card"&gt;</span>
                            <span className="text-xs text-white block truncate max-w-[400px] mt-0.5">{geoResult.metaTags.twitterCard}</span>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(`<meta name="twitter:card" content="${geoResult.metaTags.twitterCard}" />`, "Twitter tag")} className="p-2 border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer">
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel 2: Schema.org Markups */}
                {geoSubTab === 'schemas' && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                      <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-widest leading-none">Active Schemas</span>
                      <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                        Toggle different types of Schema.org JSON-LD markups generated for indexation.
                      </p>
                      
                      <div className="flex flex-col gap-1.5">
                        {(Object.keys(geoResult.schemas) as Array<keyof GeoAeoResult['schemas']>).map((key) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => setSelectedSchemaKey(key)}
                            className={`w-full px-4 py-2.5 rounded-xl border text-left text-xs font-black uppercase tracking-wider transition-all gap-2 flex items-center ${
                              selectedSchemaKey === key
                                ? 'bg-purple-600/10 border-purple-500/40 text-purple-400'
                                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                            }`}
                          >
                            <Code size={11} /> {key}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                          <Cpu size={14} className="text-purple-400" /> JSON-LD &lt;script&gt; Package
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`<script type="application/ld+json">\n${geoResult.schemas[selectedSchemaKey]}\n</script>`, "JSON-LD")}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy size={12} /> Copy Code
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFile(`${selectedSchemaKey}_schema.jsonld`, `<script type="application/ld+json">\n${geoResult.schemas[selectedSchemaKey]}\n</script>`, "application/ld+json")}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download size={12} /> Download Code
                          </button>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 h-[480px] overflow-y-auto custom-scrollbar shadow-inner text-left font-mono text-[11px] leading-relaxed text-zinc-400 relative">
                        <pre className="whitespace-pre">
                          {`<!-- Schema.org ${selectedSchemaKey.toUpperCase()} Structured Data Markup -->\n<script type="application/ld+json">\n${geoResult.schemas[selectedSchemaKey]}\n</script>`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel 3: GEO/AEO Intelligent Analysis */}
                {geoSubTab === 'intelligent' && (
                  <div className="space-y-8">
                    
                    {/* Entity Extraction & Graph visualizer preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-8 shadow-2xl space-y-4 text-left">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Cpu size={14} className="text-purple-400" /> Extracted Node Entities
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                          Entity prominence matching for primary indexing. Semantic models index these explicitly to verify database connectivity.
                        </p>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                          {geoResult.entities.map((ent, idx) => (
                            <div key={idx} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-4">
                              <div>
                                <span className="text-xs font-bold text-white tracking-tight">{ent.name}</span>
                                <div className="flex gap-1.5 items-center mt-1">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-purple-400 bg-purple-900/10 px-1.5 py-0.5 rounded">
                                    {ent.type}
                                  </span>
                                  <span className="text-[8px] text-zinc-650 text-zinc-500 uppercase">
                                    Connects: {ent.connectivity.slice(0, 2).join(', ')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-mono font-black text-white block">{ent.weight}%</span>
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Weight</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Knowledge Graph interactive node simulation */}
                      <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-8 shadow-2xl space-y-4 flex flex-col justify-between">
                        <div className="text-left space-y-1">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Network size={14} className="text-purple-400" /> Semantic Knowledge Graph Simulation
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                            How generative models chart entity clusters. Interconnected nodes represent active synaptic pathing.
                          </p>
                        </div>

                        {/* Interactive Graph Drawing via badges */}
                        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-850 h-[220px] relative flex flex-col items-center justify-center gap-6 overflow-hidden">
                          {/* Visual connections list */}
                          <div className="animate-pulse absolute top-3 right-3 shrink-0 flex items-center gap-1.5 p-1 px-2.5 rounded bg-purple-500/15 border border-purple-500/30 text-[8px] font-black uppercase tracking-widest text-purple-400">
                            <Sparkles size={10} /> Active Graph Links Verified
                          </div>

                          <div className="flex justify-around items-center w-full relative z-10">
                            {geoResult.knowledgeGraphNodes.map((node, idx) => (
                              <div key={idx} className="p-3 bg-zinc-900 border-2 border-purple-500/40 hover:border-purple-400 rounded-xl flex flex-col items-center gap-1.5 text-center min-w-[100px] shadow-lg shadow-purple-500/5 hover:scale-105 transition-all">
                                <span className="h-5 w-5 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-[10px] font-black select-none border border-purple-400">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-black text-white leading-none whitespace-nowrap">{node.label}</span>
                                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">{node.group}</span>
                              </div>
                            ))}
                          </div>

                          {/* Beautiful edge arrows */}
                          <div className="grid grid-cols-2 gap-4 w-full px-6 text-center text-zinc-650">
                            {geoResult.knowledgeGraphEdges.map((edge, idx) => (
                              <div key={idx} className="flex flex-col items-center justify-center gap-0.5">
                                <span className="text-[8px] font-black text-purple-400/80 uppercase tracking-widest">
                                  "{edge.label}"
                                </span>
                                <span className="text-[9px] font-semibold text-zinc-500 truncate max-w-[100px]">
                                  {edge.from} &rarr; {edge.to}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AEO Conversational chunk optimization */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden text-left">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-zinc-800 pb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-600/10 rounded-2xl text-purple-400">
                            <BookOpen size={21} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">AEO Conversational Synthesis Model</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Direct ingest chunk optimized for conversational summaries</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(geoResult.conversationalResponse, "AEO Ingest Chunk")}
                          className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <Copy size={12} /> Copy Conversational Source
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Conversational Source Paragraph</label>
                          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-850 relative group/aeo-desc text-left">
                            <p className="text-zinc-350 text-sm leading-relaxed font-semibold">
                              {geoResult.conversationalResponse}
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-1 space-y-4">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Voice Search Query Seeds</label>
                          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-3">
                            {geoResult.aeoKeywords.map((kw, i) => (
                              <div key={i} className="flex gap-2 items-center p-2 rounded-lg bg-zinc-900 border border-zinc-850">
                                <Search size={11} className="text-purple-400 shrink-0" />
                                <span className="text-[11px] font-bold text-zinc-400 select-all truncate">{kw}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Citation Optimization section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl text-left grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-1 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block leading-none">Authority Confidence</label>
                          <span className="text-emerald-500 font-mono text-[10px] font-black uppercase">{geoResult.citationOptimization.brandAuthorityScore}% API Rating</span>
                        </div>
                        
                        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-850 text-center space-y-2">
                          <div className="text-3xl font-mono text-white font-bold tracking-tight">
                            {geoResult.citationOptimization.brandAuthorityScore} / 100
                          </div>
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Estimated Citation Recommender Score</span>
                          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: `${geoResult.citationOptimization.brandAuthorityScore}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-1 space-y-4">
                        <label className="text-[10px] font-black text-zinc-405 uppercase tracking-widest block leading-none text-zinc-400">Contextual Co-Mentions</label>
                        <div className="space-y-2">
                          {geoResult.citationOptimization.recommendedCoMentions.map((co, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-purple-950/10 border border-purple-550/20 text-purple-450 border-purple-500/20 text-xs text-purple-400 font-bold flex items-center gap-2">
                              <Check size={12} className="text-purple-450" />
                              <span>{co}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-1 space-y-4">
                        <label className="text-[10px] font-black text-zinc-405 uppercase tracking-widest block leading-none text-zinc-400">Citation Backlink Strategy</label>
                        <p className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-[10.5px] leading-relaxed text-zinc-500 font-semibold italic">
                          "{geoResult.citationOptimization.citationBacklinkBlueprint}"
                        </p>
                      </div>
                    </div>

                    {/* FAQ Generative Snippet optimizations */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl text-left space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <ListChecks size={16} className="text-purple-400" /> Snippet FAQ Answer Optimization
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                        Highly targeted Q&A pairs. Formative structures here elevate snippet retrieve priority on high-intent voice queries.
                      </p>

                      <div className="space-y-4">
                        {geoResult.faqList.map((faq, index) => (
                          <div key={index} className="p-5 rounded-2xl bg-zinc-955 bg-zinc-950 border border-zinc-850 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-white flex items-center gap-2">
                                <span className="h-4 w-4 rounded bg-purple-500/10 text-purple-400 text-[10px] flex items-center justify-center font-bold">Q</span>
                                {faq.question}
                              </span>
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-900/10 px-2 py-0.5 rounded tracking-wider">
                                Snippet Match: {faq.optimizationScore}%
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-400 font-medium pl-6">
                              {faq.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub Tab Panel 4: Search XML Feeds & Spiders */}
                {geoSubTab === 'feeds' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* sitemap.xml */}
                    <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-6 shadow-xl space-y-4 text-left flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5 leading-none">
                          <Code size={12} /> sitemap.xml
                        </span>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-normal">
                          Configures the index tree layout and schedules priority crawl rates.
                        </p>
                      </div>
                      
                      <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-850 font-mono text-[9px] text-zinc-500 h-[220px] overflow-y-auto custom-scrollbar whitespace-pre shadow-inner mt-4">
                        {geoResult.sitemapXml}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(geoResult.sitemapXml, "Sitemap.xml")}
                          className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-zinc-400"
                        >
                          <Copy size={11} /> Copy Code
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile("sitemap.xml", geoResult.sitemapXml, "application/xml")}
                          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
                          title="Download sitemap.xml"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </div>

                    {/* robots.txt */}
                    <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-6 shadow-xl space-y-4 text-left flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5 leading-none">
                          <Settings size={12} /> robots.txt
                        </span>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-normal">
                          Authorizes spider crawlers and establishes custom disallows to control aggressive AI scrapers.
                        </p>
                      </div>

                      <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-850 font-mono text-[9px] text-zinc-500 h-[220px] overflow-y-auto custom-scrollbar whitespace-pre shadow-inner mt-4">
                        {geoResult.robotsTxt}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(geoResult.robotsTxt, "Robots.txt")}
                          className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-zinc-400"
                        >
                          <Copy size={11} /> Copy Code
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile("robots.txt", geoResult.robotsTxt, "text/plain")}
                          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
                          title="Download robots.txt"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </div>

                    {/* rss.xml */}
                    <div className="bg-zinc-900 border border-zinc-850 rounded-[2.5rem] p-6 shadow-xl space-y-4 text-left flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5 leading-none">
                          <Rss size={12} /> rss.xml feed
                        </span>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-normal">
                          Valid RSS 2.0 XML channel configuration to syndicate contents inside feeder repositories.
                        </p>
                      </div>

                      <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-850 font-mono text-[9px] text-zinc-500 h-[220px] overflow-y-auto custom-scrollbar whitespace-pre shadow-inner mt-4">
                        {geoResult.rssXml}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(geoResult.rssXml, "Rss.xml feed")}
                          className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-zinc-400"
                        >
                          <Copy size={11} /> Copy Code
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile("rss.xml", geoResult.rssXml, "application/xml")}
                          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
                          title="Download rss.xml"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {!geoResult && !geoLoading && (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-800 gap-8 opacity-45">
                 <div className="w-48 h-48 rounded-[3.5rem] border-4 border-dashed border-zinc-900 flex items-center justify-center select-none">
                    <Brain size={80} strokeWidth={1} className="text-purple-500 animate-pulse" />
                 </div>
                 <div className="text-center space-y-2">
                    <p className="font-black uppercase tracking-[0.4em] text-sm text-zinc-500">Search intelligence Engine Dormant</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Enter optimization topic to synthesize schemas, node entities and citation weights</p>
                 </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
