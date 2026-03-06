
import React from 'react';
import { Star, Download, Share, ChevronLeft, Shield, Zap, Globe, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Logo from './Logo';

interface AppStoreListingProps {
  onBack: () => void;
}

const AppStoreListing: React.FC<AppStoreListingProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* iOS Status Bar Simulation */}
      <div className="h-12 flex items-center justify-between px-8 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <span className="text-sm font-bold">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full border border-white/20"></div>
          <div className="w-4 h-4 rounded-full border border-white/20"></div>
          <div className="w-6 h-3 rounded-sm border border-white/20 relative">
            <div className="absolute inset-0.5 bg-white rounded-sm w-[80%]"></div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-6 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-1 text-blue-500 font-medium">
            <ChevronLeft size={24} />
            <span>Search</span>
          </button>
          <Share size={20} className="text-blue-500" />
        </div>

        {/* App Info Header */}
        <div className="flex gap-6 mb-10">
          <div className="w-32 h-32 rounded-[28%] bg-white p-0.5 shadow-2xl shrink-0 overflow-hidden">
            <Logo size="lg" showText={false} />
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Champ AI</h1>
              <p className="text-zinc-500 font-medium text-sm uppercase tracking-wider">Intelligence Workspace</p>
              <p className="text-zinc-600 text-xs mt-1">Daksh Jagatiya</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-1.5 rounded-full text-sm transition-colors">
                GET
              </button>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">In-App Purchases</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 py-4 border-y border-zinc-900 mb-10 overflow-x-auto scrollbar-hide">
          <StatItem label="4.9 ★" sub="12.4K RATINGS" />
          <StatItem label="12+" sub="AGE" />
          <StatItem label="#1" sub="PRODUCTIVITY" />
          <StatItem label="142 MB" sub="SIZE" />
        </div>

        {/* Screenshots */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide mb-12 -mx-6 px-6">
          <Screenshot src="https://picsum.photos/seed/champ1/600/1200" />
          <Screenshot src="https://picsum.photos/seed/champ2/600/1200" />
          <Screenshot src="https://picsum.photos/seed/champ3/600/1200" />
          <Screenshot src="https://picsum.photos/seed/champ4/600/1200" />
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">What's New</h2>
          <div className="flex justify-between items-center mb-4">
            <span className="text-zinc-500 text-sm">Version 2.5.0</span>
            <span className="text-zinc-500 text-sm">2d ago</span>
          </div>
          <p className="text-zinc-300 text-[15px] leading-relaxed">
            Introducing Champ AI Core 3.0. Experience lightning-fast reasoning, 4K image generation, and a completely redesigned workspace for visionaries.
          </p>
        </div>

        {/* Preview Section */}
        <div className="space-y-10">
          <FeatureRow 
            icon={<Zap className="text-yellow-400" />} 
            title="Instant Intelligence" 
            desc="Powered by Gemini 3.0 Pro for real-time complex reasoning." 
          />
          <FeatureRow 
            icon={<ImageIcon className="text-blue-400" />} 
            title="4K Art Generation" 
            desc="Render high-fidelity assets directly in your workspace." 
          />
          <FeatureRow 
            icon={<Shield className="text-emerald-400" />} 
            title="Privacy First" 
            desc="Your data is encrypted and stays yours. Always." 
          />
        </div>

        {/* Ratings */}
        <div className="mt-16 pt-10 border-t border-zinc-900">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold">Ratings & Reviews</h2>
            <button className="text-blue-500 text-sm font-medium">See All</button>
          </div>
          <div className="flex gap-8 items-center mb-10">
            <div className="text-center">
              <div className="text-5xl font-black mb-1">4.9</div>
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">OUT OF 5</div>
            </div>
            <div className="flex-1 space-y-1">
              <RatingBar width="95%" />
              <RatingBar width="3%" />
              <RatingBar width="1%" />
              <RatingBar width="0.5%" />
              <RatingBar width="0.5%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, sub }: { label: string, sub: string }) => (
  <div className="flex flex-col items-center text-center min-w-[80px]">
    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{sub}</span>
    <span className="text-zinc-200 font-bold text-lg">{label}</span>
  </div>
);

const Screenshot = ({ src }: { src: string }) => (
  <div className="w-64 aspect-[9/19.5] rounded-3xl overflow-hidden border border-zinc-800 shrink-0 bg-zinc-900 shadow-xl">
    <img src={src} alt="Screenshot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
  </div>
);

const FeatureRow = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-5">
    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const RatingBar = ({ width }: { width: string }) => (
  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
    <div className="h-full bg-zinc-600 rounded-full" style={{ width }}></div>
  </div>
);

export default AppStoreListing;
