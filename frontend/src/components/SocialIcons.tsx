export function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function LinkedInIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function XTwitterIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SocialLinksProps {
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  className?: string;
}

export function SocialLinks({ linkedin, instagram, facebook, twitter, className = '' }: SocialLinksProps) {
  const hasAny = Boolean(linkedin || instagram || facebook || twitter);

  if (!hasAny) {
    return <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>;
  }

  const formatUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {linkedin && (
        <a
          href={formatUrl(linkedin)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all cursor-pointer"
          title="LinkedIn Profile"
        >
          <LinkedInIcon className="w-3.5 h-3.5" />
        </a>
      )}

      {instagram && (
        <a
          href={formatUrl(instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all cursor-pointer"
          title="Instagram Page"
        >
          <InstagramIcon className="w-3.5 h-3.5" />
        </a>
      )}

      {facebook && (
        <a
          href={formatUrl(facebook)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all cursor-pointer"
          title="Facebook Page"
        >
          <FacebookIcon className="w-3.5 h-3.5" />
        </a>
      )}

      {twitter && (
        <a
          href={formatUrl(twitter)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all cursor-pointer"
          title="X (Twitter) Profile"
        >
          <XTwitterIcon className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
