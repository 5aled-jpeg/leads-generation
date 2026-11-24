import { useState, useEffect } from 'react';
import { Search, X, Sparkles, Sliders, Database, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onTriggerPreset?: (query: string, location: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectTab, onTriggerPreset }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'scrape', title: 'Open Lead Scraper', category: 'Navigation', icon: Sparkles },
    { id: 'leads', title: 'View Saved Leads & History', category: 'Navigation', icon: Database },
    { id: 'settings', title: 'Configure API Keys & Engine', category: 'Navigation', icon: Sliders },
  ];

  const presets = [
    { query: 'Roofing Contractors', location: 'Dallas, TX' },
    { query: 'Dental Clinics', location: 'Miami, FL' },
    { query: 'Digital Marketing Agency', location: 'London' },
    { query: 'Luxury Car Rental', location: 'Dubai' },
    { query: 'Commercial Cleaning', location: 'Austin, TX' },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
  const filteredPresets = presets.filter(p => `${p.query} ${p.location}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm px-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
          <input 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50 font-sans"
            placeholder="Type a command, search tab, or target niche..."
          />
          <kbd 
            onClick={onClose}
            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-black/5 dark:bg-white/10 border border-border/50 rounded-[4px] cursor-pointer hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
          >
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                Pages & Actions
              </div>
              {filteredActions.map(action => (
                <div
                  key={action.id}
                  onClick={() => { onSelectTab(action.id); onClose(); }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] text-foreground/90 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                    <span>{action.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/70 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {filteredPresets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                Quick Search Presets
              </div>
              {filteredPresets.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (onTriggerPreset) onTriggerPreset(p.query, p.location);
                    onSelectTab('scrape');
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{p.query}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground">{p.location}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-border/50 transition-colors">
                    Run Scrape
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
