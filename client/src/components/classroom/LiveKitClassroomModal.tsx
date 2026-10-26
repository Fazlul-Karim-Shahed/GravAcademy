'use client';

import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Video, AlertTriangle } from 'lucide-react';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';

interface LiveKitClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  displayName: string;
  email?: string;
  subjectTitle?: string;
}

export function LiveKitClassroomModal({
  isOpen,
  onClose,
  roomName,
  displayName,
  subjectTitle = 'লাইভ ক্লাসরুম',
}: LiveKitClassroomModalProps) {
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setToken('');
      setLoading(true);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Sanitize room name
        const sanitizedRoom = `gravacademy-${roomName.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        const participantName = displayName || 'Student';

        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(sanitizedRoom)}&username=${encodeURIComponent(participantName)}`
        );
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'লাইভ ক্লাস সংযোগ তৈরি করতে ব্যর্থ হয়েছে');
        }

        if (isMounted) {
          setToken(data.token);
          setWsUrl(data.wsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || '');
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'ত্রুটি দেখা দিয়েছে');
          setLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [isOpen, roomName, displayName]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    setShowConfirmClose(true);
  };

  const handleConfirmExit = () => {
    setShowConfirmClose(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 rounded-none border-none h-screen'
            : 'max-w-6xl h-[90vh] max-h-[880px]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="h-14 bg-slate-950/95 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Video className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{subjectTitle}</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
                  Native WebRTC
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'মিনিমাইজ' : 'ফুল স্ক্রিন'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-300">
                লাইভ ক্লাস সার্ভারের সাথে কানেক্ট হচ্ছে...
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">কানেক্ট হতে সমস্যা হয়েছে</p>
                <p className="text-xs text-rose-400 mt-1 max-w-md">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                ফিরে যান
              </button>
            </div>
          )}

          {token && wsUrl && !loading && (
            <LiveKitRoom
              video={false}
              audio={false}
              token={token}
              serverUrl={wsUrl}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%' }}
              onDisconnected={() => {
                onClose();
              }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}

          {/* Custom Confirmation Dialog */}
          {showConfirmClose && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    লাইভ ক্লাস বন্ধ করতে চান?
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    আপনি কি আসলেই লাইভ ক্লাস থেকে প্রস্থান করতে চান? বন্ধ করলে আপনি ক্লাস রুম থেকে ডিসকানেক্ট হয়ে যাবেন।
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmClose(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    না, ক্লাসে থাকুন
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExit}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    হ্যাঁ, বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
