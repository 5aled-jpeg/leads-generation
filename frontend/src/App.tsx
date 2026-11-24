import { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  FolderKanban, 
  Settings, 
  Hash, 
  Activity, 
  Globe, 
  Terminal, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Database,
  Moon,
  Sun
} from 'lucide-react';
import { SidebarNav } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ScraperTab } from './components/ScraperTab';
import { LeadsTab } from './components/LeadsTab';
import { SettingsTab } from './components/SettingsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import type { NavItemData, NavGroupData, ScrapeTaskState, HistoryFile } from './types';

export default function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState('scrape');
  const [activeWorkspace, setActiveWorkspace] = useState('Lead Generator');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply dark mode class to root html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Backend state
  const [taskState, setTaskState] = useState<ScrapeTaskState>({
    running: false,
    progress: 0,
    current_step: 'Ready',
    total: 0,
    current: 0,
    current_business: '',
    excel_file: null,
    results: [],
    error: null
  });

  const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([]);
  const [presetSearch, setPresetSearch] = useState<{ query: string; location: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scrape/status');
      const data = await res.json();
      setTaskState(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistoryFiles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStatus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setActiveId('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (taskState.running) {
      interval = setInterval(fetchStatus, 1500);
    } else {
      fetchStatus();
      fetchHistory();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskState.running]);

  const handleStartScrape = async (location: string, query: string, pages: number) => {
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, query, pages }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchStatus();
      } else {
        alert(data.detail || 'Could not start scraping');
      }
    } catch (err) {
      alert('Network error connecting to scraper backend');
    }
  };

  const handleStopScrape = async () => {
    try {
      await fetch('/api/scrape/stop', { method: 'POST' });
      fetchStatus();
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const navGroups: NavGroupData[] = [
    {
      items: [
        { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
        { id: 'scrape', title: 'Scraper', icon: Sparkles },
        { id: 'leads', title: 'Leads History', icon: Database, badge: historyFiles.length || undefined },
        { id: 'analytics', title: 'Analytics', icon: Activity },
      ]
    },
    {
      heading: 'Workspace',
      items: [
        { 
          id: 'projects', 
          title: 'Projects', 
          icon: FolderKanban,
          children: [
            { id: 'p-active', title: 'Active', icon: Hash },
            { id: 'p-archived', title: 'Archived', icon: Hash },
          ]
        },
        { 
          id: 'customers', 
          title: 'Customers', 
          icon: Globe,
        },
      ]
    },
    {
      heading: 'Developers',
      items: [
        { id: 'api', title: 'API Keys', icon: Terminal },
        { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
      ]
    }
  ];

  const bottomItems: NavItemData[] = [
    { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
  ];

  const handleSelectNav = (id: string) => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    if (id === 'p-archived' || id === 'projects') {
      setActiveId('leads');
      return;
    }
    if (id === 'api') {
      setActiveId('settings');
      return;
    }
    setActiveId(id);
  };

  const getPageTitle = (id: string) => {
    switch (id) {
      case 'scrape': return 'Scraper';
      case 'leads': return 'Leads History';
      case 'analytics': return 'Analytics';
      case 'settings': return 'Settings';
      default: return 'Scraper';
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* Sidebar matching user template */}
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-card/50 border-r border-border/50 ${
          isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none pointer-events-none'
        }`}
      >
        <SidebarNav 
          className="w-[260px] border-none bg-transparent" 
          activeId={activeId}
          onSelect={handleSelectNav}
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
          navGroups={navGroups}
          bottomItems={bottomItems}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col min-w-0 transition-all duration-300 h-full overflow-hidden">
        {/* Top bar matching user template */}
        <div className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
            >
              {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{activeWorkspace}</span>
              <span>/</span>
              <span className="font-medium text-foreground truncate">{getPageTitle(activeId)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center justify-between w-64 h-8 px-3 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>Search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-background/50 border border-border/50 text-muted-foreground/70">
                ⌘K
              </kbd>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-medium text-xs">
              {activeWorkspace.charAt(0)}
            </div>
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activeId === 'scrape' && (
            <ScraperTab 
              taskState={taskState}
              onStartScrape={handleStartScrape}
              onStopScrape={handleStopScrape}
              presetQuery={presetSearch?.query}
              presetLocation={presetSearch?.location}
            />
          )}

          {activeId === 'leads' && (
            <LeadsTab 
              files={historyFiles}
              onRefresh={fetchHistory}
            />
          )}

          {activeId === 'analytics' && (
            <AnalyticsTab 
              files={historyFiles}
            />
          )}

          {activeId === 'settings' && (
            <SettingsTab 
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onSettingsSaved={() => {
                fetchHistory();
              }}
            />
          )}
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={setActiveId}
        onTriggerPreset={(query, location) => {
          setPresetSearch({ query, location });
          setActiveId('scrape');
        }}
      />
    </div>
  );
}
