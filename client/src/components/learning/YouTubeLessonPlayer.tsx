'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play } from 'lucide-react';

type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;
type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};
type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    width: string;
    height: string;
    playerVars: Record<string, string | number>;
    events: { onReady: () => void; onStateChange: (event: { data: PlayerState }) => void };
  }) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeAPI> | null = null;
function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error('YouTube player unavailable'));
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('YouTube player could not load'));
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function YouTubeLessonPlayer({ videoId, title }: { videoId: string; title: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const seekingRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    if (document.fullscreenElement === wrapperRef.current) {
      hideTimerRef.current = window.setTimeout(() => {
        if (seekingRef.current) showControls();
        else setControlsVisible(false);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (document.fullscreenElement === wrapperRef.current) showControls();
      else {
        if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    loadYouTubeAPI().then((YT) => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!cancelled) {
              setReady(true);
              setDuration(playerRef.current?.getDuration() || 0);
            }
          },
          onStateChange: ({ data }) => {
            if (!cancelled) {
              setPlaying(data === 1);
              setDuration(playerRef.current?.getDuration() || 0);
            }
          },
        },
      });
    }).catch(() => {
      // The iframe API can be blocked by browser extensions or network rules.
    });

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (player) {
        if (!seekingRef.current) setCurrentTime(player.getCurrentTime() || 0);
        setDuration(player.getDuration() || 0);
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div
      ref={wrapperRef}
      className={`lesson-video-player overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-lg dark:border-slate-800/90 ${controlsVisible ? '' : 'is-idle'}`}
      onMouseMove={showControls}
      onTouchStart={showControls}
      onKeyDown={showControls}
    >
      <div className="lesson-video-surface aspect-video bg-black" aria-label={title}>
        <div ref={mountRef} className="h-full w-full" />
      </div>
      <div className="lesson-video-controls flex min-h-12 items-center gap-3 px-3 py-2 text-white sm:px-4">
        <button
          type="button"
          disabled={!ready}
          onClick={() => playing ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="rounded-md p-1.5 transition hover:bg-white/15 disabled:opacity-40"
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <span className="shrink-0 text-xs tabular-nums text-slate-200">{formatTime(currentTime)} / {formatTime(duration)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          value={Math.min(Math.floor(currentTime), Math.max(1, Math.floor(duration)))}
          disabled={!ready || duration <= 0}
          onPointerDown={() => { seekingRef.current = true; showControls(); }}
          onPointerUp={() => { seekingRef.current = false; showControls(); }}
          onPointerCancel={() => { seekingRef.current = false; showControls(); }}
          onChange={(event) => {
            const seconds = Number(event.target.value);
            setCurrentTime(seconds);
            playerRef.current?.seekTo(seconds, true);
          }}
          aria-label="ভিডিওর সময় পরিবর্তন করুন"
          className="min-w-0 flex-1 cursor-pointer accent-white disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => document.fullscreenElement ? document.exitFullscreen() : wrapperRef.current?.requestFullscreen()}
          aria-label="Fullscreen"
          className="shrink-0 rounded-md p-1.5 transition hover:bg-white/15"
        >
          <Maximize size={18} />
        </button>
      </div>
      <button type="button" className="lesson-video-wake" onMouseEnter={showControls} onClick={showControls} aria-label="ভিডিও কন্ট্রোল দেখান" />
    </div>
  );
}
