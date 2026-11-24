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
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';
import { OpeningHours } from './OpeningHours';
import { SocialLinks } from './SocialIcons';
import type { ScrapeTaskState } from '../types';

interface ScraperTabProps {
  taskState: ScrapeTaskState;
  onStartScrape: (location: string, query: string, pages: number) => void;
  presetQuery?: string;
  presetLocation?: string;
}

export function ScraperTab({ 
  taskState, 
  onStartScrape, 
  presetQuery = '', 
  presetLocation = '' 
}: ScraperTabProps) {
  const [location, setLocation] = useState(presetLocation || 'Miami, FL');
  const [query, setQuery] = useState(presetQuery || 'Roofing Contractors');
  const [pages, setPages] = useState<number>(1);
  const [tableFilter, setTableFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (presetQuery) setQuery(presetQuery);
    if (presetLocation) setLocation(presetLocation);
  }, [presetQuery, presetLocation]);

  const presets = [
    { query: 'Roofing Contractors', location: 'Dallas, TX' },
    { query: 'Dental Clinics', location: 'Miami, FL' },
    { query: 'Digital Marketing Agency', location: 'London' },
    { query: 'Luxury Car Rental', location: 'Dubai' },
    { query: 'Boutique Hotel', location: 'Paris' },
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
    if (!tableFilter) return true;
    const q = tableFilter.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q)
    );
  });

  const emailsFoundCount = (taskState.results || []).filter(r => r.email && r.email.trim()).length;

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
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Target Niche / Service Keyword
            </label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Roofing Contractors, Dentists"
              className="w-full px-3 py-2 bg-input/20 border border-border/60 rounded-md text-foreground text-xs focus:border-ring outline-none"
            />
          </div>

          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Location (City, Suburb, Zip)
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Miami, FL, London, Dallas"
              className="w-full px-3 py-2 bg-input/20 border border-border/60 rounded-md text-foreground text-xs focus:border-ring outline-none"
            />
          </div>

          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Volume ({pages * 20} Leads)
            </label>
            <select
              value={pages}
              onChange={e => setPages(Number(e.target.value))}
              className="w-full px-3 py-2 bg-card border border-border/60 rounded-md text-foreground text-xs focus:border-ring outline-none cursor-pointer"
            >
              <option value={1}>1 Page (20 Leads)</option>
              <option value={2}>2 Pages (40 Leads)</option>
              <option value={3}>3 Pages (60 Leads)</option>
              <option value={5}>5 Pages (100 Leads)</option>
              <option value={10}>10 Pages (200 Leads)</option>
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground font-medium">Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(p.query); setLocation(p.location); }}
              className="px-2 py-0.5 rounded text-[11px] bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer"
            >
              {p.query} ({p.location})
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Saves directly to Excel in real-time
          </span>
          <button
            disabled={taskState.running || !query || !location}
            onClick={() => onStartScrape(location, query, pages)}
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
                Start Scrape ({pages * 20} Leads)
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
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(taskState.progress * 100)}% ({taskState.current}/{taskState.total || pages * 20})
            </span>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{taskState.results.length} Leads Collected</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{emailsFoundCount} with emails</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={tableFilter}
                  onChange={e => setTableFilter(e.target.value)}
                  placeholder="Filter results..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-input/20 border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
              </div>

              {taskState.excel_file && (
                <a
                  href={`/api/download/${taskState.excel_file}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </a>
              )}
            </div>
          </div>

          {/* Table with Horizontal Scroll & Expandable Types */}
          <div className="w-full overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm">
            <div className="min-w-[1300px]">
              <table className="w-full text-left text-xs text-foreground border-collapse">
                <thead className="bg-black/5 dark:bg-white/5 text-muted-foreground font-medium uppercase text-[10px] border-b border-border/50 tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5 w-[50px] text-center">#</th>
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

                    return (
                      <>
                        <tr 
                          key={idx} 
                          className={`transition-colors ${
                            isRowExpanded 
                              ? 'bg-black/5 dark:bg-white/5' 
                              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="px-3.5 py-2.5 text-center text-[11px] font-mono text-muted-foreground/60">
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
                            <td colSpan={10} className="px-6 py-4 border-b border-border/40">
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
        </div>
      )}
    </div>
  );
}
