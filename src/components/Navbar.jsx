import React from 'react';
import { 
  Globe2, Moon, Sun, Settings, Sparkles, MessageSquare, 
  FileText, Image as ImageIcon, Scale, BookOpen, Layers
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenSettings,
  hasApiKey
}) {
  const navItems = [
    { id: 'translate', label: 'Translator', icon: Globe2 },
    { id: 'conversation', label: 'Live Conversation', icon: MessageSquare },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'image', label: 'Image OCR', icon: ImageIcon },
    { id: 'compare', label: 'Compare Tones', icon: Scale },
    { id: 'history', label: 'History & Vocab', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Globe2 className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Translator
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                AI
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
              AI Powered Translator
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          
          {/* Engine indicator */}
          <div 
            onClick={onOpenSettings}
            className="cursor-pointer hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition-colors"
            title="Click to configure API settings"
          >
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
            <span>{hasApiKey ? 'Gemini AI Active' : 'Universal Engine'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Settings & AI Keys"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Mobile Horizontal Nav Scroll */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none bg-slate-50/50 dark:bg-slate-950/40">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
