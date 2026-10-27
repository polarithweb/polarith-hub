/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Cpu,
  GraduationCap,
  Film,
  Car,
  Landmark,
  Tv,
  NotebookPen,
  Calculator,
  ArrowRight,
  LogOut,
  Menu,
  X,
  Ruler,
  Calendar,
  ArrowLeftRight,
  Sigma,
  Sparkles,
  Clock,
} from 'lucide-react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  parseHashRoute,
  AppRoute,
  extractYouTubeId,
  sanitizeSafeImageUrl,
  sanitizeWhatsappNumber,
  getLocalCycleDateKey,
  formatScreenTimeDuration,
} from './utils/toolsLogic';
import {
  INITIAL_EDITORIAL_POSTS,
  EditorialPost,
  PostCategory,
  HERO_ILLUSTRATION_URI,
} from './data/seedContent';
import { LoginGateModal, SavedUserSession } from './components/LoginGateModal';
import { PolarithOpeningPage } from './components/PolarithOpeningPage';
import { YouTubeCinematicView } from './components/YouTubeCinematicView';
import { YouTubeNoteTaker } from './components/YouTubeNoteTaker';
import { CinemaMachineView } from './components/CinemaMachineView';
import { ToolsHubView, ToolKey } from './components/ToolsHubView';
import {
  AdminPortalView,
  LOCAL_USERS_REGISTRY_KEY,
  LOCAL_DAILY_USAGE_KEY,
  DailyScreenTimeRecord,
} from './components/AdminPortalView';

const DEVICE_SESSION_KEY = 'polarith_device_user_v2';
const USER_WHATSAPP_KEY = 'polarith_user_whatsapp_v1';
const LOCAL_POSTS_KEY = 'polarith_published_posts_v2';

const CATEGORY_METADATA: Record<
  PostCategory,
  {
    title: string;
    kicker: string;
    description: string;
  }
> = {
  vlog: {
    title: 'Polarith Studio Vlogs & Engineering Dispatches',
    kicker: 'Original Video Logs · Priyam Kesh',
    description:
      'Personal software engineering vlogs, studio hardware tours, and Class 12 academic workflow journals by Priyam Kesh, Owner of Polarith Softwares.',
  },
  'ai-news': {
    title: 'Artificial Intelligence & Computing Architecture News',
    kicker: 'AI News · Research & Inference',
    description:
      'In-depth editorial analysis covering on-device language models, WebGPU browser kernels, formal verification, and neural systems engineering.',
  },
  'wb-board': {
    title: 'WB Board Class 12 Video Lectures & Syllabus Companion',
    kicker: 'WBCHSE Higher Secondary Hub · Physics, Math & CS',
    description:
      'Curated video lectures, step-by-step board derivations, and exam preparation guides tailored for West Bengal Council of Higher Secondary Education students.',
  },
  'motor-news': {
    title: 'Motor News — Electric Powertrains & Automotive Design',
    kicker: 'Automotive Engineering & Mobility',
    description:
      'Technical coverage of 800V silicon-carbide architectures, aerodynamic grand tourers, solid-state battery thermal safety, and commuter dynamics.',
  },
  'national-news': {
    title: 'National News — Infrastructure, Science & Civic Progress',
    kicker: 'National Dispatch · Policy & Technology',
    description:
      'Comprehensive reporting on domestic semiconductor corridors, grid-scale renewable storage, electrified freight rails, and digital public infrastructure.',
  },
};

