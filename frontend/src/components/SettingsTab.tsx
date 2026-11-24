import { useState, useEffect } from 'react';
import { 
  Key, 
  Loader2, 
  Save, 
  Cpu, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sun,
  Moon,
  Check,
  AlertCircle
} from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsTabProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSettingsSaved: () => void;
}

export function SettingsTab({ isDarkMode, onToggleDarkMode, onSettingsSaved }: SettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>({
    serper_api_key: '',
    gemini_api_key: '',
    groq_api_key: '',
    openrouter_api_key: '',
    openai_api_key: '',
    llm_model: 'gemini-3.5-flash-lite'
  });

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  
  const [testingSerper, setTestingSerper] = useState(false);
  const [serperStatus, setSerperStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingGroq, setTestingGroq] = useState(false);
  const [groqStatus, setGroqStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterStatus, setOpenRouterStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const toggleShow = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setToast('Configuration saved successfully');
        setTimeout(() => setToast(null), 3000);
        onSettingsSaved();
      }
    } catch (err) {
      setToast('Failed to save configuration');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const testSerper = async () => {
    setTestingSerper(true);
    setSerperStatus(null);
    try {
      const res = await fetch('/api/test-serper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settings.serper_api_key })
      });
      const data = await res.json();
      if (data.success) {
        setSerperStatus({ success: true, msg: data.msg || `Connected (${data.count} places found)` });
      } else {
        setSerperStatus({ success: false, msg: data.error || 'Connection failed' });
      }
    } catch (err) {
      setSerperStatus({ success: false, msg: 'Network error connecting to backend' });
    } finally {
      setTestingSerper(false);
    }
  };

  const testGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settings.gemini_api_key, model: settings.llm_model })
      });
      const data = await res.json();
      if (data.success) {
        setGeminiStatus({ success: true, msg: data.msg || 'Connected' });
      } else {
        setGeminiStatus({ success: false, msg: data.error || 'Gemini connection failed' });
      }
    } catch (err) {
      setGeminiStatus({ success: false, msg: 'Network error connecting to backend' });
    } finally {
      setTestingGemini(false);
    }
  };

  const testGroq = async () => {
    setTestingGroq(true);
    setGroqStatus(null);
    try {
      const res = await fetch('/api/test-groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settings.groq_api_key })
      });
      const data = await res.json();
      if (data.success) {
        setGroqStatus({ success: true, msg: data.msg || 'Connected' });
      } else {
        setGroqStatus({ success: false, msg: data.error || 'Groq connection failed' });
      }
    } catch (err) {
      setGroqStatus({ success: false, msg: 'Network error' });
    } finally {
      setTestingGroq(false);
    }
  };

  const testOpenRouter = async () => {
    setTestingOpenRouter(true);
    setOpenRouterStatus(null);
    try {
      const res = await fetch('/api/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settings.openrouter_api_key })
      });
      const data = await res.json();
      if (data.success) {
        setOpenRouterStatus({ success: true, msg: data.msg || 'Connected' });
      } else {
        setOpenRouterStatus({ success: false, msg: data.error || 'OpenRouter connection failed' });
      }
    } catch (err) {
      setOpenRouterStatus({ success: false, msg: 'Network error' });
    } finally {
      setTestingOpenRouter(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium text-foreground tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-xs">
            Manage your Google Maps credentials, AI extraction engines, and display preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Changes
        </button>
      </div>

      {toast && (
        <div className="px-4 py-2.5 bg-muted border border-border/50 rounded-lg text-foreground text-xs font-medium">
          {toast}
        </div>
      )}

      {/* API Credentials */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border/40">
          <Key className="w-4 h-4 text-foreground/80" />
          <h2 className="text-sm font-medium text-foreground">API Credentials</h2>
        </div>

        {/* Serper */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-foreground uppercase tracking-wider">
              Serper API Key
            </label>
            <div className="flex items-center gap-2">
              {serperStatus && (
                <span className={`text-[11px] flex items-center gap-1 ${
                  serperStatus.success ? 'text-foreground' : 'text-destructive'
                }`}>
                  {serperStatus.success ? (
                    <Check className="w-3 h-3 text-foreground" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive" />
                  )}
                  {serperStatus.msg}
                </span>
              )}
              <button
                type="button"
                onClick={testSerper}
                disabled={testingSerper}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
              >
                {testingSerper ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Test
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type={showKeys['serper'] ? 'text' : 'password'}
              value={settings.serper_api_key}
              onChange={e => setSettings({ ...settings, serper_api_key: e.target.value })}
              placeholder="Paste Serper API key"
              className="w-full pl-3 pr-10 py-2 bg-input/20 border border-border/60 rounded-md text-foreground text-xs font-mono focus:border-ring outline-none"
            />
            <button
              type="button"
              onClick={() => toggleShow('serper')}
              className="absolute right-3 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKeys['serper'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Gemini */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-foreground uppercase tracking-wider">
              Google Gemini API Key
            </label>
            <div className="flex items-center gap-2">
              {geminiStatus && (
                <span className={`text-[11px] flex items-center gap-1 ${
                  geminiStatus.success ? 'text-foreground' : 'text-destructive'
                }`}>
                  {geminiStatus.success ? (
                    <Check className="w-3 h-3 text-foreground" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive" />
                  )}
                  {geminiStatus.msg}
                </span>
              )}
              <button
                type="button"
                onClick={testGemini}
                disabled={testingGemini}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
              >
                {testingGemini ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Test
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type={showKeys['gemini'] ? 'text' : 'password'}
              value={settings.gemini_api_key}
              onChange={e => setSettings({ ...settings, gemini_api_key: e.target.value })}
              placeholder="Paste Gemini API key"
              className="w-full pl-3 pr-10 py-2 bg-input/20 border border-border/60 rounded-md text-foreground text-xs font-mono focus:border-ring outline-none"
            />
            <button
              type="button"
              onClick={() => toggleShow('gemini')}
              className="absolute right-3 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Additional Optional Keys */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border/30">
          {/* Groq */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-muted-foreground">Groq Key</label>
              <button
                type="button"
                onClick={testGroq}
                disabled={testingGroq}
                className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/50 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                {testingGroq ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Test'}
              </button>
            </div>
            <input
              type="password"
              value={settings.groq_api_key}
              onChange={e => setSettings({ ...settings, groq_api_key: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-1.5 bg-input/20 border border-border/60 rounded-md text-foreground text-xs font-mono focus:border-ring outline-none"
            />
            {groqStatus && (
              <span className={`text-[10px] ${groqStatus.success ? 'text-foreground' : 'text-destructive'}`}>
                {groqStatus.msg}
              </span>
            )}
          </div>

          {/* OpenRouter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-muted-foreground">OpenRouter Key</label>
              <button
                type="button"
                onClick={testOpenRouter}
                disabled={testingOpenRouter}
                className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/50 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                {testingOpenRouter ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Test'}
              </button>
            </div>
            <input
              type="password"
              value={settings.openrouter_api_key}
              onChange={e => setSettings({ ...settings, openrouter_api_key: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-1.5 bg-input/20 border border-border/60 rounded-md text-foreground text-xs font-mono focus:border-ring outline-none"
            />
            {openRouterStatus && (
              <span className={`text-[10px] ${openRouterStatus.success ? 'text-foreground' : 'text-destructive'}`}>
                {openRouterStatus.msg}
              </span>
            )}
          </div>

          {/* OpenAI */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground">OpenAI Key</label>
            <input
              type="password"
              value={settings.openai_api_key}
              onChange={e => setSettings({ ...settings, openai_api_key: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-1.5 bg-input/20 border border-border/60 rounded-md text-foreground text-xs font-mono focus:border-ring outline-none"
            />
          </div>
        </div>
      </div>

      {/* AI Model Selector */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/40">
          <Cpu className="w-4 h-4 text-foreground/80" />
          <h2 className="text-sm font-medium text-foreground">AI Enrichment Model</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'gemini-3.5-flash-lite',
              title: 'Google Gemini 3.5 Flash',
              desc: 'High speed, free tier (1,500 queries/day via Google AI Studio).'
            },
            {
              id: 'heuristic',
              title: 'Built-in Smart Heuristic',
              desc: 'Pure rule-based HTML and domain matcher. Zero keys required.'
            },
            {
              id: 'llama-3.3-70b-versatile',
              title: 'Groq Llama 3.3 70B',
              desc: 'Ultra fast inference via Groq cloud.'
            },
            {
              id: 'google/gemini-2.0-flash-lite-001',
              title: 'OpenRouter Aggregator',
              desc: 'Unified multi-provider API model routing.'
            }
          ].map(m => (
            <div
              key={m.id}
              onClick={() => setSettings({ ...settings, llm_model: m.id })}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                settings.llm_model === m.id
                  ? 'border-primary bg-black/5 dark:bg-white/5'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="font-medium text-xs text-foreground">{m.title}</span>
                {settings.llm_model === m.id && (
                  <span className="text-[10px] font-mono text-primary font-medium">Selected</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* UI Aesthetics / Appearance */}
      <div className="p-6 bg-card rounded-xl border border-border/50 shadow-sm flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">Theme Mode</h2>
          <p className="text-xs text-muted-foreground">
            Switch between Warm Paper (Light) and Matte Graphite (Dark).
          </p>
        </div>
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/60 text-foreground text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
}
