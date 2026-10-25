import React, { useState, useEffect } from 'react';
import { Film, Send, ExternalLink, Lock, MessageSquare } from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { SavedUserSession } from './LoginGateModal';

export interface CinemaChatMessage {
  id: string;
  chatOwnerId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  text: string;
  movieTitle: string;
  movieLink: string;
  createdAtLabel: string;
}

export interface LocalCinemaThread {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  updatedAtLabel: string;
  messages: CinemaChatMessage[];
}

export const LOCAL_CINEMA_THREADS_KEY = 'polarith_cinema_threads_v2';

interface CinemaMachineViewProps {
  currentUser: SavedUserSession;
}

export const CinemaMachineView: React.FC<CinemaMachineViewProps> = ({ currentUser }) => {
  const [movieRequestTitle, setMovieRequestTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<CinemaChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const chatId = currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CINEMA_THREADS_KEY);
      if (raw) {
        const allThreads = JSON.parse(raw) as Record<string, LocalCinemaThread>;
        if (allThreads[chatId]) {
          setMessages(allThreads[chatId].messages);
        }
      }
    } catch {
      // ignore parse error
    }

    if (!auth.currentUser || !auth.currentUser.emailVerified || auth.currentUser.uid !== chatId) {
      return;
    }

    const msgQuery = query(
      collection(db, 'cinemaChats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      msgQuery,
      (snap) => {
        if (snap.empty) return;
        const cloudMsgs: CinemaChatMessage[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            chatOwnerId: String(data.chatOwnerId || chatId),
            senderId: String(data.senderId || ''),
            senderName: String(data.senderName || 'User'),
            senderRole: data.senderRole === 'admin' ? 'admin' : 'user',
            text: String(data.text || ''),
            movieTitle: String(data.movieTitle || ''),
            movieLink: String(data.movieLink || ''),
            createdAtLabel: 'Verified Live',
          };
        });
        setMessages(cloudMsgs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `cinemaChats/${chatId}/messages`);
      }
    );

    return () => unsub();
  }, [chatId]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = messageText.trim().slice(0, 1500);
    const trimmedMovie = movieRequestTitle.trim().slice(0, 200);

    if (!trimmedText && !trimmedMovie) {
      setErrorBanner('Please enter a movie name or message to send to Admin.');
      return;
    }

    setErrorBanner(null);
    setSending(true);

    const finalBody =
      trimmedText || `Hello Admin, could you please share the link for the movie "${trimmedMovie}"?`;
    const msgId = `msg_${Date.now()}`;
    const newMsg: CinemaChatMessage = {
      id: msgId,
      chatOwnerId: chatId,
      senderId: chatId,
      senderName: currentUser.displayName,
      senderRole: 'user',
      text: finalBody,
      movieTitle: trimmedMovie,
      movieLink: '',
      createdAtLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    try {
      const raw = localStorage.getItem(LOCAL_CINEMA_THREADS_KEY);
      const allThreads: Record<string, LocalCinemaThread> = raw ? JSON.parse(raw) : {};
      allThreads[chatId] = {
        userId: chatId,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        lastMessage: trimmedMovie ? `[Movie Request: ${trimmedMovie}] ${finalBody}` : finalBody,
        updatedAtLabel: newMsg.createdAtLabel,
        messages: updatedMessages,
      };
      localStorage.setItem(LOCAL_CINEMA_THREADS_KEY, JSON.stringify(allThreads));
    } catch {
      // ignore local storage write issue
    }

    setMovieRequestTitle('');
    setMessageText('');

    if (auth.currentUser && auth.currentUser.emailVerified && auth.currentUser.uid === chatId) {
      try {
        await setDoc(
          doc(db, 'cinemaChats', chatId),
          {
            userId: chatId,
            userName: currentUser.displayName.slice(0, 120),
            userEmail: currentUser.email.slice(0, 254),
            lastMessage: finalBody.slice(0, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await setDoc(doc(db, 'cinemaChats', chatId, 'messages', msgId), {
          chatOwnerId: chatId,
          senderId: chatId,
          senderName: currentUser.displayName.slice(0, 120),
          senderRole: 'user',
          text: finalBody,
          movieTitle: trimmedMovie,
          movieLink: '',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `cinemaChats/${chatId}/messages/${msgId}`);
      }
    }

    setSending(false);
  };

  return (
    <div className="space-y-10">
      <section className="frosted-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-2">
              <span>Cinema Machine</span>
              <span aria-hidden="true">·</span>
              <span>Direct User-to-Admin Concierge</span>
              <span aria-hidden="true">·</span>
              <span>Private 1-on-1 Channel</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 tracking-tight">
              Cinema Machine — Direct Movie Request Desk
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              This private chat window connects you directly with the Admin (Priyam Kesh). Only you and the Admin can view or send messages in your channel. Type a movie title below, and the Admin can dispatch the movie link directly into this conversation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/85 border border-slate-200/80 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>End-to-End Role Isolated</span>
            </div>
            <p className="text-slate-500">Logged in as: {currentUser.displayName}</p>
            <p className="text-slate-500 font-mono-tabular">{currentUser.email}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chat Window (8 columns) */}
        <div className="lg:col-span-8 frosted-panel rounded-2xl overflow-hidden flex flex-col h-[580px]">
          <div className="px-6 py-4 bg-white/85 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Private Cinema Channel · {currentUser.displayName} & Admin
                </h2>
                <p className="text-xs text-slate-500">
                  Only you and Priyam Kesh (Admin) can read or reply in this room
                </p>
              </div>
            </div>
            <span className="text-xs font-mono-tabular text-slate-500">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Film className="w-8 h-8 text-indigo-400" />
                <p className="text-sm font-semibold text-slate-800">
                  No Movie Requests Yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Type a movie name in the box below to send a message to the Admin. When the Admin sends the movie link from the Admin Portal, it will appear right here.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isAdminMsg = m.senderRole === 'admin';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 px-1">
                      <span className="font-medium text-slate-700">{m.senderName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{m.createdAtLabel}</span>
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                        isAdminMsg
                          ? 'bg-white border border-slate-200/90 text-slate-800'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {m.movieTitle && (
                        <div
                          className={`text-xs font-medium pb-2 border-b ${
                            isAdminMsg
                              ? 'border-slate-100 text-indigo-700'
                              : 'border-slate-700 text-indigo-300'
                          }`}
                        >
                          Movie: <span className="font-semibold">{m.movieTitle}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {m.movieLink && (
                        <div className="pt-2">
                          <a
                            href={m.movieLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Movie Link ({m.movieTitle || 'Watch Now'})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Composer */}
          <form
            onSubmit={handleSendRequest}
            className="p-4 sm:p-5 bg-white/90 border-t border-slate-200/80 space-y-3"
          >
            {errorBanner && <p className="text-xs text-red-600">{errorBanner}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="cinema-movie-title" className="sr-only">
                  Movie Name
                </label>
                <input
                  id="cinema-movie-title"
                  type="text"
                  value={movieRequestTitle}
                  onChange={(e) => setMovieRequestTitle(e.target.value)}
                  placeholder="Enter movie name..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <label htmlFor="cinema-message-input" className="sr-only">
                  Message to Admin
                </label>
                <input
                  id="cinema-message-input"
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message to Admin requesting your movie link..."
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right 4 Columns: How Cinema Machine Works */}
        <div className="lg:col-span-4 space-y-6">
          <div className="frosted-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">How Cinema Machine Works</h2>
            </div>
            <ol className="space-y-3 text-xs sm:text-sm text-slate-600 list-decimal pl-4 leading-relaxed">
              <li>
                <span className="font-medium text-slate-900">Enter the Movie Title:</span> Type the exact movie name in the request field.
              </li>
              <li>
                <span className="font-medium text-slate-900">Direct Admin Dispatch:</span> Your request is routed strictly to the Admin Console. Other users on the site cannot view your chat.
              </li>
              <li>
                <span className="font-medium text-slate-900">Receive Clickable Link:</span> When the Admin replies from the Admin Portal with the movie link, a clickable button appears directly inside your chat stream.
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
};
