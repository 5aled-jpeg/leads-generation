import { useState, useEffect } from 'react';
import { 
  Flame, 
  Download, 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  MapPin, 
  Clock, 
  Star,
  ArrowRight
} from 'lucide-react';
import { OpeningHours } from './OpeningHours';
import { SocialLinks } from './SocialIcons';
import type { LeadRecord } from '../types';

interface HotLeadsTabProps {
  onHotLeadsChange?: () => void;
  onNavigateToLeads?: () => void;
}

export function HotLeadsTab({ onHotLeadsChange, onNavigateToLeads }: HotLeadsTabProps) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '4.0' | '4.5'>('all');
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);

  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchHotLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hot-leads');
      const data = await res.json();
      setLeads(data.records || []);
    } catch (err) {
      console.error('Failed to fetch hot leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotLeads();
  }, []);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

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

  const getTypesList = (record: LeadRecord): string[] => {
    const raw: string[] = [];
    if (record.category) {
      raw.push(...record.category.split(/[,|;]/).map(s => s.trim()));
    }
    if (record.keywords && record.keywords !== record.category) {
      raw.push(...record.keywords.split(/[,|;]/).map(s => s.trim()));
    }
    return Array.from(new Set(raw.filter(Boolean)));
  };

  const handleRemoveSingle = async (name: string) => {
    try {
      const res = await fetch('/api/hot-leads/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: [name] })
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.name !== name));
        selectedNames.delete(name);
        setSelectedNames(new Set(selectedNames));
        showToast(`Removed "${name}" from Hot Leads`);
        if (onHotLeadsChange) onHotLeadsChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedNames.size === 0) return;
    try {
      const res = await fetch('/api/hot-leads/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: Array.from(selectedNames) })
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => !selectedNames.has(l.name)));
        showToast(`Removed ${selectedNames.size} leads from Hot Leads`);
        setSelectedNames(new Set());
        if (onHotLeadsChange) onHotLeadsChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all hot leads?')) return;
    try {
      const res = await fetch('/api/hot-leads/clear', { method: 'POST' });
      if (res.ok) {
        setLeads([]);
        setSelectedNames(new Set());
        showToast('All hot leads cleared');
        if (onHotLeadsChange) onHotLeadsChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeads = leads.filter(l => {
    // 1. Text filter
    if (search) {
      const q = search.toLowerCase();
      const match = (
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.website && l.website.toLowerCase().includes(q)) ||
        (l.address && l.address.toLowerCase().includes(q))
      );
      if (!match) return false;
    }

    // 2. Rating filter
    const r = typeof l.rating === 'number' ? l.rating : parseFloat(String(l.rating || 0)) || 0;
    if (ratingFilter === '4.0' && r < 4.0) return false;
    if (ratingFilter === '4.5' && r < 4.5) return false;

    // 3. Contact filters
    if (filterHasEmail && (!l.email || !l.email.trim())) return false;
    if (filterHasPhone && (!l.phone || !l.phone.trim())) return false;
    if (filterHasWebsite && (!l.website || !l.website.trim())) return false;

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedNames.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(filteredLeads.map(l => l.name)));
    }
  };

  const toggleSelectLead = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedNames(next);
  };

  const emailsCount = leads.filter(l => l.email && l.email.trim()).length;
  const phonesCount = leads.filter(l => l.phone && l.phone.trim()).length;
  const websitesCount = leads.filter(l => l.website && l.website.trim()).length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Toast alert */}
      {actionMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-card border border-border/80 shadow-lg text-xs font-medium text-foreground flex items-center gap-2 animate-in slide-in-from-top-2">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-medium text-foreground tracking-tight">Hot Leads</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {leads.length} Saved
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated high-possibility prospects and qualified business targets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {leads.length > 0 && (
              <>
                <a
                  href="/api/hot-leads/export"
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </a>

                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/40 text-muted-foreground hover:text-foreground text-xs cursor-pointer transition-colors"
                  title="Clear all hot leads"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {leads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 flex flex-col">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Hot Leads</span>
              <span className="text-lg font-semibold text-foreground font-mono mt-0.5">{leads.length}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 flex flex-col">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">With Email</span>
              <span className="text-lg font-semibold text-foreground font-mono mt-0.5">{emailsCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 flex flex-col">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">With Phone</span>
              <span className="text-lg font-semibold text-foreground font-mono mt-0.5">{phonesCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 flex flex-col">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">With Website</span>
              <span className="text-lg font-semibold text-foreground font-mono mt-0.5">{websitesCount}</span>
            </div>
          </div>
        )}

        {/* Search, Rating & Filter Bar */}
        {leads.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter hot leads by name, email, phone, category..."
                  className="w-full pl-8 pr-3 py-1.5 bg-input/20 border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors"
                />
              </div>

              {selectedNames.size > 0 && (
                <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-black/5 dark:bg-white/5 border border-border/60 text-xs">
                  <span className="font-medium text-foreground">
                    {selectedNames.size} lead{selectedNames.size > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleRemoveSelected}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/20 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Rating Filter Pills */}
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-md border border-border/40 text-[11px]">
                  <span className="text-muted-foreground px-1 flex items-center gap-1 font-medium">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Rating:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('4.0')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      ratingFilter === '4.0'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ★ 4.0+
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('4.5')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      ratingFilter === '4.5'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ★ 4.5+
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      ratingFilter === 'all'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                </div>

                {/* Contact Toggles */}
                <button
                  type="button"
                  onClick={() => setFilterHasEmail(!filterHasEmail)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    filterHasEmail
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✉ Has Email
                </button>
                <button
                  type="button"
                  onClick={() => setFilterHasPhone(!filterHasPhone)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    filterHasPhone
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📞 Has Phone
                </button>
                <button
                  type="button"
                  onClick={() => setFilterHasWebsite(!filterHasWebsite)}
                  className={`px-2 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                    filterHasWebsite
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'border-border/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌐 Has Website
                </button>
              </div>

              {/* Count and Reset */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span>Showing {filteredLeads.length} of {leads.length}</span>
                {(ratingFilter !== 'all' || filterHasEmail || filterHasPhone || filterHasWebsite || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRatingFilter('all');
                      setFilterHasEmail(false);
                      setFilterHasPhone(false);
                      setFilterHasWebsite(false);
                      setSearch('');
                    }}
                    className="text-primary hover:underline cursor-pointer ml-1 font-sans"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / Empty State Card */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <span>Loading hot leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No Hot Leads Saved Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Inspect any saved collection in <strong>Leads History</strong> or run the <strong>Scraper</strong>, select high-possibility leads using the checkboxes, and click <strong>"Move to Hot Leads"</strong>.
            </p>
            {onNavigateToLeads && (
              <button
                onClick={onNavigateToLeads}
                className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Go to Leads History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No hot leads match your search "{search}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1360px]">
              <table className="w-full text-left text-xs text-foreground border-collapse">
                <thead className="bg-card border-b border-border/60 text-muted-foreground font-medium uppercase text-[10px] tracking-wider select-none">
                  <tr>
                    <th className="px-3.5 py-3 w-[45px] text-center">
                      <input
                        type="checkbox"
                        checked={selectedNames.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                        title="Select All"
                      />
                    </th>
                    <th className="px-3 py-3 w-[45px] text-center">#</th>
                    <th className="px-3.5 py-3 min-w-[220px]">Business Name</th>
                    <th className="px-3.5 py-3 min-w-[200px]">Types / Category</th>
                    <th className="px-3.5 py-3 min-w-[210px]">Website (Clickable)</th>
                    <th className="px-3.5 py-3 min-w-[210px]">Email</th>
                    <th className="px-3.5 py-3 min-w-[150px]">Phone</th>
                    <th className="px-3.5 py-3 min-w-[120px]">Social Profiles</th>
                    <th className="px-3.5 py-3 min-w-[90px]">Rating</th>
                    <th className="px-3.5 py-3 min-w-[250px]">Address</th>
                    <th className="px-3.5 py-3 w-[70px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredLeads.map((record, idx) => {
                    const types = getTypesList(record);
                    const isTypesExpanded = expandedTypes.has(idx);
                    const isRowExpanded = expandedRows.has(idx);
                    const cleanWeb = cleanDomain(record.website);
                    const targetWeb = formatWebsiteUrl(record.website);
                    const primaryEmail = record.email ? record.email.split(' || ')[0].trim() : '';
                    const isSelected = selectedNames.has(record.name);

                    return (
                      <>
                        <tr 
                          key={idx} 
                          className={`group transition-colors ${
                            isSelected 
                              ? 'bg-primary/5' 
                              : isRowExpanded 
                                ? 'bg-black/5 dark:bg-white/5' 
                                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3.5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectLead(record.name)}
                              className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Index */}
                          <td className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground/60">
                            {idx + 1}
                          </td>

                          {/* Business Name */}
                          <td className="px-3.5 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-xs leading-snug">
                                {record.name}
                              </span>
                              {record.price_level && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {record.price_level}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Types / Category (Expandable) */}
                          <td className="px-3.5 py-3">
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

                          {/* Website (Clickable 1-click pill) */}
                          <td className="px-3.5 py-3">
                            {record.website ? (
                              <a
                                href={targetWeb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-primary-foreground border border-border/50 text-foreground text-[11px] font-mono group transition-all max-w-[190px]"
                                title={`Click to open ${record.website}`}
                              >
                                <span className="truncate">{cleanWeb}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-3.5 py-3">
                            {primaryEmail ? (
                              <div className="flex items-center gap-1.5 max-w-[190px]">
                                <a
                                  href={`mailto:${primaryEmail}`}
                                  className="font-mono text-[11px] text-foreground hover:underline truncate"
                                  title={record.email}
                                >
                                  {primaryEmail}
                                </a>
                                <button
                                  onClick={() => handleCopy(primaryEmail, `hot-email-${idx}`)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                  title="Copy Email"
                                >
                                  {copiedKey === `hot-email-${idx}` ? (
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
                          <td className="px-3.5 py-3">
                            {record.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${record.phone.replace(/[^+\d]/g, '')}`}
                                  className="font-mono text-[11px] text-foreground hover:underline whitespace-nowrap"
                                >
                                  {record.phone}
                                </a>
                                <button
                                  onClick={() => handleCopy(record.phone, `hot-phone-${idx}`)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                  title="Copy Phone"
                                >
                                  {copiedKey === `hot-phone-${idx}` ? (
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

                          {/* Social Profiles (Clean SVG) */}
                          <td className="px-3.5 py-3">
                            <SocialLinks 
                              linkedin={record.linkedin}
                              instagram={record.instagram}
                              facebook={record.facebook}
                              twitter={record.twitter}
                            />
                          </td>

                          {/* Rating */}
                          <td className="px-3.5 py-3">
                            {record.rating ? (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                                <Star className="w-3 h-3 fill-amber-400/80 text-amber-400/80" />
                                <span>{record.rating}</span>
                                {record.reviews && (
                                  <span className="text-muted-foreground text-[10px]">
                                    ({record.reviews})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </td>

                          {/* Address */}
                          <td className="px-3.5 py-3">
                            {record.address ? (
                              <div className="flex items-center gap-1.5 max-w-[240px]">
                                <span className="truncate text-muted-foreground text-[11px]" title={record.address}>
                                  {record.address}
                                </span>
                                <button
                                  onClick={() => handleCopy(record.address, `hot-addr-${idx}`)}
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                  title="Copy Address"
                                >
                                  {copiedKey === `hot-addr-${idx}` ? (
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

                          {/* Action (Remove + Toggle Details) */}
                          <td className="px-3.5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleRow(idx)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                title={isRowExpanded ? 'Collapse info' : 'Expand opening hours & description'}
                              >
                                {isRowExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveSingle(record.name)}
                                className="p-1 rounded text-muted-foreground/60 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                title="Remove from Hot Leads"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Details Sub-row */}
                        {isRowExpanded && (
                          <tr className="bg-black/[0.03] dark:bg-white/[0.03]">
                            <td colSpan={11} className="px-6 py-4 border-b border-border/40">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Left column: Opening Hours */}
                                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-card border border-border/50">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Opening Hours</span>
                                  </div>
                                  <OpeningHours rawHours={record.opening_hours} />
                                </div>

                                {/* Right column: Full Description & Address */}
                                <div className="flex flex-col gap-2 p-3 rounded-lg bg-card border border-border/50">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Full Location & Overview</span>
                                  </div>
                                  <div className="text-muted-foreground leading-relaxed text-[11px]">
                                    {record.description || 'No extended description available for this place.'}
                                  </div>
                                  {record.keywords && (
                                    <div className="mt-1 pt-2 border-t border-border/30 flex flex-wrap gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase font-mono mr-1">
                                        Keywords:
                                      </span>
                                      {record.keywords.split(/[,|;]/).map((kw, kIdx) => (
                                        <span
                                          key={kIdx}
                                          className="px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/5 border border-border/30 text-muted-foreground"
                                        >
                                          {kw.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
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
    </div>
  );
}
