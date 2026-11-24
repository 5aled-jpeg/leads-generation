import React from 'react';

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

export interface LeadRecord {
  name: string;
  address: string;
  website: string;
  phone: string;
  description?: string;
  rating?: number | string;
  reviews?: number | string;
  category?: string;
  keywords?: string;
  price_level?: string | number;
  opening_hours?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  searched?: string;
}

export interface ScrapeTaskState {
  running: boolean;
  progress: number;
  current_step: string;
  total: number;
  current: number;
  current_business: string;
  excel_file: string | null;
  results: LeadRecord[];
  error: string | null;
}

export interface HistoryFile {
  filename: string;
  date: string;
  size_kb: number;
  total_records: number;
  emails_count: number;
  phones_count: number;
  websites_count: number;
}

export interface AppSettings {
  serper_api_key: string;
  gemini_api_key: string;
  groq_api_key: string;
  openrouter_api_key: string;
  openai_api_key: string;
  llm_model: string;
  masked?: {
    serper_api_key: string;
    gemini_api_key: string;
    groq_api_key: string;
    openrouter_api_key: string;
    openai_api_key: string;
  };
}

export type ThemeType = 'luxury-dark' | 'midnight-sapphire' | 'obsidian-gold' | 'minimal-light';
