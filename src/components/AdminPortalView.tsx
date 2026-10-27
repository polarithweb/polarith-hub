import React, { useState, useEffect } from 'react';
import {
  FilePlus2,
  Users,
  MessageSquare,
  Upload,
  Trash2,
  Send,
  CheckCircle2,
  Download,
  Shield,
  Clock,
  Eye,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, ADMIN_EMAIL, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { EditorialPost, PostCategory, HERO_ILLUSTRATION_URI } from '../data/seedContent';
import { SavedUserSession } from './LoginGateModal';
import {
  LOCAL_CINEMA_THREADS_KEY,
  LocalCinemaThread,
  CinemaChatMessage,
} from './CinemaMachineView';
import {
  generateSecureId,
  sanitizeSafeExternalUrl,
  sanitizeSafeImageUrl,
  sanitizeCsvCell,
  extractYouTubeId,
  getLocalCycleDateKey,
  getSecondsUntilNextMidnight,
  formatScreenTimeDuration,
} from '../utils/toolsLogic';

export const LOCAL_USERS_REGISTRY_KEY = 'polarith_all_device_logins_v1';
export const LOCAL_DAILY_USAGE_KEY = 'polarith_daily_screen_time_v1';

export interface DailyScreenTimeRecord {
  logId: string;
  uid: string;
  displayName: string;
  email: string;
  whatsappNumber: string;
  dateKey: string;
  activeSeconds: number;
  formattedDuration: string;
  readableDuration: string;
  cycleWindow: string;
  status: 'tracking-live' | 'completed-12am';
  lastActiveAt: string;
}

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_FILE_BYTES = 220 * 1024; // 220 KB raw -> ~295 KB Base64 (< 350 KB Firestore limit)

interface AdminPortalViewProps {
  posts: EditorialPost[];
  onPublishPost: (post: EditorialPost) => void;
  onDeletePost: (postId: string) => void;
  currentUser: SavedUserSession;
  dailyUsageLogs?: DailyScreenTimeRecord[];
  onForceFinalize12AMReport?: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  posts,
  onPublishPost,
  onDeletePost,
  currentUser,
  dailyUsageLogs = [],
  onForceFinalize12AMReport,
}) => {
  const [adminTab, setAdminTab] = useState<'publish' | 'cinema-chat' | 'users' | 'screen-time'>('publish');

  // 1. Publish Blog / Vlog & Image State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PostCategory>('vlog');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [readTime, setReadTime] = useState('5 min read');
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // 2. Registered / Logged-in Users State
  const [registeredUsers, setRegisteredUsers] = useState<SavedUserSession[]>([]);

  // 3. Cinema Machine Admin Threads State
  const [threads, setThreads] = useState<Record<string, LocalCinemaThread>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminMovieTitle, setAdminMovieTitle] = useState('');
  const [adminMovieLink, setAdminMovieLink] = useState('');
  const [replyStatus, setReplyStatus] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  // 4. Daily 12 AM - 12 AM Screen Time Reports State (Cloud + Local Merged)
  const [cloudUsageLogs, setCloudUsageLogs] = useState<DailyScreenTimeRecord[]>([]);
  const [secondsToMidnight, setSecondsToMidnight] = useState<number>(() =>
    getSecondsUntilNextMidnight(new Date())
  );
  const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null);

  const isAuthorizedAdminSession =
    currentUser.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const isVerifiedFirebaseAdmin =
    auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    auth.currentUser?.emailVerified === true;

  // Live 1-second countdown to next 12:00 AM midnight report dispatch
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsToMidnight(getSecondsUntilNextMidnight(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Load Users Registry, Cinema Threads, & Daily 12AM Screen Time Logs from LocalStorage + Firestore if verified admin
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
      const localList: SavedUserSession[] = rawUsers ? JSON.parse(rawUsers) : [currentUser];
      setRegisteredUsers(localList);
    } catch {
      setRegisteredUsers([currentUser]);
    }

    try {
      const rawThreads = localStorage.getItem(LOCAL_CINEMA_THREADS_KEY);
      if (rawThreads) {
        const parsed = JSON.parse(rawThreads) as Record<string, LocalCinemaThread>;
        setThreads(parsed);
        const firstKey = Object.keys(parsed)[0];
        if (firstKey) setSelectedUserId(firstKey);
      }
    } catch {
      // ignore parse error
    }

    if (!isVerifiedFirebaseAdmin) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        if (snap.empty) return;
        const cloudUsers: SavedUserSession[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: String(data.uid || d.id),
            email: String(data.email || ''),
            displayName: String(data.displayName || 'User'),
            photoURL: String(data.photoURL || ''),
            whatsappNumber: String(data.whatsappNumber || 'Not provided'),
            deviceInfo: String(data.deviceInfo || 'Browser Session'),
            lastLoginAt: 'Synced via Firebase Auth',
            createdAt: 'Registered',
            authMethod: 'google-oauth',
          };
        });
        setRegisteredUsers(cloudUsers);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    const unsubChats = onSnapshot(
      collection(db, 'cinemaChats'),
      (snap) => {
        if (snap.empty) return;
        setThreads((prev) => {
          const next = { ...prev };
          snap.docs.forEach((d) => {
            const data = d.data();
            const uid = d.id;
            next[uid] = {
              userId: uid,
              userName: String(data.userName || 'User'),
              userEmail: String(data.userEmail || ''),
              lastMessage: String(data.lastMessage || ''),
              updatedAtLabel: 'Live Cloud Thread',
              messages: next[uid]?.messages || [],
            };
          });
          return next;
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cinemaChats');
      }
    );

    const unsubUsage = onSnapshot(
      collection(db, 'dailyUsageLogs'),
      (snap) => {
        if (snap.empty) return;
        const records: DailyScreenTimeRecord[] = snap.docs.map((d) => {
          const data = d.data();
          const sec = typeof data.activeSeconds === 'number' ? data.activeSeconds : 0;
          const dur = formatScreenTimeDuration(sec);
          const dateKey = String(data.dateKey || getLocalCycleDateKey(new Date()));
          return {
            logId: d.id,
            uid: String(data.uid || ''),
            displayName: String(data.displayName || 'User'),
            email: String(data.email || ''),
            whatsappNumber: String(data.whatsappNumber || 'Not provided'),
            dateKey,
            activeSeconds: dur.clampedSeconds,
            formattedDuration: dur.hhmmss,
            readableDuration: dur.readable,
            cycleWindow: String(data.cycleWindow || `${dateKey} (12:00 AM – 12:00 AM)`),
            status: data.status === 'completed-12am' ? 'completed-12am' : 'tracking-live',
            lastActiveAt: 'Synced via Cloud',
          };
        });
        setCloudUsageLogs(records);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'dailyUsageLogs');
      }
    );

    return () => {
      unsubUsers();
      unsubChats();
      unsubUsage();
    };
  }, [currentUser, isVerifiedFirebaseAdmin]);

  // Listen to messages of selected thread if Firebase Admin
  useEffect(() => {
    if (!isVerifiedFirebaseAdmin || !selectedUserId) return;
    const q = query(
      collection(db, 'cinemaChats', selectedUserId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) return;
        const msgs: CinemaChatMessage[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            chatOwnerId: String(data.chatOwnerId || selectedUserId),
            senderId: String(data.senderId || ''),
            senderName: String(data.senderName || ''),
            senderRole: data.senderRole === 'admin' ? 'admin' : 'user',
            text: String(data.text || ''),
            movieTitle: String(data.movieTitle || ''),
            movieLink: String(data.movieLink || ''),
            createdAtLabel: 'Cloud Synced',
          };
        });
        setThreads((prev) => ({
          ...prev,
          [selectedUserId]: {
            ...(prev[selectedUserId] || {
              userId: selectedUserId,
              userName: 'User',
              userEmail: '',
              lastMessage: '',
              updatedAtLabel: 'Now',
            }),
            messages: msgs,
          },
        }));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `cinemaChats/${selectedUserId}/messages`);
      }
    );
    return () => unsub();
  }, [isVerifiedFirebaseAdmin, selectedUserId]);

  // Merge local dailyUsageLogs + cloudUsageLogs, keeping highest activeSeconds per logId
  const mergedUsageLogs: DailyScreenTimeRecord[] = React.useMemo(() => {
    const byId = new Map<string, DailyScreenTimeRecord>();
    for (const item of cloudUsageLogs) {
      byId.set(item.logId, item);
    }
    for (const localItem of dailyUsageLogs) {
      const existing = byId.get(localItem.logId);
      if (
        !existing ||
        localItem.activeSeconds >= existing.activeSeconds ||
        localItem.status === 'completed-12am'
      ) {
        byId.set(localItem.logId, localItem);
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey);
      return b.activeSeconds - a.activeSeconds;
    });
  }, [cloudUsageLogs, dailyUsageLogs]);

  const todayCycleKey = getLocalCycleDateKey(new Date());
  const nextMidnightFormatted = formatScreenTimeDuration(secondsToMidnight).hhmmss;

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPublishError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
      setPublishError('Unsupported image format. Please upload JPEG, PNG, WEBP, or GIF.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setPublishError('Image file exceeds 220 KB cloud limit. Please compress or paste an external HTTPS image URL.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length <= 350000) {
        setImageUrl(reader.result);
      } else {
        setPublishError('Encoded image exceeds maximum size threshold.');
      }
    };
    reader.onerror = () => {
      setPublishError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);
    setPublishStatus(null);

    if (!isAuthorizedAdminSession) {
      setPublishError('Unauthorized: Admin session required.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();
    const trimmedContent = content.trim();
    const trimmedVid = videoUrl.trim();

    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      setPublishError('Headline must be between 3 and 200 characters.');
      return;
    }
    if (trimmedSummary.length < 10 || trimmedSummary.length > 600) {
      setPublishError('Summary must be between 10 and 600 characters.');
      return;
    }
    if (trimmedContent.length < 20 || trimmedContent.length > 25000) {
      setPublishError('Article / Vlog body must be between 20 and 25,000 characters.');
      return;
    }
    if (trimmedVid && !extractYouTubeId(trimmedVid)) {
      setPublishError('Optional Video URL must be a valid YouTube link or 11-character video ID.');
      return;
    }

    const safeImg = imageUrl.trim()
      ? sanitizeSafeImageUrl(imageUrl.trim(), '')
      : HERO_ILLUSTRATION_URI;

    if (imageUrl.trim() && !safeImg) {
      setPublishError('Invalid Image URL. Only HTTPS/HTTP links or verified uploaded images are permitted.');
      return;
    }

    const postId = generateSecureId('post');
    const newPost: EditorialPost = {
      id: postId,
      title: trimmedTitle.slice(0, 200),
      category,
      summary: trimmedSummary.slice(0, 600),
      content: trimmedContent.slice(0, 25000),
      imageUrl: safeImg.slice(0, 350000),
      videoUrl: trimmedVid.slice(0, 500),
      authorName: 'Priyam Kesh',
      authorId: auth.currentUser?.uid || 'admin_priyam',
      readTime: (readTime.trim() || '5 min read').slice(0, 40),
      createdAtLabel: 'Just Published',
    };

    onPublishPost(newPost);

    if (isVerifiedFirebaseAdmin && auth.currentUser) {
      try {
        await setDoc(doc(db, 'posts', postId), {
          title: newPost.title,
          category: newPost.category,
          summary: newPost.summary,
          content: newPost.content,
          imageUrl: newPost.imageUrl,
          videoUrl: newPost.videoUrl,
          authorName: newPost.authorName,
          authorId: auth.currentUser.uid,
          readTime: newPost.readTime,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setPublishStatus('Published live to website and synced to Firebase Firestore.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `posts/${postId}`);
      }
    } else {
      setPublishStatus('Published live to website and saved to device storage.');
    }

    setTitle('');
    setSummary('');
    setContent('');
    setImageUrl('');
    setVideoUrl('');
  };

  const handleSendAdminCinemaLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyStatus(null);
    setReplyError(null);

    if (!isAuthorizedAdminSession) {
      setReplyError('Unauthorized: Admin session required.');
      return;
    }

    const targetUid = (selectedUserId || currentUser.uid).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const trimmedReply = adminReplyText.trim();
    const trimmedTitle = adminMovieTitle.trim();
    const rawLink = adminMovieLink.trim();
    const safeLink = rawLink ? sanitizeSafeExternalUrl(rawLink) : '';

    if (rawLink && !safeLink) {
      setReplyError('Invalid Movie Link: Must be a valid https:// or http:// URL.');
      return;
    }

    if (!trimmedReply && !safeLink) {
      setReplyError('Please provide an admin message or a valid movie URL.');
      return;
    }

    const msgId = generateSecureId('admin_msg');
    const newMsg: CinemaChatMessage = {
      id: msgId,
      chatOwnerId: targetUid,
      senderId: auth.currentUser?.uid || 'admin_priyam',
      senderName: 'Priyam Kesh (Admin)',
      senderRole: 'admin',
      text: (
        trimmedReply ||
        `Here is the requested movie link for "${trimmedTitle || 'your requested film'}". Enjoy watching!`
      ).slice(0, 1500),
      movieTitle: trimmedTitle.slice(0, 200),
      movieLink: safeLink,
      createdAtLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const existingThread = threads[targetUid] || {
      userId: targetUid,
      userName: currentUser.displayName,
      userEmail: currentUser.email,
      lastMessage: '',
      updatedAtLabel: 'Now',
      messages: [],
    };

    const updatedThread: LocalCinemaThread = {
      ...existingThread,
      lastMessage: newMsg.text,
      updatedAtLabel: newMsg.createdAtLabel,
      messages: [...existingThread.messages, newMsg],
    };

    const nextThreads = { ...threads, [targetUid]: updatedThread };
    setThreads(nextThreads);
    localStorage.setItem(LOCAL_CINEMA_THREADS_KEY, JSON.stringify(nextThreads));

    if (isVerifiedFirebaseAdmin && auth.currentUser) {
      try {
        await setDoc(
          doc(db, 'cinemaChats', targetUid),
          {
            userId: targetUid,
            userName: updatedThread.userName.slice(0, 120),
            userEmail: updatedThread.userEmail.slice(0, 254),
            lastMessage: newMsg.text.slice(0, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await setDoc(doc(db, 'cinemaChats', targetUid, 'messages', msgId), {
          chatOwnerId: targetUid,
          senderId: auth.currentUser.uid,
          senderName: 'Priyam Kesh (Admin)',
          senderRole: 'admin',
          text: newMsg.text.slice(0, 1500),
          movieTitle: trimmedTitle.slice(0, 200),
          movieLink: safeLink.slice(0, 1000),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `cinemaChats/${targetUid}/messages/${msgId}`
        );
      }
    }

    setAdminReplyText('');
    setAdminMovieTitle('');
    setAdminMovieLink('');
    setReplyStatus('Movie link & message dispatched to user chat.');
  };

  const handleExportUsersCsv = () => {
    if (!isAuthorizedAdminSession) return;
    const header =
      'UID,Full Name,Gmail Address,WhatsApp Number,Today On-Screen Time (12AM-12AM),Device Info,Last Login\n';
    const rows = registeredUsers
      .map((u) => {
        const todayLog = mergedUsageLogs.find(
          (l) => (l.uid === u.uid || l.email === u.email) && l.dateKey === todayCycleKey
        );
        return [
          sanitizeCsvCell(u.uid),
          sanitizeCsvCell(u.displayName),
          sanitizeCsvCell(u.email),
          sanitizeCsvCell(u.whatsappNumber || 'Not provided'),
          sanitizeCsvCell(todayLog ? `${todayLog.formattedDuration} (${todayLog.readableDuration})` : '00:00:00'),
          sanitizeCsvCell(u.deviceInfo),
          sanitizeCsvCell(u.lastLoginAt),
        ].join(',');
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polarith-login-users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportScreenTimeCsv = () => {
    if (!isAuthorizedAdminSession) return;
    const header =
      'User Name,WhatsApp Number,Gmail Address,12 AM - 12 AM Cycle Date,Active On-Screen Duration (HH:MM:SS),Readable Duration,Active Seconds,12 AM Dispatch Status,Last Screen Activity\n';
    const rows = mergedUsageLogs
      .map((log) =>
        [
          sanitizeCsvCell(log.displayName),
          sanitizeCsvCell(log.whatsappNumber),
          sanitizeCsvCell(log.email),
          sanitizeCsvCell(log.cycleWindow),
          sanitizeCsvCell(log.formattedDuration),
          sanitizeCsvCell(log.readableDuration),
          sanitizeCsvCell(String(log.activeSeconds)),
          sanitizeCsvCell(
            log.status === 'completed-12am'
              ? 'Dispatched at 12:00 AM'
              : 'Tracking Live (Visible Screen Only)'
          ),
          sanitizeCsvCell(log.lastActiveAt),
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polarith-12am-screen-time-${todayCycleKey}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeThreadId = (selectedUserId || currentUser.uid).replace(/[^a-zA-Z0-9_-]/g, '_');
  const activeThread = threads[activeThreadId];

  if (!isAuthorizedAdminSession) {
    return (
      <section className="frosted-panel rounded-2xl p-8 sm:p-12 max-w-xl mx-auto text-center space-y-5 border border-rose-200/80">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-serif-display font-semibold text-slate-900">
          Executive Admin Console Locked
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You are currently signed in as <span className="font-mono-tabular font-semibold text-slate-900">{currentUser.email}</span>. Access to <span className="font-mono-tabular">/#!/admin</span> is restricted exclusively to the verified Polarith Softwares founder account (<span className="font-mono-tabular">{ADMIN_EMAIL}</span>).
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch {
              // ignore popup cancellation
            }
          }}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
        >
          Authenticate with Admin Google Account
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      {/* Admin Header */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 mb-1.5">
              <Shield className="w-4 h-4" />
              <span>Unlisted Route · Accessible Strictly via /#/admin</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900">
              Polarith Studio — Executive Admin Portal
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Publish blogs, vlogs, and images, dispatch movie links in Cinema Machine, inspect user Gmail + WhatsApp records, and review 12:00 AM – 12:00 AM daily active on-screen time reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setAdminTab('publish')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'publish'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FilePlus2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Post Blogs & Images</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('cinema-chat')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'cinema-chat'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cinema Chat Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('screen-time')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'screen-time'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>12 AM – 12 AM Screen Time ({mergedUsageLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('users')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'users'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Login User Details ({registeredUsers.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tab 1: Publish Blogs, Vlogs & Images */}
      {adminTab === 'publish' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreatePost}
            className="lg:col-span-7 frosted-panel rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Publish New Blog, Vlog or Category Dispatch
            </h2>

            {publishError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {publishError}
              </div>
            )}
            {publishStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{publishStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="admin-post-title" className="block text-xs font-medium text-slate-700 mb-1">
                  Post Headline
                </label>
                <input
                  id="admin-post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog or vlog headline..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="admin-post-cat" className="block text-xs font-medium text-slate-700 mb-1">
                  Target Page Category
                </label>
                <select
                  id="admin-post-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="vlog">Studio Vlogs & Blogs</option>
                  <option value="ai-news">AI News</option>
                  <option value="wb-board">WB Board Videos</option>
                  <option value="motor-news">Motor News</option>
                  <option value="national-news">National News</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="admin-post-summary" className="block text-xs font-medium text-slate-700 mb-1">
                Short Summary / Editorial Deck
              </label>
              <input
                id="admin-post-summary"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Concise 1-2 sentence summary for cards..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-post-img" className="block text-xs font-medium text-slate-700 mb-1">
                  Image URL or Upload Image File
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-post-img"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL or upload..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="admin-post-vid" className="block text-xs font-medium text-slate-700 mb-1">
                  Optional YouTube Video URL (For Vlogs / WB Board)
                </label>
                <input
                  id="admin-post-vid"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-post-body" className="block text-xs font-medium text-slate-700 mb-1">
                Full Blog / Vlog Content Body
              </label>
              <textarea
                id="admin-post-body"
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the complete article or video companion notes..."
                className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Publish Post to Live Website
            </button>
          </form>

          {/* Existing Published Posts Manager */}
          <div className="lg:col-span-5 frosted-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Published Posts ({posts.length})</h3>
              <span className="text-xs text-slate-500">Live Inventory</span>
            </div>
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-white/85 border border-slate-200/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-700">
                      {p.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{p.summary}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete post ${p.title}`}
                    onClick={async () => {
                      onDeletePost(p.id);
                      if (isVerifiedFirebaseAdmin) {
                        try {
                          await deleteDoc(doc(db, 'posts', p.id));
                        } catch {
                          // ignore if seed post
                        }
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Cinema Machine Admin Chat & Movie Link Dispatcher */}
      {adminTab === 'cinema-chat' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 frosted-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Active User Cinema Channels
            </h2>
            {Object.keys(threads).length === 0 ? (
              <div className="p-4 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">Default Channel: {currentUser.displayName}</p>
                <p>Send a movie link directly to {currentUser.email} using the dispatcher on the right.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.values(threads).map((t) => (
                  <button
                    key={t.userId}
                    type="button"
                    onClick={() => setSelectedUserId(t.userId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      activeThreadId === t.userId
                        ? 'bg-indigo-50/90 border-indigo-300'
                        : 'bg-white/85 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-900">{t.userName}</span>
                      <span className="text-[11px] font-mono-tabular text-slate-400">
                        {t.updatedAtLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono-tabular">{t.userEmail}</p>
                    <p className="text-xs text-slate-700 mt-1 line-clamp-1">{t.lastMessage}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 frosted-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Admin Movie Link Dispatcher
                </h2>
                <p className="text-xs text-slate-500">
                  Replying to channel: {activeThread?.userName || currentUser.displayName} (
                  {activeThread?.userEmail || currentUser.email})
                </p>
              </div>
            </div>

            {activeThread && activeThread.messages.length > 0 && (
              <div className="max-h-72 overflow-y-auto space-y-3 p-4 rounded-xl bg-white/80 border border-slate-200/80">
                {activeThread.messages.map((m) => (
                  <div key={m.id} className="text-xs space-y-1 pb-2 border-b border-slate-100 last:border-0">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {m.senderName} ({m.senderRole})
                      </span>
                      <span className="font-mono-tabular">{m.createdAtLabel}</span>
                    </div>
                    {m.movieTitle && (
                      <p className="text-indigo-700 font-medium">Movie: {m.movieTitle}</p>
                    )}
                    <p className="text-slate-700">{m.text}</p>
                    {m.movieLink && (
                      <p className="font-mono-tabular text-indigo-600 break-all">
                        Link: {m.movieLink}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendAdminCinemaLink} className="space-y-4">
              {replyError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {replyError}
                </div>
              )}
              {replyStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {replyStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-movie-title" className="block text-xs font-medium text-slate-700 mb-1">
                    Movie Name
                  </label>
                  <input
                    id="admin-movie-title"
                    type="text"
                    value={adminMovieTitle}
                    onChange={(e) => setAdminMovieTitle(e.target.value)}
                    placeholder="e.g. Satyajit Ray — Apu Trilogy Remaster"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="admin-movie-link" className="block text-xs font-medium text-slate-700 mb-1">
                    Direct Movie Link (URL to Send to User)
                  </label>
                  <input
                    id="admin-movie-link"
                    type="url"
                    value={adminMovieLink}
                    onChange={(e) => setAdminMovieLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-reply-msg" className="block text-xs font-medium text-slate-700 mb-1">
                  Admin Message to User
                </label>
                <input
                  id="admin-reply-msg"
                  type="text"
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Here is the verified link for your requested movie..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Movie Link to User Chat</span>
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Tab 3: 12:00 AM to 12:00 AM (24-Hour Cycle) Daily Active On-Screen Time Reports */}
      {adminTab === 'screen-time' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
                <Eye className="w-3.5 h-3.5" />
                <span>FOREGROUND ON-SCREEN TELEMETRY · PAUSES IN BACKGROUND TABS</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif-display font-semibold text-slate-900">
                Daily 12:00 AM to 12:00 AM (24-Hour Cycle) User Screen-Time Reports
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Tracks each signed-in user's exact active on-screen time (`document.visibilityState === 'visible'`) between 12:00 AM and 12:00 AM. At 12:00 AM midnight, the 24-hour cycle finalizes and delivers the user's Name, WhatsApp Number, and total on-screen duration here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start">
              {onForceFinalize12AMReport && (
                <button
                  type="button"
                  onClick={() => {
                    onForceFinalize12AMReport();
                    setSnapshotStatus(
                      `12:00 AM cycle report snapshot locked & synced at ${new Date().toLocaleTimeString()}.`
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Dispatch 12 AM Report Snapshot Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportScreenTimeCsv}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export 12 AM Screen Time CSV</span>
              </button>
            </div>
          </div>

          {snapshotStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{snapshotStatus}</span>
            </div>
          )}

          {/* 24-Hour Cycle Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Active 24-Hour Cycle Window
              </span>
              <p className="text-base font-mono-tabular font-semibold text-slate-900">
                {todayCycleKey} · 12:00 AM – 12:00 AM
              </p>
              <p className="text-[11px] text-slate-500">
                Resets automatically at 00:00:00 local midnight
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Next 12:00 AM Report Rollover In
              </span>
              <p className="text-base font-mono-tabular font-semibold text-indigo-700">
                {nextMidnightFormatted}
              </p>
              <p className="text-[11px] text-slate-500">
                Auto-dispatches completed 24h log at 12:00 AM
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Measurement Rule
              </span>
              <p className="text-base font-semibold text-emerald-700">
                On-Screen Visible Only
              </p>
              <p className="text-[11px] text-slate-500">
                Timer pauses immediately if tab is in background or minimized
              </p>
            </div>
          </div>

          {/* 12 AM Screen Time Table with User Name & WhatsApp Number */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">User Name</th>
                  <th className="py-3 px-4 font-medium">WhatsApp Number</th>
                  <th className="py-3 px-4 font-medium">Gmail Address</th>
                  <th className="py-3 px-4 font-medium">12 AM – 12 AM Cycle Window</th>
                  <th className="py-3 px-4 font-medium">Active On-Screen Time</th>
                  <th className="py-3 px-4 font-medium">12:00 AM Dispatch Status</th>
                  <th className="py-3 pl-4 font-medium">Last Active On-Screen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {mergedUsageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No active screen-time logs recorded yet. As users view the website on-screen, their 12 AM – 12 AM timer updates live here.
                    </td>
                  </tr>
                ) : (
                  mergedUsageLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-white/60">
                      <td className="py-3.5 pr-4 font-semibold text-slate-900">
                        {log.displayName}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular font-semibold text-emerald-700">
                        <a
                          href={`https://wa.me/${log.whatsappNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {log.whatsappNumber}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-indigo-700">
                        {log.email}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-slate-700">
                        {log.cycleWindow}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono-tabular font-semibold text-slate-900 text-sm">
                          {log.formattedDuration}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {log.readableDuration} ({log.activeSeconds}s on-screen)
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.status === 'completed-12am' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Dispatched at 12:00 AM</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Tracking Live (12 AM – 12 AM)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-4 font-mono-tabular text-slate-500">
                        {log.lastActiveAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: Login User Details Registry */}
      {adminTab === 'users' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Logged-In User Details & Device Registry
              </h2>
              <p className="text-xs text-slate-500">
                Complete audit log of users who signed in with Gmail, their verified WhatsApp number, and today's 12 AM – 12 AM active on-screen time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportUsersCsv}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors self-start cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Users CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">User Name</th>
                  <th className="py-3 px-4 font-medium">Gmail Address</th>
                  <th className="py-3 px-4 font-medium">WhatsApp Number</th>
                  <th className="py-3 px-4 font-medium">Today's On-Screen Time (12 AM–12 AM)</th>
                  <th className="py-3 px-4 font-medium">Auth Method</th>
                  <th className="py-3 px-4 font-medium">Device & Platform Telemetry</th>
                  <th className="py-3 pl-4 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-slate-700">
                {registeredUsers.map((u) => {
                  const todayLog = mergedUsageLogs.find(
                    (l) => (l.uid === u.uid || l.email === u.email) && l.dateKey === todayCycleKey
                  );
                  return (
                    <tr key={u.uid} className="hover:bg-white/50">
                      <td className="py-3 pr-4 font-semibold text-slate-900">{u.displayName}</td>
                      <td className="py-3 px-4 font-mono-tabular text-indigo-700">{u.email}</td>
                      <td className="py-3 px-4 font-mono-tabular font-medium text-emerald-700">
                        {u.whatsappNumber || 'Not provided'}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-900">
                        {todayLog
                          ? `${todayLog.formattedDuration} (${todayLog.readableDuration})`
                          : '00:00:00 (0s)'}
                      </td>
                      <td className="py-3 px-4">{u.authMethod}</td>
                      <td className="py-3 px-4 font-mono-tabular text-slate-500 max-w-xs truncate">
                        {u.deviceInfo}
                      </td>
                      <td className="py-3 pl-4 font-mono-tabular text-slate-500">{u.lastLoginAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

