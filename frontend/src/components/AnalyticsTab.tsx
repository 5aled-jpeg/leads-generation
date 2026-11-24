import { 
  Users, 
  Mail, 
  Phone, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import type { HistoryFile } from '../types';

interface AnalyticsTabProps {
  files: HistoryFile[];
}

export function AnalyticsTab({ files }: AnalyticsTabProps) {
  const totalFiles = files.length;
  const totalLeadsHistorical = files.reduce((acc, f) => acc + (f.total_records || 0), 0);
  const totalEmailsHistorical = files.reduce((acc, f) => acc + (f.emails_count || 0), 0);
  const totalPhonesHistorical = files.reduce((acc, f) => acc + (f.phones_count || 0), 0);

  const emailRate = totalLeadsHistorical > 0 
    ? Math.round((totalEmailsHistorical / totalLeadsHistorical) * 100) 
    : 0;

  const phoneRate = totalLeadsHistorical > 0 
    ? Math.round((totalPhonesHistorical / totalLeadsHistorical) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium text-foreground tracking-tight">Metrics & Intelligence</h1>
          <p className="text-xs text-muted-foreground">
            Aggregate coverage numbers across all exported lead generation files.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-card rounded-xl border border-border/50 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-medium text-foreground">{totalLeadsHistorical}</span>
          <span className="text-[11px] text-muted-foreground">{totalFiles} campaigns run</span>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border/50 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Emails Found</span>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-medium text-foreground">{totalEmailsHistorical}</span>
          <span className="text-[11px] text-muted-foreground">{emailRate}% capture rate</span>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border/50 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Phone Numbers</span>
            <Phone className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-medium text-foreground">{totalPhonesHistorical}</span>
          <span className="text-[11px] text-muted-foreground">{phoneRate}% coverage</span>
        </div>

        <div className="p-4 bg-card rounded-xl border border-border/50 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Spreadsheets</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-medium text-foreground">{totalFiles}</span>
          <span className="text-[11px] text-muted-foreground">Exported in data/</span>
        </div>
      </div>

      {/* Guidelines Card */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground">Scraping Recommendations</h2>
        <div className="flex flex-col gap-2.5 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">Specific Geographies:</strong> Querying sub-regions or zip codes (e.g. "Brickell Miami" or "SoHo NYC") captures 3x more distinct places than high-level metro searches.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">Trade Synonyms:</strong> Test variations like "Commercial Cleaning" and "Office Cleaning" to expose distinct Google Business Profile categories.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