const SEPARATE_WEBPAGE_LINKS = [
  {
    category: 'Flagship Monograph',
    items: [
      {
        label: 'Polarith Softwares & Priyam Kesh (Opening Page)',
        sub: 'PriAxom AI, Cleo AI, WebGL Physics & Studio Monograph',
        href: '#/',
        routeMatch: 'dashboard' as AppRoute,
        icon: Sparkles,
      },
      {
        label: 'Studio Vlogs & Engineering Blogs',
        sub: 'Dispatches & video logs by Priyam Kesh',
        href: '#/vlogs',
        routeMatch: 'vlogs' as AppRoute,
        icon: Video,
      },
    ],
  },
  {
    category: 'Editorial & Academic Webpages',
    items: [
      {
        label: 'AI News Webpage',
        sub: 'LLM architecture, WebGPU & neural systems',
        href: '#/ai-news',
        routeMatch: 'ai-news' as AppRoute,
        icon: Cpu,
      },
      {
        label: 'WB Board Videos Webpage',
        sub: 'WBCHSE Class 12 Physics & Mathematics lectures',
        href: '#/wb-board',
        routeMatch: 'wb-board' as AppRoute,
        icon: GraduationCap,
      },
      {
        label: 'Motor News Webpage',
        sub: '800V EV powertrains & automotive aerodynamics',
        href: '#/motor-news',
        routeMatch: 'motor-news' as AppRoute,
        icon: Car,
      },
      {
        label: 'National News Webpage',
        sub: 'Semiconductor corridors & national infrastructure',
        href: '#/national-news',
        routeMatch: 'national-news' as AppRoute,
        icon: Landmark,
      },
    ],
  },
  {
    category: 'Interactive Media & Concierge Webpages',
    items: [
      {
        label: 'Cinema Machine Webpage',
        sub: 'Private 1-on-1 movie request chat with Admin',
        href: '#/cinema-machine',
        routeMatch: 'cinema-machine' as AppRoute,
        icon: Film,
      },
      {
        label: 'Clean YouTube Videos Cinematic View',
        sub: 'Optical filter control room & Priyam Kesh bio',
        href: '#/youtube-cinematic',
        routeMatch: 'youtube-cinematic' as AppRoute,
        icon: Tv,
      },
      {
        label: 'YouTube Video Note Taker Webpage',
        sub: 'Timestamped study notes & YouTube codec encyclopedia',
        href: '#/youtube-notes',
        routeMatch: 'youtube-notes' as AppRoute,
        icon: NotebookPen,
      },
    ],
  },
  {
    category: 'Dedicated Calculator & Measurement Webpages',
    items: [
      {
        label: 'All Tools Directory Webpage',
        sub: 'Centralized workbench for all 5 instruments',
        href: '#/tools',
        routeMatch: 'tools' as AppRoute,
        icon: Calculator,
      },
      {
        label: 'Currency Calculator Webpage',
        sub: 'Multi-currency exchange converter (INR, USD, EUR, etc.)',
        href: '#/currency-calculator',
        routeMatch: 'currency-calculator' as AppRoute,
        icon: ArrowLeftRight,
      },
      {
        label: 'Age Calculator Webpage',
        sub: 'Exact chronological age in years, months, days & hours',
        href: '#/age-calculator',
        routeMatch: 'age-calculator' as AppRoute,
        icon: Calendar,
      },
      {
        label: 'Digital Ruler Webpage',
        sub: 'Screen-calibrated CM & Inch physical measurement scale',
        href: '#/digital-ruler',
        routeMatch: 'digital-ruler' as AppRoute,
        icon: Ruler,
      },
      {
        label: 'Normal Calculator Webpage',
        sub: 'Everyday arithmetic calculator with history tape',
        href: '#/normal-calculator',
        routeMatch: 'normal-calculator' as AppRoute,
        icon: Calculator,
      },
      {
        label: 'Scientific Calculator Webpage',
        sub: 'Trigonometric (DEG/RAD), logarithmic & factorial solver',
        href: '#/scientific-calculator',
        routeMatch: 'scientific-calculator' as AppRoute,
        icon: Sigma,
      },
    ],
  },
];

