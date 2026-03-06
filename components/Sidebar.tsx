
import React from 'react';
import { BookText, Plus, Hash, Files, Settings, MessageSquare, Crown, Zap, Video } from 'lucide-react';
import Logo from './Logo';

interface SidebarProps {
  onNewChat: () => void;
  onUpgrade?: () => void;
  chats: { id: string, title: string, timestamp: string, mode?: string }[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  premiumTier: number;
  onAppMakerClick: () => void;
  isAppMakerMode: boolean;
  onVideoGeneratorClick: () => void;
  isVideoGeneratorMode: boolean;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onUpgrade, chats, currentChatId, onSelectChat, premiumTier, onAppMakerClick, isAppMakerMode, onVideoGeneratorClick, isVideoGeneratorMode, isOpen }) => {
  const filteredChats = chats.filter(chat => {
    const chatMode = chat.mode || 'normal';
    if (isAppMakerMode) return chatMode === 'app-maker';
    if (isVideoGeneratorMode) return chatMode === 'video-generator';
    return chatMode !== 'app-maker' && chatMode !== 'video-generator';
  });

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex shrink-0 transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        <Logo size="sm" />
      </div>

      <div className="px-3 mb-6">
        <button 
          onClick={onNewChat}
          className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
        >
          <Plus size={18} strokeWidth={3} />
          {isAppMakerMode ? 'New App Project' : isVideoGeneratorMode ? 'New Video Project' : 'New Notebook'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-6">
        <div>
          <h3 className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">My Library</h3>
          <div className="space-y-1">
            <SidebarItem 
              icon={<Zap size={18} className={isAppMakerMode ? "text-indigo-500" : ""}/>} 
              label="App Maker" 
              active={isAppMakerMode}
              onClick={onAppMakerClick}
            />
            <SidebarItem 
              icon={<Video size={18} className={isVideoGeneratorMode ? "text-pink-500" : ""}/>} 
              label="Video Generator" 
              active={isVideoGeneratorMode}
              onClick={onVideoGeneratorClick}
            />
          </div>
        </div>

        <div>
          <h3 className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            {isAppMakerMode ? 'App Projects' : isVideoGeneratorMode ? 'Video Projects' : 'Recent Chats'}
          </h3>
          <div className="space-y-1">
            {filteredChats.map(chat => (
              <SidebarItem 
                key={chat.id}
                icon={isAppMakerMode ? <Zap size={18} className="text-indigo-500"/> : isVideoGeneratorMode ? <Video size={18} className="text-pink-500"/> : <MessageSquare size={18}/>} 
                label={chat.title} 
                active={currentChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
              />
            ))}
            {filteredChats.length === 0 && (
              <p className="px-4 text-[10px] text-zinc-600 font-medium">
                {isAppMakerMode ? 'No app projects yet' : isVideoGeneratorMode ? 'No video projects yet' : 'No recent chats'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pro Upgrade Section */}
      <div className="p-3 mx-2 mb-2 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-black border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${premiumTier > 0 ? 'bg-emerald-500' : 'bg-black dark:bg-white'}`}>
            {premiumTier === 3 ? <Zap size={14} className="text-white fill-white" /> : <Crown size={14} className={premiumTier > 0 ? 'text-black' : 'text-white dark:text-black'} />}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-black dark:text-white tracking-wider">
              {premiumTier === 0 ? 'Upgrade' : premiumTier === 1 ? 'Champ Pro' : premiumTier === 2 ? 'Champ 3.0' : 'Champ 3.0 Pro'}
            </p>
            <p className="text-[9px] text-zinc-500 font-medium">
              {premiumTier === 0 ? 'Unlock 5K rendering & priority' : premiumTier === 1 ? '4K Rendering Active' : premiumTier === 2 ? '5K Reading Active' : 'Ultimate Power Active'}
            </p>
          </div>
        </div>
        <button 
          onClick={onUpgrade}
          className={`w-full py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${premiumTier === 3 ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white'}`}
        >
          <Zap size={10} className={premiumTier === 3 ? 'fill-white' : 'fill-black dark:fill-white'} />
          {premiumTier === 3 ? 'Manage Plan' : 'Upgrade Now'}
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-zinc-200'}`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

export default Sidebar;
