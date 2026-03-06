
import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Settings, Grid, X, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

interface GoogleSearchSimProps {
  onSelectResult: () => void;
}

const GoogleSearchSim: React.FC<GoogleSearchSimProps> = ({ onSelectResult }) => {
  const [isClicking, setIsClicking] = useState(false);

  const handleResultClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsClicking(true);
    setTimeout(() => {
      onSelectResult();
    }, 600);
  };

  return (
    <div className={`min-h-screen bg-[#202124] text-[#bdc1c6] font-sans transition-all duration-700 ${isClicking ? 'opacity-0 scale-105 filter blur-xl' : 'opacity-100 scale-100'}`}>
      {/* Search Header */}
      <header className="border-b border-[#3c4043] sticky top-0 bg-[#202124] z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-8 w-full md:w-auto">
            <span className="text-2xl font-bold tracking-tight text-white flex gap-0.5">
              <span className="text-[#4285f4]">G</span>
              <span className="text-[#ea4335]">o</span>
              <span className="text-[#fbbc05]">o</span>
              <span className="text-[#4285f4]">g</span>
              <span className="text-[#34a853]">l</span>
              <span className="text-[#ea4335]">e</span>
            </span>
            <div className="flex-1 max-w-[692px] relative group">
              <div className="w-full bg-[#303134] hover:bg-[#3c4043] border border-transparent focus-within:bg-[#303134] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] rounded-full h-11 flex items-center px-4 transition-all">
                <Search size={18} className="text-[#9aa0a6] mr-3" />
                <input 
                  readOnly 
                  value="champ ai" 
                  className="bg-transparent flex-1 outline-none text-white text-sm font-medium" 
                />
                <X size={18} className="text-[#9aa0a6] cursor-pointer hover:text-white" />
                <div className="h-6 w-px bg-[#3c4043] mx-3"></div>
                <Search size={18} className="text-[#4285f4] cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <Settings size={20} className="text-[#9aa0a6] cursor-pointer" />
            <Grid size={20} className="text-[#9aa0a6] cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-[#8ab4f8] text-[#202124] flex items-center justify-center font-bold text-sm cursor-pointer">D</div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-[170px] flex gap-8 text-sm">
          <div className="border-b-2 border-[#8ab4f8] text-[#8ab4f8] pb-3 flex items-center gap-1.5 cursor-pointer font-medium">
            <Search size={16} /> All
          </div>
          <div className="pb-3 text-[#9aa0a6] hover:text-white cursor-pointer transition-colors">Images</div>
          <div className="pb-3 text-[#9aa0a6] hover:text-white cursor-pointer transition-colors">News</div>
          <div className="pb-3 text-[#9aa0a6] hover:text-white cursor-pointer transition-colors">Videos</div>
          <div className="pb-3 text-[#9aa0a6] hover:text-white cursor-pointer transition-colors">Maps</div>
        </div>
      </header>

      {/* Results Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-[170px] py-8">
        <p className="text-sm text-[#9aa0a6] mb-8">About 1,240,000,000 results (0.42 seconds) </p>

        {/* The Champ AI Result */}
        <div className="mb-10 max-w-[652px] group">
          <a 
            href="https://www.champai.com" 
            onClick={handleResultClick}
            className="block cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-1 shadow-sm border border-[#3c4043]">
                 <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-full h-full">
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <cite className="text-sm text-[#dadce0] not-italic font-medium">Champ AI</cite>
                <div className="text-xs text-[#9aa0a6] flex items-center gap-1">
                  https://www.champai.com <MoreVertical size={12} />
                </div>
              </div>
            </div>
            <h3 className="text-[20px] leading-[1.3] text-[#8ab4f8] group-hover:underline font-medium mb-1">
              Champ AI | The Premier Intelligence Workspace
            </h3>
          </a>
          <p className="text-sm text-[#bdc1c6] leading-[1.58] mb-2">
            Build your future with <b>Champ AI</b>. Now available on <b>Google Play Store</b> and <b>Apple App Store</b>. An elite, high-performance workspace at <b>www.champai.com</b> built for creators and visionaries. Featuring advanced generative tools, deep reasoning, and cinematic rendering...
          </p>
          <div className="flex gap-6 mt-3 text-sm text-[#8ab4f8]">
            <span className="hover:underline cursor-pointer">Login to Workspace</span>
            <span className="hover:underline cursor-pointer">Download on App Store</span>
            <span className="hover:underline cursor-pointer">Get it on Play Store</span>
            <span className="hover:underline cursor-pointer">About Daksh Jagatiya</span>
          </div>
        </div>

        {/* Sitelinks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-[652px] mb-12 ml-4 border-l-2 border-[#3c4043] pl-6">
          <div className="group cursor-pointer" onClick={handleResultClick}>
            <h4 className="text-[#8ab4f8] group-hover:underline font-medium">Dashboard</h4>
            <p className="text-xs text-[#9aa0a6] mt-1">Access your persistent workspace and notebooks directly.</p>
          </div>
          <div className="group cursor-pointer" onClick={handleResultClick}>
            <h4 className="text-[#8ab4f8] group-hover:underline font-medium">High-End Rendering</h4>
            <p className="text-xs text-[#9aa0a6] mt-1">Generate 4K cinematic assets with our premier image model.</p>
          </div>
          <div className="group cursor-pointer" onClick={handleResultClick}>
            <h4 className="text-[#8ab4f8] group-hover:underline font-medium">Secure Auth</h4>
            <p className="text-xs text-[#9aa0a6] mt-1">End-to-end encrypted login protocols via Google and Safari.</p>
          </div>
          <div className="group cursor-pointer" onClick={handleResultClick}>
            <h4 className="text-[#8ab4f8] group-hover:underline font-medium">Mobile Apps</h4>
            <p className="text-xs text-[#9aa0a6] mt-1">Native experiences for iOS and Android devices.</p>
          </div>
        </div>

        {/* Related Searches */}
        <div className="border-t border-[#3c4043] pt-8 max-w-[652px]">
          <h3 className="text-[22px] text-white font-medium mb-6">People also ask</h3>
          <div className="space-y-4">
            <FaqItem question="What is the official website for Champ AI?" />
            <FaqItem question="Who is the creator of Champ AI?" />
            <FaqItem question="Is Champ AI safe for enterprise data?" />
          </div>
        </div>
      </main>

      {/* Floating Call to Action */}
      {!isClicking && (
        <div className="fixed bottom-8 right-8 animate-bounce">
          <button 
            onClick={handleResultClick}
            className="bg-[#8ab4f8] text-[#202124] px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-white transition-all scale-110"
          >
            Visit Champ AI <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const FaqItem = ({ question }: { question: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#3c4043] cursor-pointer hover:bg-[#303134] px-2 rounded-lg transition-colors group">
    <span className="text-sm font-medium group-hover:text-[#8ab4f8]">{question}</span>
    <ChevronRightSmall />
  </div>
);

const ChevronRightSmall = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default GoogleSearchSim;