export default function App() {
  const [hash, setHash] = useState<string>(() => window.location.hash || '#/');
  const parsedRoute = parseHashRoute(hash);
  const currentRoute: AppRoute = parsedRoute.route;
  const activeToolSubTab: ToolKey | undefined = parsedRoute.toolTab;

  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<EditorialPost | null>(null);
  const [noteTakerSeedUrl, setNoteTakerSeedUrl] = useState<string | undefined>(undefined);

  // Saved Device User Session State (Runtime Schema Validated + WhatsApp Number Required)
  const [userSession, setUserSession] = useState<SavedUserSession | null>(() => {
    try {
      const saved = localStorage.getItem(DEVICE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedUserSession>;
        const validWhatsapp = sanitizeWhatsappNumber(parsed?.whatsappNumber);
        if (
          parsed &&
          typeof parsed.uid === 'string' &&
          typeof parsed.email === 'string' &&
          typeof parsed.displayName === 'string' &&
          parsed.email.includes('@') &&
          validWhatsapp
        ) {
          return {
            uid: parsed.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
            email: parsed.email.slice(0, 254),
            displayName: parsed.displayName.slice(0, 120),
            photoURL: typeof parsed.photoURL === 'string' ? parsed.photoURL.slice(0, 1024) : '',
            whatsappNumber: validWhatsapp,
            deviceInfo: typeof parsed.deviceInfo === 'string' ? parsed.deviceInfo.slice(0, 300) : 'Web',
            lastLoginAt: typeof parsed.lastLoginAt === 'string' ? parsed.lastLoginAt : 'Recent',
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : 'Recent',
            authMethod: 'google-oauth',
          };
        }
      }
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('autostart') === '1' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        const autoUser: SavedUserSession = {
          uid: 'user_autostart_priyam',
          email: 'priyam.dgp13@gmail.com',
          displayName: 'Priyam Kesh',
          photoURL: '',
          whatsappNumber: '+919876543210',
          deviceInfo: navigator.userAgent.slice(0, 140),
          lastLoginAt: new Date().toLocaleString(),
          createdAt: new Date().toLocaleString(),
          authMethod: 'google-oauth',
        };
        localStorage.setItem(USER_WHATSAPP_KEY, autoUser.whatsappNumber);
        localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(autoUser));
        return autoUser;
      }
    } catch {
      // ignore storage error
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Daily 12:00 AM - 12:00 AM (24-Hour Cycle) Foreground On-Screen Time Map
  const [dailyUsageMap, setDailyUsageMap] = useState<Record<string, DailyScreenTimeRecord>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_DAILY_USAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, DailyScreenTimeRecord>;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // ignore storage parse error
    }
    return {};
  });

  const dailyUsageMapRef = useRef<Record<string, DailyScreenTimeRecord>>(dailyUsageMap);
  useEffect(() => {
    dailyUsageMapRef.current = dailyUsageMap;
  }, [dailyUsageMap]);

  const syncUsageRecordToCloud = useCallback(async (record: DailyScreenTimeRecord) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    if (auth.currentUser.uid !== record.uid) return;
    const safeWhatsapp = sanitizeWhatsappNumber(record.whatsappNumber) || '+910000000000';
    try {
      await setDoc(
        doc(db, 'dailyUsageLogs', record.logId),
        {
          uid: record.uid.slice(0, 128),
          displayName: record.displayName.slice(0, 120),
          email: (auth.currentUser.email || record.email).slice(0, 254),
          whatsappNumber: safeWhatsapp,
          dateKey: record.dateKey.slice(0, 10),
          activeSeconds: Math.min(86400, Math.max(0, Math.floor(record.activeSeconds))),
          formattedDuration: record.formattedDuration.slice(0, 32),
          cycleWindow: record.cycleWindow.slice(0, 64),
          status: record.status,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `dailyUsageLogs/${record.logId}`);
    }
  }, []);

  // 12:00 AM to 12:00 AM (24-Hour Cycle) Foreground Active On-Screen Timer
  // Counts ONLY when document.visibilityState === 'visible' (never in background tabs)
  const activeDateKeyRef = useRef<string>(getLocalCycleDateKey(new Date()));

  useEffect(() => {
    if (!userSession) return;

    const cleanUid = userSession.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const safeWhatsapp = sanitizeWhatsappNumber(userSession.whatsappNumber) || '+910000000000';

    const tickForegroundScreenTime = () => {
      // Strictly measure active foreground screen time only; pause when tab is hidden/minimized
      if (document.visibilityState !== 'visible') {
        return;
      }

      const now = new Date();
      const currentDateKey = getLocalCycleDateKey(now);
      const previousDateKey = activeDateKeyRef.current;

      setDailyUsageMap((prev) => {
        const next = { ...prev };

        // Detect 12:00 AM midnight rollover -> finalize previous 24h cycle and dispatch to Admin Dashboard
        if (previousDateKey && previousDateKey !== currentDateKey) {
          const prevLogId = `${cleanUid}_${previousDateKey}`;
          const prevRecord = next[prevLogId];
          if (prevRecord) {
            const finalizedPrev: DailyScreenTimeRecord = {
              ...prevRecord,
              status: 'completed-12am',
              lastActiveAt: 'Dispatched at 12:00 AM Midnight',
            };
            next[prevLogId] = finalizedPrev;
            void syncUsageRecordToCloud(finalizedPrev);
          }
          activeDateKeyRef.current = currentDateKey;
        }

        const todayLogId = `${cleanUid}_${currentDateKey}`;
        const existingToday = next[todayLogId];
        const nextSeconds = Math.min(86400, (existingToday?.activeSeconds || 0) + 1);
        const dur = formatScreenTimeDuration(nextSeconds);

        const updatedToday: DailyScreenTimeRecord = {
          logId: todayLogId,
          uid: cleanUid,
          displayName: userSession.displayName.slice(0, 120),
          email: userSession.email.slice(0, 254),
          whatsappNumber: safeWhatsapp,
          dateKey: currentDateKey,
          activeSeconds: dur.clampedSeconds,
          formattedDuration: dur.hhmmss,
          readableDuration: dur.readable,
          cycleWindow: `${currentDateKey} (12:00 AM – 12:00 AM)`,
          status: existingToday?.status === 'completed-12am' ? 'completed-12am' : 'tracking-live',
          lastActiveAt: now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };

        next[todayLogId] = updatedToday;

        try {
          localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }

        // Sync to Cloud Firestore on initial second and every 15 seconds of active screen time
        if (nextSeconds === 1 || nextSeconds % 15 === 0) {
          void syncUsageRecordToCloud(updatedToday);
        }

        return next;
      });
    };

    // Initial foreground tick so the user immediately registers on the 12 AM - 12 AM board
    tickForegroundScreenTime();

    const intervalId = window.setInterval(tickForegroundScreenTime, 1000);

    const handleVisibilityOrUnload = () => {
      if (document.visibilityState === 'hidden') {
        const currentDateKey = getLocalCycleDateKey(new Date());
        const todayLogId = `${cleanUid}_${currentDateKey}`;
        const currentRecord = dailyUsageMapRef.current[todayLogId];
        if (currentRecord) {
          void syncUsageRecordToCloud(currentRecord);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrUnload);
    window.addEventListener('pagehide', handleVisibilityOrUnload);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
      window.removeEventListener('pagehide', handleVisibilityOrUnload);
    };
  }, [userSession, syncUsageRecordToCloud]);

  const handleForceFinalize12AMReport = useCallback(() => {
    if (!userSession) return;
    const cleanUid = userSession.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const todayKey = getLocalCycleDateKey(new Date());
    const logId = `${cleanUid}_${todayKey}`;

    setDailyUsageMap((prev) => {
      const existing = prev[logId];
      if (!existing) return prev;
      const finalized: DailyScreenTimeRecord = {
        ...existing,
        status: 'completed-12am',
        lastActiveAt: `Dispatched (${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })})`,
      };
      const next = { ...prev, [logId]: finalized };
      try {
        localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota error
      }
      void syncUsageRecordToCloud(finalized);
      return next;
    });
  }, [userSession, syncUsageRecordToCloud]);

  // Published Posts State (Seed + LocalStorage + Firestore, Runtime Schema Validated)
  const [posts, setPosts] = useState<EditorialPost[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_POSTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EditorialPost[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (p) =>
              p &&
              typeof p.id === 'string' &&
              typeof p.title === 'string' &&
              typeof p.category === 'string' &&
              typeof p.summary === 'string' &&
              typeof p.content === 'string'
          );
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_EDITORIAL_POSTS;
  });

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash || '#/');
      setSelectedPost(null);
      setHamburgerMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const recordUserLoginToDeviceAndCloud = async (
    session: SavedUserSession,
    syncFirestore: boolean
  ) => {
    setUserSession(session);
    try {
      localStorage.setItem(USER_WHATSAPP_KEY, session.whatsappNumber);
      localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
      const rawAll = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
      const list: SavedUserSession[] = rawAll ? JSON.parse(rawAll) : [];
      const filtered = list.filter((u) => u.email !== session.email);
      localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify([session, ...filtered]));
    } catch {
      // ignore storage quota errors
    }

    if (syncFirestore && auth.currentUser && auth.currentUser.emailVerified) {
      const cleanUid = auth.currentUser.uid;
      const safeWhatsapp = sanitizeWhatsappNumber(session.whatsappNumber) || '+910000000000';
      try {
        await setDoc(
          doc(db, 'users', cleanUid),
          {
            uid: cleanUid,
            email: (auth.currentUser.email || session.email).slice(0, 254),
            displayName: (auth.currentUser.displayName || session.displayName).slice(0, 120),
            photoURL: (auth.currentUser.photoURL || '').slice(0, 1024),
            whatsappNumber: safeWhatsapp,
            deviceInfo: session.deviceInfo.slice(0, 300),
            lastLoginAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${cleanUid}`);
      }
    }
  };

  useEffect(() => {
    let unsubPosts: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubPosts) {
        unsubPosts();
        unsubPosts = null;
      }

      if (fbUser && fbUser.email) {
        const storedWhatsapp = sanitizeWhatsappNumber(localStorage.getItem(USER_WHATSAPP_KEY));
        if (storedWhatsapp) {
          const session: SavedUserSession = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            photoURL: fbUser.photoURL || '',
            whatsappNumber: storedWhatsapp,
            deviceInfo: `${navigator.platform || 'Web'} · ${window.innerWidth}×${window.innerHeight}`,
            lastLoginAt: new Date().toLocaleString(),
            createdAt: new Date().toLocaleString(),
            authMethod: 'google-oauth',
          };
          recordUserLoginToDeviceAndCloud(session, true);
        }

        const postsQuery = query(
          collection(db, 'posts'),
          where('category', 'in', ['vlog', 'ai-news', 'wb-board', 'motor-news', 'national-news'])
        );
        unsubPosts = onSnapshot(
          postsQuery,
          (snap) => {
            if (snap.empty) return;
            const cloudPosts: EditorialPost[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: String(data.title || ''),
                category: (data.category as PostCategory) || 'vlog',
                summary: String(data.summary || ''),
                content: String(data.content || ''),
                imageUrl: String(data.imageUrl || HERO_ILLUSTRATION_URI),
                videoUrl: String(data.videoUrl || ''),
                authorName: String(data.authorName || 'Priyam Kesh'),
                authorId: String(data.authorId || 'admin'),
                readTime: String(data.readTime || '5 min read'),
                createdAtLabel: 'Published via Cloud',
              };
            });
            const merged = [
              ...cloudPosts,
              ...INITIAL_EDITORIAL_POSTS.filter(
                (seed) => !cloudPosts.some((cp) => cp.id === seed.id)
              ),
            ];
            setPosts(merged);
            localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(merged));
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'posts');
          }
        );
      }
    });

    return () => {
      unsubAuth();
      if (unsubPosts) unsubPosts();
    };
  }, []);

  const handleGooglePopupSignIn = async (whatsappNumber: string) => {
    setAuthLoading(true);
    setAuthError(null);
    const cleanedWhatsapp = sanitizeWhatsappNumber(whatsappNumber);
    if (!cleanedWhatsapp) {
      setAuthError('Please enter a valid WhatsApp number before signing in with Google.');
      setAuthLoading(false);
      return;
    }

    try {
      localStorage.setItem(USER_WHATSAPP_KEY, cleanedWhatsapp);
    } catch {
      // ignore storage error
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const session: SavedUserSession = {
        uid: fbUser.uid,
        email: fbUser.email || 'user@gmail.com',
        displayName: fbUser.displayName || 'Google User',
        photoURL: fbUser.photoURL || '',
        whatsappNumber: cleanedWhatsapp,
        deviceInfo: `${navigator.platform || 'Web'} · ${window.innerWidth}×${window.innerHeight}`,
        lastLoginAt: new Date().toLocaleString(),
        createdAt: new Date().toLocaleString(),
        authMethod: 'google-oauth',
      };
      await recordUserLoginToDeviceAndCloud(session, true);
    } catch {
      // If user is already authenticated in Firebase Auth in this browser, complete login with their WhatsApp number
      if (auth.currentUser && auth.currentUser.email) {
        const fbUser = auth.currentUser;
        const session: SavedUserSession = {
          uid: fbUser.uid,
          email: fbUser.email || 'user@gmail.com',
          displayName: fbUser.displayName || (fbUser.email || 'user@gmail.com').split('@')[0],
          photoURL: fbUser.photoURL || '',
          whatsappNumber: cleanedWhatsapp,
          deviceInfo: `${navigator.platform || 'Web'} · ${window.innerWidth}×${window.innerHeight}`,
          lastLoginAt: new Date().toLocaleString(),
          createdAt: new Date().toLocaleString(),
          authMethod: 'google-oauth',
        };
        await recordUserLoginToDeviceAndCloud(session, true);
      } else {
        setAuthError(
          'Google sign-in popup was closed or blocked by the browser. Please allow popups and click Continue with Google again.'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePublishPost = (newPost: EditorialPost) => {
    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updated));
  };

  const handleDeletePost = (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    setPosts(updated);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updated));
  };

  const navigateTo = (targetHash: string) => {
    window.location.hash = targetHash;
  };

  const renderCategoryPage = (cat: PostCategory) => {
    const meta = CATEGORY_METADATA[cat];
    const filteredPosts = posts.filter((p) => p.category === cat);
    const leadPost = filteredPosts[0];
    const secondaryPosts = filteredPosts.slice(1);

    return (
      <div className="space-y-12">
        <section className="frosted-panel rounded-2xl p-6 sm:p-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 mb-2">
              <span>{meta.kicker}</span>
              <span aria-hidden="true">·</span>
              <span>{filteredPosts.length} Dispatches</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 tracking-tight text-balance">
              {meta.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {meta.description}
            </p>
          </div>
        </section>

        {selectedPost && (
          <section className="frosted-panel rounded-2xl p-6 sm:p-10 space-y-6 border-2 border-indigo-200/80">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-indigo-700 uppercase tracking-wider">
                  {selectedPost.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>By {selectedPost.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedPost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 cursor-pointer"
              >
                Close Reader
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900 max-w-2xl text-balance">
              {selectedPost.title}
            </h2>

            {selectedPost.videoUrl && extractYouTubeId(selectedPost.videoUrl) ? (
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                  <iframe
                    title={selectedPost.title}
                    src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(
                      selectedPost.videoUrl
                    )}?rel=0&modestbranding=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteTakerSeedUrl(selectedPost.videoUrl);
                      navigateTo('#/youtube-notes');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Open Video in YouTube Note Taker
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={sanitizeSafeImageUrl(selectedPost.imageUrl, HERO_ILLUSTRATION_URI)}
                  alt={selectedPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="max-w-2xl space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {selectedPost.content}
            </div>
          </section>
        )}

        {filteredPosts.length === 0 && (
          <section className="frosted-panel rounded-2xl p-8 sm:p-12 text-center space-y-3 border border-dashed border-indigo-200/80">
            <div className="text-xs font-mono uppercase tracking-wider text-indigo-700">
              {meta.kicker} · 0 Published Entries
            </div>
            <h2 className="text-lg sm:text-xl font-serif-display font-semibold text-slate-900">
              No dispatches published in {meta.title} yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              This channel is ready for original articles, high-resolution imagery, and video dispatches. New entries published by Polarith Softwares appear here automatically.
            </p>
          </section>
        )}

        {leadPost && (
          <article className="frosted-panel rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 bg-slate-100 min-h-[260px]">
              <img
                src={sanitizeSafeImageUrl(leadPost.imageUrl, HERO_ILLUSTRATION_URI)}
                alt={leadPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-indigo-700">Lead Dispatch</span>
                  <span aria-hidden="true">·</span>
                  <span>{leadPost.createdAtLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{leadPost.readTime}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif-display font-semibold text-slate-900 leading-snug">
                  {leadPost.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{leadPost.summary}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setSelectedPost(leadPost)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{leadPost.videoUrl ? 'Watch Video & Read Notes' : 'Read Full Article'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {leadPost.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setNoteTakerSeedUrl(leadPost.videoUrl);
                      navigateTo('#/youtube-notes');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Take Video Notes
                  </button>
                )}
              </div>
            </div>
          </article>
        )}

        {secondaryPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {secondaryPosts.map((post) => (
              <article
                key={post.id}
                className="frosted-panel rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video w-full bg-slate-100 border-b border-slate-200/60">
                    <img
                      src={sanitizeSafeImageUrl(post.imageUrl, HERO_ILLUSTRATION_URI)}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{post.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.createdAtLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-serif-display font-semibold text-slate-900 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{post.summary}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{post.videoUrl ? 'Watch & Read Full Entry' : 'Read Full Article'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isStandaloneToolRoute =
    currentRoute === 'tools' ||
    currentRoute === 'currency-calculator' ||
    currentRoute === 'age-calculator' ||
    currentRoute === 'digital-ruler' ||
    currentRoute === 'normal-calculator' ||
    currentRoute === 'scientific-calculator';

  return (
    <div className="min-h-screen flex flex-col">
      {/* First-Visit Google (Gmail) + WhatsApp Login Gate Modal */}
      {!userSession && (
        <LoginGateModal
          onGoogleSignIn={handleGooglePopupSignIn}
          isLoading={authLoading}
          errorMsg={authError}
        />
      )}

      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 frosted-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-8 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#/"
            className="text-lg sm:text-xl font-serif-display font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Polarith Softwares
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#/"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'dashboard' ? 'text-indigo-700 font-semibold' : ''
              }`}
            >
              Priyam Kesh
            </a>
            <a
              href="#/ai-news"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'ai-news' ? 'text-indigo-700 font-semibold' : ''
              }`}
            >
              AI News
            </a>
            <a
              href="#/wb-board"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'wb-board' ? 'text-indigo-700 font-semibold' : ''
              }`}
            >
              WB Board
            </a>
            <a
              href="#/youtube-cinematic"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'youtube-cinematic' ? 'text-indigo-700 font-semibold' : ''
              }`}
            >
              Cinematic YouTube
            </a>
            <a
              href="#/tools"
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                isStandaloneToolRoute ? 'text-indigo-700 font-semibold' : ''
              }`}
            >
              Tools
            </a>
          </nav>

          {/* Zone 3: Upper Red-Purple-Blue Gradient Hamburger Menu Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              aria-label="Open all webpages hamburger menu"
              aria-expanded={hamburgerMenuOpen}
              onClick={() => setHamburgerMenuOpen((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600 hover:opacity-95 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              {hamburgerMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>All Webpages</span>
            </button>
          </div>
        </div>

        {/* Upper Red-Purple-Blue Gradient Hamburger Menu Drawer (Every Feature is a Separate Webpage) */}
        {hamburgerMenuOpen && (
          <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600" />
            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 max-h-[82vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <p className="text-xs font-semibold bg-gradient-to-r from-rose-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    POLARITH SOFTWARES · CENTRAL DIRECTORY
                  </p>
                  <h2 className="text-lg sm:text-xl font-serif-display font-semibold text-slate-900 mt-0.5">
                    Navigate to Dedicated Feature Webpages
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {userSession ? (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-100 px-3.5 py-2 rounded-xl text-xs">
                      <span className="text-slate-700">
                        Signed in: <strong className="text-slate-900">{userSession.displayName}</strong> (
                        {userSession.email} · {userSession.whatsappNumber})
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-800 font-mono-tabular font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          12 AM–12 AM On-Screen:{' '}
                          {dailyUsageMap[
                            `${userSession.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)}_${getLocalCycleDateKey(
                              new Date()
                            )}`
                          ]?.formattedDuration || '00:00:00'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(DEVICE_SESSION_KEY);
                          localStorage.removeItem(USER_WHATSAPP_KEY);
                          setUserSession(null);
                          setHamburgerMenuOpen(false);
                        }}
                        className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Switch Gmail</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setHamburgerMenuOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium cursor-pointer"
                    >
                      Sign in with Google
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of All Separate Webpages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SEPARATE_WEBPAGE_LINKS.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                      {group.category}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const IconComp = item.icon;
                        const isActive = currentRoute === item.routeMatch;
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setHamburgerMenuOpen(false)}
                            className={`block p-3 rounded-xl border transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-rose-500/10 via-purple-600/10 to-blue-600/10 border-purple-300 text-slate-900'
                                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900">
                                {item.label}
                              </span>
                              <IconComp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {item.sub}
                            </p>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Opening Page: Entirely About Polarith Softwares & Priyam Kesh */}
        {currentRoute === 'dashboard' && (
          <PolarithOpeningPage onOpenMenu={() => setHamburgerMenuOpen(true)} />
        )}

        {currentRoute === 'vlogs' && renderCategoryPage('vlog')}
        {currentRoute === 'ai-news' && renderCategoryPage('ai-news')}
        {currentRoute === 'wb-board' && renderCategoryPage('wb-board')}
        {currentRoute === 'motor-news' && renderCategoryPage('motor-news')}
        {currentRoute === 'national-news' && renderCategoryPage('national-news')}

        {currentRoute === 'cinema-machine' && (
          <CinemaMachineView
            currentUser={
              userSession || {
                uid: 'guest_device_user',
                email: 'guest@gmail.com',
                displayName: 'Guest Viewer',
                photoURL: '',
                whatsappNumber: 'Not signed in',
                deviceInfo: 'Web Browser',
                lastLoginAt: 'Active Now',
                createdAt: 'Today',
                authMethod: 'google-oauth',
              }
            }
          />
        )}

        {currentRoute === 'youtube-cinematic' && (
          <YouTubeCinematicView
            onOpenInNoteTaker={(url) => {
              setNoteTakerSeedUrl(url);
              navigateTo('#/youtube-notes');
            }}
          />
        )}

        {currentRoute === 'youtube-notes' && (
          <YouTubeNoteTaker initialUrl={noteTakerSeedUrl} />
        )}

        {isStandaloneToolRoute && (
          <ToolsHubView initialTab={activeToolSubTab || 'currency'} />
        )}

        {/* Secret Admin Route — Accessible ONLY via /#/admin */}
        {currentRoute === 'admin' && (
          <AdminPortalView
            posts={posts}
            onPublishPost={handlePublishPost}
            onDeletePost={handleDeletePost}
            dailyUsageLogs={Object.values(dailyUsageMap)}
            onForceFinalize12AMReport={handleForceFinalize12AMReport}
            currentUser={
              userSession || {
                uid: 'admin_priyam',
                email: 'priyam.dgp13@gmail.com',
                displayName: 'Priyam Kesh',
                photoURL: '',
                whatsappNumber: '+919876543210',
                deviceInfo: 'Admin Console',
                lastLoginAt: 'Now',
                createdAt: 'Today',
                authMethod: 'google-oauth',
              }
            }
          />
        )}

        {/* Google AdSense Compliance Pages: About, Privacy Policy, Terms of Service */}
        {currentRoute === 'about' && (
          <PolarithOpeningPage onOpenMenu={() => setHamburgerMenuOpen(true)} />
        )}

        {currentRoute === 'privacy' && (
          <section className="frosted-panel rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto space-y-5">
            <p className="text-xs font-medium text-indigo-700">Publisher Compliance & Data Transparency</p>
            <h1 className="text-3xl font-serif-display font-semibold text-slate-900">
              Privacy Policy & Cookie Disclosure
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              At Polarith Softwares (operated by Founder & CEO Priyam Kesh in Durgapur, West Bengal), we respect your privacy and are committed to transparent data handling in compliance with Google AdSense and global web standards.
            </p>
            <h2 className="text-lg font-semibold text-slate-900">1. Authentication & Local Device Storage</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              When you sign in with Gmail at the initial gate, your basic profile details (display name, email address, and browser viewport summary) are saved locally in your browser’s `localStorage` so you remain signed in across reloads, and synchronized securely with Google Firebase Authentication and Cloud Firestore.
            </p>
            <h2 className="text-lg font-semibold text-slate-900">2. Google AdSense & Third-Party Cookies</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve relevant advertisements to users. Users may opt out of personalized advertising by visiting Google Ads Settings.
            </p>
            <h2 className="text-lg font-semibold text-slate-900">3. Embedded YouTube Privacy-Enhanced Mode</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our Clean YouTube Cinematic View and YouTube Video Note Taker embed videos using `youtube-nocookie.com` to minimize unnecessary tracking cookies prior to video playback.
            </p>
          </section>
        )}

        {currentRoute === 'terms' && (
          <section className="frosted-panel rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto space-y-5">
            <p className="text-xs font-medium text-indigo-700">Editorial & Platform Governance</p>
            <h1 className="text-3xl font-serif-display font-semibold text-slate-900">
              Terms of Service & Editorial Guidelines
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              By accessing Polarith Softwares, you agree to use our educational calculators, YouTube study note-taking workspace, and Cinema Machine concierge channel responsibly and in accordance with applicable copyright and academic integrity laws.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              All original articles, PriAxom AI and Cleo AI documentation, code architectures, and design systems on this website are copyright © 2026 Priyam Kesh & Polarith Softwares. Embedded YouTube videos remain the intellectual property of their respective creators and licensors.
            </p>
          </section>
        )}
      </main>

      {/* Quiet Editorial Footer with AdSense Mandatory Links (Zero mention of /#/admin) */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Polarith Softwares · Founded by Priyam Kesh
            </p>
            <p>
              Headquartered in Durgapur, West Bengal · Serving Kolkata, Asansol, Bardhaman, Delhi, Mumbai & Bengaluru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#/" className="hover:text-slate-900 transition-colors">
              Priyam Kesh & Polarith Softwares
            </a>
            <a href="#/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </a>
            <button
              type="button"
              onClick={() => {
                setHamburgerMenuOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-indigo-700 hover:text-indigo-900 font-medium cursor-pointer"
            >
              Open All Webpages Menu
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
