export type PostCategory = 'vlog' | 'ai-news' | 'wb-board' | 'motor-news' | 'national-news';

export interface EditorialPost {
  id: string;
  title: string;
  category: PostCategory;
  summary: string;
  content: string;
  imageUrl: string;
  videoUrl: string;
  authorName: string;
  authorId: string;
  readTime: string;
  createdAtLabel: string;
}

function createEditorialSvgDataUri(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  kicker: string,
  headline: string
): string {
  const safeKicker = kicker
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeHeadline = headline
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryHex}"/>
        <stop offset="52%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="${secondaryHex}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <g opacity="0.35">
      <line x1="0" y1="90" x2="800" y2="90" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="0" y1="360" x2="800" y2="360" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="120" y1="0" x2="120" y2="450" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="680" y1="0" x2="680" y2="450" stroke="#cbd5e1" stroke-width="1"/>
    </g>
    <polygon points="400,70 540,310 260,310" fill="none" stroke="${accentHex}" stroke-width="2.5" opacity="0.85"/>
    <polygon points="420,90 560,330 280,330" fill="${accentHex}" opacity="0.12"/>
    <line x1="160" y1="220" x2="340" y2="190" stroke="#4f46e5" stroke-width="2" opacity="0.5"/>
    <line x1="460" y1="190" x2="660" y2="150" stroke="#7c3aed" stroke-width="2.5" opacity="0.6"/>
    <line x1="470" y1="215" x2="660" y2="235" stroke="#2563eb" stroke-width="2.5" opacity="0.6"/>
    <circle cx="400" cy="220" r="68" fill="none" stroke="${accentHex}" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.6"/>
    <text x="400" y="52" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569" letter-spacing="2">${safeKicker}</text>
    <text x="400" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="600" fill="#0f172a">${safeHeadline}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const HERO_ILLUSTRATION_URI = createEditorialSvgDataUri(
  '#f3e8ff',
  '#dbeafe',
  '#4f46e5',
  'POLARITH SOFTWARES · EDITORIAL STUDIO',
  'Minimalist Architecture, Vlogs & Precision Web Instruments'
);

// All hardcoded blogs and videos removed; posts are exclusively uploaded via /#/admin
export const INITIAL_EDITORIAL_POSTS: EditorialPost[] = [];
