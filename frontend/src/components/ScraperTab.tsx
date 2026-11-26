import { useState, useEffect } from 'react';
import { 
  Play, 
  Loader2, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Square,
  Flame,
  Star,
  Tag,
  Filter,
  X
} from 'lucide-react';
import { OpeningHours } from './OpeningHours';
import { SocialLinks } from './SocialIcons';
import type { ScrapeTaskState } from '../types';

interface ScraperTabProps {
  taskState: ScrapeTaskState;
  onStartScrape: (location: string, query: string, pages: number, minRating?: number, keywords?: string[]) => void;
  onStopScrape?: () => void;
  onHotLeadsChange?: () => void;
  presetQuery?: string;
  presetLocation?: string;
}

export function ScraperTab({ 
  taskState, 
  onStartScrape, 
  onStopScrape,
  onHotLeadsChange,
  presetQuery = '', 
  presetLocation = '' 
}: ScraperTabProps) {
  const [location, setLocation] = useState(presetLocation || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0); // Empty as default (no rating filter)
  const [requireWebsite, setRequireWebsite] = useState<boolean>(false);
  const [pages, setPages] = useState<number>(1);

  // Table filter states - empty as default
  const [tableFilter, setTableFilter] = useState('');
  const [resultRatingFilter, setResultRatingFilter] = useState<'all' | '4.0' | '4.5'>('all');
  const [resultHasEmail, setResultHasEmail] = useState<boolean>(false);
  const [resultHasPhone, setResultHasPhone] = useState<boolean>(false);
  const [resultHasWebsite, setResultHasWebsite] = useState<boolean>(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [savingHotLeads, setSavingHotLeads] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (presetQuery) {
      const parts = presetQuery.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        setKeywords(parts);
      }
    }
    if (presetLocation) setLocation(presetLocation);
  }, [presetQuery, presetLocation]);

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (keywordInput.trim()) {
        const parts = keywordInput.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach(addKeyword);
        setKeywordInput('');
      }
    }
  };

  const handleApplyKeywordBundle = (bundle: string[]) => {
    setKeywords(bundle);
  };

  const presets = [
    { name: 'Coffee & Barista', keywords: ['Coffees', 'Lux', 'barista'], location: 'Paris' },
    { name: 'Luxury Car Rental', keywords: ['Luxury Car Rental', 'Supercars', 'Chauffeur'], location: 'Dubai' },
    { name: 'Roofing Contractors', keywords: ['Roofing Contractors', 'Roof Repair'], location: 'Dallas, TX' },
    { name: 'Dental Clinics', keywords: ['Dental Clinics', 'Cosmetic Dentist'], location: 'Miami, FL' },
    { name: 'Digital Agency', keywords: ['Digital Marketing Agency', 'SEO Agency'], location: 'London' },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleRow = (idx: number) => {
    const next = new Set(expandedRows);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setExpandedRows(next);
  };

  const toggleTypes = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedTypes);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setExpandedTypes(next);
  };

  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const cleanDomain = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  };

  const getTypesList = (category?: string, keywords?: string): string[] => {
    const raw: string[] = [];
    if (category) {
      raw.push(...category.split(/[,|;]/).map(s => s.trim()));
    }
    if (keywords && keywords !== category) {
      raw.push(...keywords.split(/[,|;]/).map(s => s.trim()));
    }
    return Array.from(new Set(raw.filter(Boolean)));
  };

  const filteredResults = (taskState.results || []).filter(item => {
    // 1. Text filter
    if (tableFilter) {
      const q = tableFilter.toLowerCase();
      const match = (
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.address?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }

    // 2. Rating filter (default 4.0+)
    const r = typeof item.rating === 'number' ? item.rating : parseFloat(String(item.rating || 0)) || 0;
    if (resultRatingFilter === '4.0' && r < 4.0) return false;
    if (resultRatingFilter === '4.5' && r < 4.5) return false;

    // 3. Contact filters
    if (resultHasEmail && (!item.email || !item.email.trim())) return false;
    if (resultHasPhone && (!item.phone || !item.phone.trim())) return false;
    if (resultHasWebsite && (!item.website || !item.website.trim())) return false;

    return true;
  });

  const emailsFoundCount = (taskState.results || []).filter(r => r.email && r.email.trim()).length;

  const toggleSelectAll = () => {
    if (selectedIndices.size === filteredResults.length && filteredResults.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredResults.map((_, i) => i)));
    }
  };

  const toggleSelectLead = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleMoveToHotLeads = async () => {
    if (selectedIndices.size === 0) return;
    const selectedLeads = Array.from(selectedIndices).map(idx => filteredResults[idx]).filter(Boolean);
    if (selectedLeads.length === 0) return;

    setSavingHotLeads(true);
    try {
      const res = await fetch('/api/hot-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: selectedLeads })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`✓ Added ${data.added ?? selectedLeads.length} lead${(data.added ?? selectedLeads.length) > 1 ? 's' : ''} to Hot Leads!`);
        setTimeout(() => setToastMessage(null), 3000);
        setSelectedIndices(new Set());
        if (onHotLeadsChange) onHotLeadsChange();
      } else {
        alert('Failed to save hot leads');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to backend');
    } finally {
      setSavingHotLeads(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Search Input Controls Card */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1 pb-3 border-b border-border/30">
          <h1 className="text-xl font-medium text-foreground tracking-tight">Lead Generation</h1>
          <p className="text-xs text-muted-foreground">
            Search Google Maps and scrape business websites to extract contact info.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Target Niche & Keywords Research Input with Tags */}
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3 text-primary" />
                Target Niche & Keywords Research
              </label>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Keyword Pills + Input Container */}
            <div className="w-full min-h-[38px] p-1.5 bg-input/20 border border-border/60 rounded-md flex flex-wrap items-center gap-1.5 focus-within:border-ring transition-colors">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary border border-primary/20 font-medium animate-in zoom-in-95"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="hover:opacity-75 cursor-pointer ml-0.5 text-primary/70 hover:text-primary"
                    title={`Remove ${kw}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                onBlur={() => {
                  if (keywordInput.trim()) {
                    const parts = keywordInput.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
                    parts.forEach(addKeyword);
                    setKeywordInput('');
                  }
                }}
                placeholder={keywords.length === 0 ? "e.g. Coffees, Lux, barista (hit Enter)..." : "+ Add keyword..."}
                className="flex-1 min-w-[130px] bg-transparent text-foreground text-xs outline-none px-1 py-0.5 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Location */}
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Location (City, Suburb, Zip)
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Miami, FL, Paris, London"
              className="w-full px-3 py-2 bg-input/20 border border-border/60 rounded-md text-foreground text-xs focus:border-ring outline-none"
            />
          </div>

          {/* Volume */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Volume ({pages * 20} Leads/Keyword)
            </label>
            <select
              value={pages}
              onChange={e => setPages(Number(e.target.value))}
              className="w-full px-3 py-2 bg-card border border-border/60 rounded-md text-foreground text-xs focus:border-ring outline-none cursor-pointer"
            >
              <option value={1}>1 Page (20 Leads / kw)</option>
              <option value={2}>2 Pages (40 Leads / kw)</option>
              <option value={3}>3 Pages (60 Leads / kw)</option>
              <option value={5}>5 Pages (100 Leads / kw)</option>
            </select>
          </div>
        </div>

        {/* Research Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-primary" />
              Research Filter:
            </span>

            {/* Min Rating Selector */}
            <div className="flex items-center gap-1 bg-card p-1 rounded-md border border-border/50 text-[11px]">
              <span className="text-muted-foreground px-1">Min Rating:</span>
              <button
                type="button"
                onClick={() => setMinRating(0)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  minRating === 0 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Ratings (Default)
              </button>
              <button
                type="button"
                onClick={() => setMinRating(4.0)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  minRating === 4.0 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className={`w-3 h-3 ${minRating === 4.0 ? 'fill-current' : 'fill-amber-400/80 text-amber-400'}`} />
                <span>4.0+ Stars</span>
              </button>
              <button
                type="button"
                onClick={() => setMinRating(4.5)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  minRating === 4.5 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className={`w-3 h-3 ${minRating === 4.5 ? 'fill-current' : 'fill-amber-400/80 text-amber-400'}`} />
                <span>4.5+ Stars</span>
              </button>
            </div>

            {/* Require Website Toggle */}
            <label className="flex items-center gap-1.5 px-2 py-1 bg-card rounded-md border border-border/50 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireWebsite}
                onChange={e => setRequireWebsite(e.target.checked)}
                className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
              />
              <span>Require Website</span>
            </label>
          </div>

          <span className="text-[11px] text-muted-foreground font-mono">
            {minRating > 0 ? `Filtering: ★ ${minRating}+ only` : 'No rating filter'}
          </span>
        </div>

        {/* Quick Keyword Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground font-medium">Suggested Research:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { 
                handleApplyKeywordBundle(p.keywords); 
                setLocation(p.location); 
              }}
              className="px-2 py-0.5 rounded text-[11px] bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
              title={`Load keywords: ${p.keywords.join(', ')} in ${p.location}`}
            >
              {p.name} ({p.location})
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Saves deduplicated records directly to Excel in real-time
          </span>
          <button
            disabled={taskState.running || (keywords.length === 0 && !keywordInput) || !location}
            onClick={() => {
              const effectiveKeywords = keywords.length > 0 ? keywords : [keywordInput.trim()];
              const querySummary = effectiveKeywords.join(', ');
              onStartScrape(location, querySummary, pages, minRating, effectiveKeywords);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
          >
            {taskState.running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Scrape ({keywords.length || 1} keywords • {pages * 20} Leads/kw)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Card */}
      {taskState.running && (
        <div className="p-5 bg-card rounded-xl border border-border/60 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{taskState.current_step}</span>
                {taskState.current_business && (
                  <span className="text-[11px] text-muted-foreground">{taskState.current_business}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(taskState.progress * 100)}% ({taskState.current}/{taskState.total || pages * 20})
              </span>
              <button
                type="button"
                onClick={async () => {
                  setStopping(true);
                  if (onStopScrape) await onStopScrape();
                  setTimeout(() => setStopping(false), 2000);
                }}
                disabled={stopping}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors cursor-pointer"
                title="Stop scraping and keep collected leads"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{stopping ? 'Stopping...' : 'Stop'}</span>
              </button>
            </div>
          </div>

          <div className="w-full h-1.5 bg-input/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, taskState.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {taskState.error && (
        <div className="p-3 bg-card border border-destructive/40 rounded-lg text-destructive text-xs">
          {taskState.error}
        </div>
      )}

      {/* Results Section */}
      {taskState.results && taskState.results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card rounded-xl border border-border/50 shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{taskState.results.length} Leads Collected</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{emailsFoundCount} with emails</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isTableExpanded && (
                <button
                  type="button"
                  onClick={handleMoveToHotLeads}
                  disabled={selectedIndices.size === 0 || savingHotLeads}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedIndices.size > 0
                      ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-muted-foreground/50 border border-border/40 cursor-not-allowed opacity-60'
                  }`}
                  title={selectedIndices.size === 0 ? 'Select leads below first using checkboxes' : `Move ${selectedIndices.size} selected leads to Hot Leads`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Move to Hot Leads {selectedIndices.size > 0 ? `(${selectedIndices.size})` : ''}</span>
                </button>
              )}

              {taskState.excel_file && (
                <a
                  href={`/api/download/${taskState.excel_file}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-foreground text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </a>
              )}

              {/* Show / Hide Leads Table Button */}
              <button
                type="button"
                onClick={() => setIsTableExpanded(!isTableExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/60 hover:bg-black/5 dark:hover:bg-white/5 text-foreground text-xs font-medium cursor-pointer transition-colors"
              >
                {isTableExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Hide Leads</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Show Leads ({filteredResults.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Results Filter Bar (when table is expanded) */}
          {isTableExpanded && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border/50 text-xs shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search in results */}
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={tableFilter}
                    onChange={e => setTableFilter(e.target.value)}
                    placeholder="Search results..."
                    className="w-full pl-8 pr-2.5 py-1 bg-input/20 border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                  />
                </div>

                {/* Rating Filter Pills */}
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-md border border-border/40">
                  <span className="text-[11px] text-muted-foreground px-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Rating:
                  </span>
                  <button
                    type="button"
                    onClick={() => setResultRatingFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                      resultRatingFilter === 'all'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultRatingFilter('4.0')}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                      resultRatingFilter === '4.0'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ★ 4.0+
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultRatingFilter('4.5')}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                      resultRatingFilter === '4.5'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ★ 4.5+
                  </button>
                </div>

                {/* Contact Filter Toggles */}
                <button
                  type="button"
                  onClick={() => setResultHasEmail(!resultHasEmail)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    resultHasEmail
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✉ Has Email
                </button>
                <button
                  type="button"
                  onClick={() => setResultHasPhone(!resultHasPhone)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    resultHasPhone
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📞 Has Phone
                </button>
                <button
                  type="button"
                  onClick={() => setResultHasWebsite(!resultHasWebsite)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    resultHasWebsite
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌐 Has Website
                </button>
              </div>

              {/* Showing count & reset */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground self-end sm:self-auto">
                <span className="font-mono">
                  Showing {filteredResults.length} of {taskState.results.length} leads
                </span>
                {(resultRatingFilter !== 'all' || resultHasEmail || resultHasPhone || resultHasWebsite || tableFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultRatingFilter('all');
                      setResultHasEmail(false);
                      setResultHasPhone(false);
                      setResultHasWebsite(false);
                      setTableFilter('');
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 rounded-lg bg-card border border-border/80 shadow-md text-xs font-medium text-foreground flex items-center gap-2 animate-in fade-in">
              <Flame className="w-4 h-4 text-primary" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Table (Collapsible) */}
          {isTableExpanded && (
            <div className="w-full overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm animate-in fade-in zoom-in-98 duration-150">
              <div className="min-w-[1300px]">
                <table className="w-full text-left text-xs text-foreground border-collapse">
                  <thead className="bg-black/5 dark:bg-white/5 text-muted-foreground font-medium uppercase text-[10px] border-b border-border/50 tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5 w-[45px] text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === filteredResults.length && filteredResults.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                          title="Select All Visible Leads"
                        />
                      </th>
                      <th className="px-3 py-2.5 w-[45px] text-center">#</th>
                      <th className="px-3.5 py-2.5 min-w-[200px]">Business</th>
                      <th className="px-3.5 py-2.5 min-w-[180px]">Types / Category</th>
                      <th className="px-3.5 py-2.5 min-w-[200px]">Website (Clickable)</th>
                      <th className="px-3.5 py-2.5 min-w-[200px]">Email</th>
                      <th className="px-3.5 py-2.5 min-w-[150px]">Phone</th>
                      <th className="px-3.5 py-2.5 min-w-[120px]">Social</th>
                      <th className="px-3.5 py-2.5 min-w-[100px]">Rating</th>
                      <th className="px-3.5 py-2.5 min-w-[240px]">Address</th>
                      <th className="px-3.5 py-2.5 w-[60px] text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredResults.map((lead, idx) => {
                      const types = getTypesList(lead.category, lead.keywords);
                      const isTypesExpanded = expandedTypes.has(idx);
                      const isRowExpanded = expandedRows.has(idx);
                      const cleanWeb = cleanDomain(lead.website);
                      const targetWeb = formatWebsiteUrl(lead.website);
                      const primaryEmail = lead.email ? lead.email.split(' || ')[0].trim() : '';
                      const isSelected = selectedIndices.has(idx);

                      return (
                        <>
                          <tr 
                            key={idx} 
                            className={`transition-colors ${
                              isSelected
                                ? 'bg-primary/5'
                                : isRowExpanded 
                                  ? 'bg-black/5 dark:bg-white/5' 
                                  : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className="px-3.5 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectLead(idx)}
                                className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center text-[11px] font-mono text-muted-foreground/60">
                              {idx + 1}
                            </td>

                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-foreground">{lead.name}</div>
                          </td>

                          {/* Types (Expandable) */}
                          <td className="px-3.5 py-2.5">
                            {types.length === 0 ? (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5 max-w-[240px]">
                                <span className="px-2 py-0.5 rounded text-[11px] bg-black/5 dark:bg-white/5 border border-border/50 text-foreground font-medium">
                                  {types[0]}
                                </span>
                                {types.length > 1 && (
                                  <>
                                    {isTypesExpanded ? (
                                      <>
                                        {types.slice(1).map((t, tIdx) => (
                                          <span
                                            key={tIdx}
                                            className="px-2 py-0.5 rounded text-[11px] bg-black/5 dark:bg-white/5 border border-border/40 text-muted-foreground"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                        <button
                                          onClick={(e) => toggleTypes(idx, e)}
                                          className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
                                        >
                                          less
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={(e) => toggleTypes(idx, e)}
                                        className="px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border/40 text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-0.5"
                                        title="Click to view all categories"
                                      >
                                        <Layers className="w-2.5 h-2.5" />
                                        +{types.length - 1} more
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Website Link (Clickable) */}
                          <td className="px-3.5 py-2.5">
                            {lead.website ? (
                              <a
                                href={targetWeb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-primary-foreground border border-border/50 text-foreground text-[11px] font-mono group transition-all max-w-[190px]"
                                title={`Click to open ${lead.website}`}
                              >
                                <span className="truncate">{cleanWeb}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-3.5 py-2.5">
                            {primaryEmail ? (
                              <div className="flex items-center gap-1.5 max-w-[190px]">
                                <a
                                  href={`mailto:${primaryEmail}`}
                                  className="font-mono text-[11px] text-foreground hover:underline truncate"
                                >
                                  {primaryEmail}
                                </a>
                                <button
                                  onClick={() => handleCopy(primaryEmail, `live-email-${idx}`)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                >
                                  {copiedKey === `live-email-${idx}` ? (
                                    <Check className="w-3 h-3 text-foreground" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {lead.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a href={`tel:${lead.phone}`} className="text-foreground text-[11px] font-mono hover:underline">
                                  {lead.phone}
                                </a>
                                <button
                                  onClick={() => handleCopy(lead.phone, `live-phone-${idx}`)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                >
                                  {copiedKey === `live-phone-${idx}` ? (
                                    <Check className="w-3 h-3 text-foreground" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Socials */}
                          <td className="px-3.5 py-2.5">
                            <SocialLinks 
                              linkedin={lead.linkedin}
                              instagram={lead.instagram}
                              facebook={lead.facebook}
                              twitter={lead.twitter}
                            />
                          </td>

                          {/* Rating */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {lead.rating ? (
                              <span className="text-foreground text-[11px] font-medium">
                                {lead.rating} <span className="text-muted-foreground text-[10px] font-mono">({lead.reviews || 0})</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Address */}
                          <td className="px-3.5 py-2.5">
                            <span className="text-[11px] text-muted-foreground truncate max-w-[220px] block" title={lead.address}>
                              {lead.address || '—'}
                            </span>
                          </td>

                          {/* Expand Details */}
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              onClick={() => toggleRow(idx)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                            >
                              {isRowExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {isRowExpanded && (
                          <tr className="bg-black/[0.03] dark:bg-white/[0.03]">
                            <td colSpan={11} className="px-6 py-4 border-b border-border/40">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> All Categories & Keywords
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {types.map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-card border border-border/60 text-foreground">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Full Address
                                  </span>
                                  <p className="text-foreground text-[11px]">{lead.address || '—'}</p>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Opening Hours
                                  </span>
                                  <OpeningHours rawHours={lead.opening_hours} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
