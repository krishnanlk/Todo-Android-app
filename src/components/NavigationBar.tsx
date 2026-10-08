import React from 'react';
import { Calendar, GitCommit, Target, Sparkles, Plus } from 'lucide-react';

export type TabType = 'today' | 'flow' | 'missions' | 'assistant';

interface NavigationBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onQuickAdd: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onSelectTab,
  onQuickAdd,
}) => {
  return (
    <nav
      className="sticky bottom-4 w-[92%] max-w-[420px] mx-auto z-40 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center justify-between mt-auto"
      style={{
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Today Tab */}
      <button
        onClick={() => onSelectTab('today')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
          activeTab === 'today' ? 'text-blue-400 scale-105' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Calendar size={20} strokeWidth={activeTab === 'today' ? 2.5 : 2} />
        <span className="text-[11px] font-semibold mt-0.5 tracking-tight">Today</span>
      </button>

      {/* Flow Tab */}
      <button
        onClick={() => onSelectTab('flow')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
          activeTab === 'flow' ? 'text-indigo-400 scale-105' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <GitCommit size={20} strokeWidth={activeTab === 'flow' ? 2.5 : 2} />
        <span className="text-[11px] font-semibold mt-0.5 tracking-tight">Flow</span>
      </button>

      {/* Center Floating Plus Action */}
      <button
        onClick={onQuickAdd}
        title="Create new task or mission"
        className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-transform border-2 border-zinc-900"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      {/* Missions Tab */}
      <button
        onClick={() => onSelectTab('missions')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
          activeTab === 'missions' ? 'text-purple-400 scale-105' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Target size={20} strokeWidth={activeTab === 'missions' ? 2.5 : 2} />
        <span className="text-[11px] font-semibold mt-0.5 tracking-tight">Missions</span>
      </button>

      {/* Assistant Tab */}
      <button
        onClick={() => onSelectTab('assistant')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
          activeTab === 'assistant' ? 'text-cyan-400 scale-105' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Sparkles size={20} strokeWidth={activeTab === 'assistant' ? 2.5 : 2} />
        <span className="text-[11px] font-semibold mt-0.5 tracking-tight">Assistant</span>
      </button>
    </nav>
  );
};
