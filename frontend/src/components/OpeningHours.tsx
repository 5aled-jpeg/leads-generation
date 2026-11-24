import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OpeningHoursProps {
  rawHours?: string;
  className?: string;
}

export function OpeningHours({ rawHours, className = '' }: OpeningHoursProps) {
  const [showAll, setShowAll] = useState(false);

  if (!rawHours || !rawHours.trim()) {
    return <span className="text-muted-foreground/50 text-[11px]">No hours provided</span>;
  }

  // Clean unicode escapes and quotes
  let cleaned = rawHours
    .replace(/\\u202f/g, ' ')
    .replace(/\u202f/g, ' ')
    .replace(/\\u2013/g, '–')
    .replace(/\u2013/g, '–');

  // Extract day-hour mappings
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const scheduleMap = new Map<string, string>();

  // Try regex for Python dict / JSON format: 'Day': 'Hours' or "Day": "Hours"
  const regex = /['"]?([A-Za-z]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const day = match[1];
    const hours = match[2].trim();
    if (dayOrder.some(d => d.toLowerCase() === day.toLowerCase())) {
      const standardDay = dayOrder.find(d => d.toLowerCase() === day.toLowerCase()) || day;
      scheduleMap.set(standardDay, hours);
    }
  }

  // If regex found valid day keys
  if (scheduleMap.size > 0) {
    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysArr[new Date().getDay()];
    const todayHours = scheduleMap.get(todayName) || scheduleMap.get('Monday') || 'Hours vary';

    // Check if every day is the same
    const allValues = Array.from(scheduleMap.values());
    const isAllSame = allValues.length >= 5 && allValues.every(v => v === allValues[0]);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {/* Today's status row */}
        <div className="flex items-center justify-between py-1 px-2 rounded bg-black/5 dark:bg-white/5 border border-border/40 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              todayHours.toLowerCase().includes('closed') 
                ? 'bg-destructive/80' 
                : 'bg-primary'
            }`} />
            <span className="font-medium text-foreground">Today ({todayName}):</span>
          </div>
          <span className={`font-mono text-[11px] ${
            todayHours.toLowerCase().includes('closed') ? 'text-destructive' : 'text-foreground'
          }`}>
            {todayHours}
          </span>
        </div>

        {/* Concise schedule or full toggle */}
        {isAllSame ? (
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span>Every day:</span>
            <span className="font-mono text-foreground">{allValues[0]}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center justify-between text-[10px] text-muted-foreground hover:text-foreground cursor-pointer px-1 py-0.5 transition-colors"
            >
              <span>{showAll ? 'Hide full weekly schedule' : 'View full weekly schedule (7 days)'}</span>
              {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAll && (
              <div className="grid grid-cols-1 gap-1 p-2 rounded bg-card border border-border/40 text-[11px] animate-in fade-in duration-100">
                {dayOrder.map(day => {
                  const hours = scheduleMap.get(day) || '—';
                  const isToday = day.toLowerCase() === todayName.toLowerCase();
                  const isClosed = hours.toLowerCase().includes('closed');

                  return (
                    <div 
                      key={day} 
                      className={`flex items-center justify-between py-0.5 px-1 rounded ${
                        isToday ? 'bg-black/5 dark:bg-white/5 font-medium' : ''
                      }`}
                    >
                      <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>
                        {day}
                      </span>
                      <span className={`font-mono text-[10px] ${
                        isClosed ? 'text-destructive/80' : isToday ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback for plain readable text: clean up braces and unicode escapes
  const cleanFallback = cleaned
    .replace(/^\{|\}$/g, '')
    .replace(/['"]/g, '')
    .replace(/,\s*/g, ' • ');

  return (
    <div className="text-[11px] text-foreground leading-relaxed">
      {cleanFallback}
    </div>
  );
}
