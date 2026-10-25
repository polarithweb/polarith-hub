import React, { useState, useEffect } from 'react';
import {
  Play,
  FileText,
  Download,
  Save,
  Clock,
  Trash2,
  BookOpen,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { extractYouTubeId } from '../utils/toolsLogic';

export interface StudyNoteItem {
  id: string;
  videoUrl: string;
  videoTitle: string;
  content: string;
  updatedAtLabel: string;
}

const LOCAL_NOTES_KEY = 'polarith_youtube_notes_v2';

interface YouTubeNoteTakerProps {
  initialUrl?: string;
}

export const YouTubeNoteTaker: React.FC<YouTubeNoteTakerProps> = ({ initialUrl }) => {
  const [videoUrl, setVideoUrl] = useState(initialUrl || '');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(() =>
    initialUrl ? extractYouTubeId(initialUrl) : null
  );
  const [videoTitle, setVideoTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [timestampInput, setTimestampInput] = useState('00:00');
  const [savedNotes, setSavedNotes] = useState<StudyNoteItem[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setVideoUrl(initialUrl);
      const id = extractYouTubeId(initialUrl);
      if (id) setActiveVideoId(id);
    }
  }, [initialUrl]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudyNoteItem[];
        if (Array.isArray(parsed)) setSavedNotes(parsed);
      }
    } catch {
      // ignore local storage parse error
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) return;

    const q = query(collection(db, 'userNotes'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const cloudNotes: StudyNoteItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            videoUrl: String(data.videoUrl || ''),
            videoTitle: String(data.videoTitle || 'Untitled Video Note'),
            content: String(data.content || ''),
            updatedAtLabel: 'Synced to Cloud',
          };
        });
        if (cloudNotes.length > 0) {
          setSavedNotes(cloudNotes);
          localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(cloudNotes));
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'userNotes');
      }
    );

    return () => unsub();
  }, []);

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(videoUrl);
    if (!id) {
      setUrlError('Please paste a valid YouTube link or 11-character video ID.');
      return;
    }
    setUrlError(null);
    setActiveVideoId(id);
  };

  const handleInsertSnippet = (snippet: string) => {
    setNoteContent((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : '\n'}${snippet}\n`);
  };

  const handleSaveNote = async () => {
    const trimmedTitle = videoTitle.trim().slice(0, 200) || 'Study Session Notes';
    const trimmedContent = noteContent.trim().slice(0, 20000);
    const trimmedUrl =
      videoUrl.trim().slice(0, 500) ||
      (activeVideoId ? `https://www.youtube.com/watch?v=${activeVideoId}` : 'https://youtube.com');

    if (!trimmedContent) {
      setStatusBanner('Please write some notes before saving.');
      return;
    }

    const noteId = `note_${activeVideoId || 'custom'}_${Date.now()}`;
    const newItem: StudyNoteItem = {
      id: noteId,
      videoUrl: trimmedUrl,
      videoTitle: trimmedTitle,
      content: trimmedContent,
      updatedAtLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextNotes = [newItem, ...savedNotes];
    setSavedNotes(nextNotes);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(nextNotes));

    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'userNotes', noteId), {
          userId: auth.currentUser.uid,
          videoUrl: trimmedUrl,
          videoTitle: trimmedTitle,
          content: trimmedContent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusBanner('Note saved to your device and synced to Firebase Cloud.');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `userNotes/${noteId}`);
      }
    } else {
      setStatusBanner('Note saved to your device storage.');
    }
  };

  const handleDeleteNote = async (id: string) => {
    const filtered = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(filtered);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(filtered));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      try {
        await deleteDoc(doc(db, 'userNotes', id));
      } catch {
        // ignore if only local
      }
    }
  };

  const handleDownloadMarkdown = () => {
    const titleToUse = videoTitle.trim() || 'YouTube Study Notes';
    const markdown = `# ${titleToUse}\nSource Video: ${videoUrl || 'N/A'}\nDate: ${new Date().toISOString().slice(0, 10)}\n\n---\n\n${noteContent}\n`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'youtube-notes'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12">
      {/* Top Paste Box & Header */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-2">
            <span>YouTube Video Note Taker</span>
            <span aria-hidden="true">·</span>
            <span>Academic & Research Studio</span>
            <span aria-hidden="true">·</span>
            <span>Polarith Softwares</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 tracking-tight text-balance">
            YouTube Video Note Taker & Lecture Annotation Studio
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Paste your YouTube lecture or documentary link below to watch the video and write structured, timestamped notes directly underneath. Export your study sheets as Markdown or save them to your personal library.
          </p>
        </div>

        <form onSubmit={handleLoadVideo} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="notetaker-yt-url" className="sr-only">
              Paste YouTube Video URL
            </label>
            <input
              id="notetaker-yt-url"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste your needed YouTube video link here..."
              className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200/90 text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Load Video for Notes</span>
          </button>
        </form>
        {urlError && <p className="mt-2 text-xs text-red-600">{urlError}</p>}
      </section>

      {/* Video Player + Note Writing Area Under It */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Embedded Video Box */}
          <div className="frosted-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span>Active Study Stream</span>
              <span className="font-mono-tabular">
                {activeVideoId ? `ID: ${activeVideoId}` : 'Awaiting Video Link'}
              </span>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center">
              {activeVideoId ? (
                <iframe
                  title="YouTube Note Taker Video Player"
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0&modestbranding=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-400">
                  <Play className="w-8 h-8 mx-auto text-indigo-400 opacity-80" />
                  <p className="text-sm font-medium text-slate-200">
                    Paste a YouTube Link Above to Begin
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Your video will play right here while you type structured notes in the workspace directly underneath.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Note Writing Area Directly Under the Video */}
          <div className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div className="flex-1">
                <label htmlFor="note-session-title" className="block text-xs font-medium text-slate-500 mb-1">
                  Lecture / Note Title
                </label>
                <input
                  id="note-session-title"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter your lecture or study session title..."
                  className="w-full text-base sm:text-lg font-semibold text-slate-900 bg-white/80 border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .MD</span>
                </button>
              </div>
            </div>

            {/* Quick Annotation Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <input
                  type="text"
                  aria-label="Timestamp value"
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  className="w-14 text-xs font-mono-tabular text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleInsertSnippet(`[${timestampInput}] Key Point: `)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Insert Timestamp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleInsertSnippet('### Formula / Theorem:\n- ')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                + Formula Block
              </button>
              <button
                type="button"
                onClick={() => handleInsertSnippet('### Exam Question / Doubt:\n- ')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                + Revision Question
              </button>
              <button
                type="button"
                onClick={() => handleInsertSnippet('### Summary Takeaway:\n- ')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                + Summary Takeaway
              </button>
            </div>

            {statusBanner && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusBanner}</span>
              </div>
            )}

            <div>
              <label htmlFor="youtube-note-textarea" className="block text-xs font-medium text-slate-600 mb-1.5">
                Structured Study Notes Area
              </label>
              <textarea
                id="youtube-note-textarea"
                rows={10}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your timestamped lecture notes, formulas, and observations here..."
                className="w-full p-4 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500 font-sans"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono-tabular">
                <span>Characters: {noteContent.length}</span>
                <span>Words: {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Saved Study Notes Library */}
        <div className="lg:col-span-4 frosted-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Saved Study Notes</h2>
            </div>
            <span className="text-xs font-mono-tabular text-slate-500">{savedNotes.length} saved</span>
          </div>

          {savedNotes.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-slate-600">No saved video notes yet.</p>
              <p className="text-xs text-slate-500">
                Click "Save Note" while watching any YouTube lecture to build your revision notebook.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {savedNotes.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white/85 border border-slate-200/80 hover:border-indigo-300 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoTitle(item.videoTitle);
                        setVideoUrl(item.videoUrl);
                        setNoteContent(item.content);
                        const id = extractYouTubeId(item.videoUrl);
                        if (id) setActiveVideoId(id);
                      }}
                      className="text-left text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {item.videoTitle}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete note ${item.videoTitle}`}
                      onClick={() => handleDeleteNote(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-tabular">
                    <span>{item.updatedAtLabel}</span>
                    <span>Click title to load</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comprehensive Details About YouTube Under the Main Part (AdSense High-Value Editorial Guide) */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Comprehensive Platform Reference & Technical Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
            Understanding YouTube Video Architecture, Streaming Codecs & Active Learning Methodology
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            An in-depth technical and educational reference compiled by Polarith Softwares covering how YouTube delivers global video streams, how adaptive bitrate transcoding works, and how students can maximize retention when studying from online video lectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <article className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              01. Adaptive Bitrate Streaming (DASH & HLS) and Global Edge Caching
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When a creator uploads a raw master file to YouTube, the ingestion pipeline splits the video into short multi-second chunks (typically 2 to 5 seconds per GOP segment) and transcodes each segment across a ladder of resolutions—ranging from 144p for constrained cellular links up to 4K (2160p) and 8K at 60 frames per second.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Using Dynamic Adaptive Streaming over HTTP (MPEG-DASH), the client player continuously monitors local buffer health and network throughput. If bandwidth fluctuates during a lecture, the player seamlessly switches to a lower or higher representation on the next keyframe boundary without interrupting audio continuity.
            </p>
          </article>

          <article className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              02. Video Compression Codecs: AVC (H.264), VP9, and AV1 Efficiency
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              YouTube utilizes three primary video codecs depending on device hardware decoding support and stream popularity:
            </p>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>
                <span className="font-medium text-slate-800">H.264 (AVC):</span> Universal hardware compatibility across legacy mobile devices and embedded browsers.
              </li>
              <li>
                <span className="font-medium text-slate-800">VP9:</span> Google’s open royalty-free codec that reduces bitrate requirements by nearly 35–45% compared to H.264 while preserving sharp whiteboard text in educational videos.
              </li>
              <li>
                <span className="font-medium text-slate-800">AV1:</span> Next-generation Alliance for Open Media standard offering superior compression for high-resolution 10-bit HDR streams and screen-recorded coding tutorials.
              </li>
            </ul>
          </article>

          <article className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              03. The Cornell Timestamp Method for Video Lecture Retention
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cognitive psychology research demonstrates that passive video watching creates an "illusion of competence"—students feel they understand a derivation while watching an instructor solve it, but struggle to reproduce it on blank paper.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              By pairing the video viewport with an active Note Writing Studio, you transform passive viewing into active encoding. Always record the exact timestamp (`[MM:SS]`), summarize the theorem in your own words, and pause the video before the instructor reveals the final line of a calculation to verify your own step-by-step work.
            </p>
          </article>

          <article className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              04. Privacy-Enhanced Embedding (`youtube-nocookie.com`) & Focus Ergonomics
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Both the Clean YouTube Cinematic View and this YouTube Video Note Taker embed streams through YouTube’s Privacy-Enhanced Mode (`youtube-nocookie.com`) with related-video distractions constrained. This prevents third-party tracking cookies from being set until you actively initiate playback, while keeping your academic workspace clean, fast, and focused.
            </p>
          </article>
        </div>

        {/* Technical Reference Table */}
        <div className="overflow-x-auto pt-4 border-t border-slate-200/80">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            YouTube Resolution, Frame Rate & Recommended Educational Bitrate Matrix
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Quality Tier</th>
                <th className="py-2.5 px-4 font-medium">Pixel Dimensions</th>
                <th className="py-2.5 px-4 font-medium">Typical VP9/AV1 Bitrate</th>
                <th className="py-2.5 pl-4 font-medium">Optimal Academic Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-slate-700 font-mono-tabular">
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-slate-900">360p / 480p SD</td>
                <td className="py-2.5 px-4">640×360 / 854×480</td>
                <td className="py-2.5 px-4">0.4 – 1.2 Mbps</td>
                <td className="py-2.5 pl-4 font-sans">Audio-primary podcasts, history lectures & mobile data saving</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-slate-900">720p HD</td>
                <td className="py-2.5 px-4">1280×720</td>
                <td className="py-2.5 px-4">1.8 – 3.0 Mbps</td>
                <td className="py-2.5 pl-4 font-sans">Standard chalkboard derivations & slide presentations</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-slate-900">1080p Full HD</td>
                <td className="py-2.5 px-4">1920×1080</td>
                <td className="py-2.5 px-4">3.5 – 6.0 Mbps</td>
                <td className="py-2.5 pl-4 font-sans">Dense IDE code walkthroughs, fine mathematical subscripts</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-slate-900">2160p 4K UHD</td>
                <td className="py-2.5 px-4">3840×2160</td>
                <td className="py-2.5 px-4">14.0 – 25.0 Mbps</td>
                <td className="py-2.5 pl-4 font-sans">Cinematic documentaries, CAD diagrams & multi-window layouts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
