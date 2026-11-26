import { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Eye, 
  Search, 
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  MapPin,
  Clock,
  Star,
  Flame
} from 'lucide-react';
import { OpeningHours } from './OpeningHours';
import { SocialLinks } from './SocialIcons';
import type { HistoryFile, LeadRecord } from '../types';

interface LeadsTabProps {
  files: HistoryFile[];
  onRefresh: () => void;
  onHotLeadsChange?: () => void;
}

export function LeadsTab({ files, onRefresh, onHotLeadsChange }: LeadsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewRecords, setPreviewRecords] = useState<LeadRecord[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '4.0' | '4.5'>('all'); // Empty / all ratings as default
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [savingHotLeads, setSavingHotLeads] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredFiles = files.filter(f => 
    f.filename.toLowerCase().includes(search.toLowerCase()) ||
    f.date.toLowerCase().includes(search.toLowerCase())
  );

  const handleInspect = async (filename: string) => {
    setSelectedFile(filename);
    setLoadingPreview(true);
    setModalSearch('');
    setRatingFilter('all'); // Empty / all ratings as default
    setFilterHasEmail(false);
    setFilterHasPhone(false);
    setFilterHasWebsite(false);
    setExpandedRows(new Set());
    setExpandedTypes(new Set());
    setSelectedIndices(new Set());
    try {
      const res = await fetch(`/api/history/${filename}`);
      const data = await res.json();
      setPreviewRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === filteredPreview.length && filteredPreview.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredPreview.map((_, i) => i)));
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
    const selectedLeads = Array.from(selectedIndices).map(idx => filteredPreview[idx]).filter(Boolean);
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

  const filteredPreview = previewRecords.filter(r => {
    // 1. Text Search
    if (modalSearch) {
      const q = modalSearch.toLowerCase();
      const match = (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.website && r.website.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q))
      );
      if (!match) return false;
    }

    // 2. Rating Filter (default 4.0+)
    const rVal = typeof r.rating === 'number' ? r.rating : parseFloat(String(r.rating || 0)) || 0;
    if (ratingFilter === '4.0' && rVal < 4.0) return false;
    if (ratingFilter === '4.5' && rVal < 4.5) return false;

    // 3. Contact Filters
    if (filterHasEmail && (!r.email || !r.email.trim())) return false;
    if (filterHasPhone && (!r.phone || !r.phone.trim())) return false;
    if (filterHasWebsite && (!r.website || !r.website.trim())) return false;

    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium text-foreground tracking-tight">Saved Collections</h1>
          <p className="text-xs text-muted-foreground">
            View, inspect, and export your previous lead extraction files.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search file, city, niche..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-input/20 border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md border border-border/60 text-xs font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="p-12 text-center border border-border/50 rounded-xl bg-card/40 flex flex-col items-center justify-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-muted-foreground/40" />
          <h3 className="text-foreground font-medium text-sm">No saved files yet</h3>
          <p className="text-muted-foreground text-xs">Run a scrape to generate Excel lead collections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFiles.map((file, idx) => (
            <div
              key={idx}
              className="p-4 bg-card rounded-xl border border-border/50 hover:border-border transition-colors flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {file.size_kb} KB
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {file.date}
                  </span>
                </div>

                <h3 className="font-medium text-foreground text-xs line-clamp-2" title={file.filename}>
                  {file.filename.replace(/^data_/, '').replace(/\.xlsx$/, '')}
                </h3>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{file.total_records}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Leads</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{file.emails_count}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Emails</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{file.phones_count}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">Phones</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleInspect(file.filename)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md border border-border/60 text-foreground text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  Inspect & Scroll
                </button>
                <a
                  href={`/api/download/${file.filename}`}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3 h-3" />
                  Excel
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Inspection Modal with Horizontal Scrolling and Interactive Actions */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-[94vw] h-[90vh] bg-card border border-border/60 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border/50 shrink-0 bg-card">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-muted-foreground shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-foreground text-sm truncate" title={selectedFile}>
                      {selectedFile}
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-border/50 text-muted-foreground">
                      {previewRecords.length} records
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Click website to open instantly • Click types or row to expand details • Scroll horizontally for all columns
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search inside collection..."
                    className="w-full pl-8 pr-2.5 py-1 bg-input/20 border border-border/50 rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                  />
                </div>

                {/* Move to Hot Leads Button */}
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

                <a
                  href={`/api/download/${selectedFile}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/5 border border-border/50 text-foreground text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Filter Sub-bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-border/40 text-xs shrink-0 select-none">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Rating Filter Pills */}
                <div className="flex items-center gap-1 bg-card p-1 rounded-md border border-border/50 text-[11px]">
                  <span className="text-muted-foreground px-1 flex items-center gap-1 font-medium">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    Rating Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      ratingFilter === 'all'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Ratings (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter('4.0')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      ratingFilter === '4.0'
                        ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ★ 4.0+ Stars
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
                    ★ 4.5+ Top Tier
                  </button>
                </div>

                {/* Contact Filters */}
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

              {/* Status & Reset */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground self-end sm:self-auto font-mono">
                <span>
                  Showing {filteredPreview.length} of {previewRecords.length} records
                  {ratingFilter !== 'all' ? ` (★ ${ratingFilter}+)` : ''}
                </span>
                {(ratingFilter !== 'all' || filterHasEmail || filterHasPhone || filterHasWebsite || modalSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRatingFilter('all');
                      setFilterHasEmail(false);
                      setFilterHasPhone(false);
                      setFilterHasWebsite(false);
                      setModalSearch('');
                    }}
                    className="text-primary hover:underline cursor-pointer ml-1 font-sans"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div className="absolute top-16 right-6 z-50 px-4 py-2 rounded-lg bg-card border border-border/80 shadow-lg text-xs font-medium text-foreground flex items-center gap-2 animate-in slide-in-from-top-2">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Modal Body - Horizontal & Vertical Scroll Area */}
            <div className="flex-1 overflow-auto bg-card/40">
              {loadingPreview ? (
                <div className="py-24 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
                  <span>Loading records from collection...</span>
                </div>
              ) : filteredPreview.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  No records match your filter "{modalSearch}"
                </div>
              ) : (
                <div className="min-w-[1360px] pb-8">
                  <table className="w-full text-left text-xs text-foreground border-collapse">
                    <thead className="sticky top-0 z-20 bg-card border-b border-border/60 text-muted-foreground font-medium uppercase text-[10px] tracking-wider select-none shadow-xs">
                      <tr>
                        <th className="px-3.5 py-3 w-[45px] text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.size === filteredPreview.length && filteredPreview.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                            title="Select All Visible Leads"
                          />
                        </th>
                        <th className="px-3 py-3 w-[45px] text-center">#</th>
                        <th className="px-3.5 py-3 min-w-[220px]">Business Name</th>
                        <th className="px-3.5 py-3 min-w-[200px]">Types / Category</th>
                        <th className="px-3.5 py-3 min-w-[210px]">Website (Clickable)</th>
                        <th className="px-3.5 py-3 min-w-[210px]">Email</th>
                        <th className="px-3.5 py-3 min-w-[150px]">Phone</th>
                        <th className="px-3.5 py-3 min-w-[120px]">Social Profiles</th>
                        <th className="px-3.5 py-3 min-w-[100px]">Rating</th>
                        <th className="px-3.5 py-3 min-w-[260px]">Address</th>
                        <th className="px-3.5 py-3 w-[70px] text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredPreview.map((record, idx) => {
                        const types = getTypesList(record);
                        const isTypesExpanded = expandedTypes.has(idx);
                        const isRowExpanded = expandedRows.has(idx);
                        const cleanWeb = cleanDomain(record.website);
                        const targetWeb = formatWebsiteUrl(record.website);
                        const primaryEmail = record.email ? record.email.split(' || ')[0].trim() : '';
                        const isSelected = selectedIndices.has(idx);

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
                              {/* Row Checkbox */}
                              <td className="px-3.5 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectLead(idx)}
                                  className="rounded border-border/60 text-primary focus:ring-0 cursor-pointer"
                                />
                              </td>

                              {/* Row Index */}
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
                                    <span className="text-[10px] font-mono text-muted-foreground/70">
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
                                  <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                                    {/* Primary Type Pill */}
                                    <span className="px-2 py-0.5 rounded text-[11px] bg-black/5 dark:bg-white/5 border border-border/50 text-foreground font-medium">
                                      {types[0]}
                                    </span>

                                    {/* Remaining Types (Expandable toggle) */}
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
                                              Show less
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={(e) => toggleTypes(idx, e)}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border/40 text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-0.5 transition-colors"
                                            title="Click to view all category types and keywords"
                                          >
                                            <Layers className="w-2.5 h-2.5" />
                                            <span>+{types.length - 1} more</span>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Website (Clickable OnClick) */}
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
                                  <div className="flex items-center gap-1.5 max-w-[200px]">
                                    <a
                                      href={`mailto:${primaryEmail}`}
                                      className="font-mono text-[11px] text-foreground hover:underline truncate"
                                      title={`Send email to ${primaryEmail}`}
                                    >
                                      {primaryEmail}
                                    </a>
                                    <button
                                      onClick={() => handleCopy(primaryEmail, `email-${idx}`)}
                                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0 transition-colors"
                                      title="Copy email address"
                                    >
                                      {copiedKey === `email-${idx}` ? (
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
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                {record.phone ? (
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={`tel:${record.phone}`}
                                      className="text-foreground text-[11px] font-mono hover:underline"
                                    >
                                      {record.phone}
                                    </a>
                                    <button
                                      onClick={() => handleCopy(record.phone, `phone-${idx}`)}
                                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0 transition-colors"
                                      title="Copy phone number"
                                    >
                                      {copiedKey === `phone-${idx}` ? (
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

                              {/* Social Profiles */}
                              <td className="px-3.5 py-3">
                                <SocialLinks 
                                  linkedin={record.linkedin}
                                  instagram={record.instagram}
                                  facebook={record.facebook}
                                  twitter={record.twitter}
                                />
                              </td>

                              {/* Rating & Reviews */}
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                {record.rating ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-foreground/30 text-foreground" />
                                    <span className="font-medium text-foreground text-xs">{record.rating}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      ({record.reviews || 0})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                                )}
                              </td>

                              {/* Address */}
                              <td className="px-3.5 py-3">
                                {record.address ? (
                                  <div className="flex items-center gap-1.5 max-w-[280px]">
                                    <span className="text-[11px] text-muted-foreground truncate" title={record.address}>
                                      {record.address}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(record.address, `addr-${idx}`)}
                                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0 transition-colors"
                                      title="Copy address"
                                    >
                                      {copiedKey === `addr-${idx}` ? (
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

                              {/* Details Accordion Button */}
                              <td className="px-3.5 py-3 text-right">
                                <button
                                  onClick={() => toggleRow(idx)}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  title="Toggle full details card"
                                >
                                  {isRowExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Details Accordion Card */}
                            {isRowExpanded && (
                              <tr className="bg-black/[0.03] dark:bg-white/[0.03]">
                                <td colSpan={11} className="px-6 py-4 border-b border-border/40">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                                    {/* All Types & Categorization */}
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" /> All Types & Tags
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {types.length > 0 ? (
                                          types.map((t, i) => (
                                            <span 
                                              key={i} 
                                              className="px-2 py-0.5 rounded text-[11px] bg-card border border-border/60 text-foreground"
                                            >
                                              {t}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-muted-foreground/50">No tags listed</span>
                                        )}
                                      </div>
                                      {record.keywords && (
                                        <span className="text-[11px] text-muted-foreground/80 pt-1">
                                          Keywords: {record.keywords}
                                        </span>
                                      )}
                                    </div>

                                    {/* Full Location & Contacts */}
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> Full Location & Map
                                      </span>
                                      <p className="text-foreground text-[11px] leading-relaxed">
                                        {record.address || 'No physical address found'}
                                      </p>
                                      {record.address && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            `${record.name} ${record.address}`
                                          )}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1 w-fit"
                                        >
                                          Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>

                                    {/* Hours & Description */}
                                    <div className="flex flex-col gap-2.5">
                                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Opening Hours
                                      </span>
                                      <OpeningHours rawHours={record.opening_hours} />
                                      {record.description && (
                                        <div className="flex flex-col gap-1 border-t border-border/30 pt-2">
                                          <span className="text-[10px] uppercase font-medium text-muted-foreground">About / Overview</span>
                                          <p className="text-[11px] text-foreground leading-relaxed italic">
                                            "{record.description}"
                                          </p>
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
