
import React from 'react';
import { Sparkles, Brain, Video, ShieldCheck, Zap, Globe, Target, Repeat, Users, Terminal } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fade-in pb-20 pt-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-500/10 text-red-500 mb-2 border border-red-500/20">
           <Sparkles size={40} />
        </div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          The Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Autonomous</span> OS
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Ranktica AI isn't just a tool; it's a comprehensive suite designed to take you from a raw idea to a multi-platform content empire using state-of-the-art AI.
        </p>
      </section>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Brain size={120} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Gemini 3 Pro Intelligence</h3>
            <p className="text-zinc-400 leading-relaxed">
              We leverage Google's most advanced reasoning model to provide strategic market analysis, deep-thinking research, and high-retention scriptwriting that feels human.
            </p>
         </div>

         <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Video size={120} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Veo Visual Engine</h3>
            <p className="text-zinc-400 leading-relaxed">
              Generate 1080p high-fidelity video clips directly from text. Our Video Studio integrates cinematic generation with a timeline-based editor for seamless production.
            </p>
         </div>
      </div>

      {/* Unique Value Propositions */}
      <section className="space-y-8">
         <h2 className="text-3xl font-bold text-white text-center">Why Ranktica?</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck className="text-green-500" />, title: 'Built-in SEO Suite', desc: 'VidIQ and TubeBuddy features like Keyword Inspector and Channel Audits integrated directly.' },
              { icon: <Repeat className="text-blue-500" />, title: 'Omnichannel Engine', desc: 'Repurpose one video into Twitter threads, newsletters, blog posts, and TikTok scripts instantly.' },
              { icon: <Users className="text-purple-500" />, title: 'Outreach & Growth', desc: 'Find leads on LinkedIn, IG, and FB with automated search strategies and message templates.' },
              { icon: <Terminal className="text-orange-500" />, title: 'Dev Console', desc: 'Track API consumption, automation throughput, and technical ROI in a dedicated environment.' },
              { icon: <Globe className="text-cyan-500" />, title: 'Market Strategy', desc: 'Identify "Blue Ocean" gaps in any niche and build hyper-detailed customer personas.' },
              { icon: <Zap className="text-yellow-500" />, title: 'Live Brainstorming', desc: 'Speak directly to Ranktica AI in a low-latency voice conversation to refine your next big hit.' },
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:bg-zinc-800 transition-all">
                 <div className="mb-4">{item.icon}</div>
                 <h4 className="text-white font-bold mb-2">{item.title}</h4>
                 <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Vision Footer */}
      <section className="bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl p-10 text-center text-white shadow-2xl">
         <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
         <p className="max-w-2xl mx-auto opacity-90 font-medium">
           Content creation is shifting from manual labor to strategic orchestration. Ranktica AI provides the cockpit for creators to scale without burnout and for developers to automate the future of media.
         </p>
         <div className="mt-8 flex justify-center gap-4">
            <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">Established 2025</span>
            <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">Gemini Native</span>
         </div>
      </section>
    </div>
  );
};
