'use client';

import React, { useState } from 'react';
import { X, Maximize2, Minimize2, Video, ExternalLink, AlertTriangle } from 'lucide-react';

interface JitsiMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  displayName: string;
  email?: string;
  subjectTitle?: string;
}

export function JitsiMeetingModal({
  isOpen,
  onClose,
  roomName,
  displayName,
  email,
  subjectTitle = 'লাইভ ক্লাসরুম',
}: JitsiMeetingModalProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Listen for iframe navigation or postMessage when user clicks red hangup button
  React.useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Jitsi postMessage when conference is terminated/hung up
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data?.event === 'videoConferenceLeft' || data?.type === 'hangup' || data?.action === 'close') {
            setLoading(true);
            onClose();
          }
        } catch (_) {}
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Clean room name suitable for Jitsi (alphanumeric only)
  const sanitizedRoom = `GravAcademy-${roomName.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Direct Jitsi URL with aggressive config to disable promo/ads/feedback screen
  const jitsiUrl = `https://meet.jit.si/${sanitizedRoom}#userInfo.displayName="${encodeURIComponent(
    displayName || 'শিক্ষার্থী'
  )}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.disableDeepLinking=true&config.enableWelcomePage=false&config.enableClosePage=false&config.disableFeedback=true&config.disableFeedbackWindow=true&interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  const handleRequestClose = () => {
    setShowConfirmClose(true);
  };

  const handleConfirmExit = () => {
    setShowConfirmClose(false);
    setLoading(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 rounded-none border-none h-screen'
            : 'max-w-6xl h-[88vh] max-h-[850px]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="h-14 bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Video className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{subjectTitle}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open in external tab fallback */}
            <a
              href={`https://meet.jit.si/${sanitizedRoom}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="নতুন ট্যাবে ওপেন করুন"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন ট্যাবে</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'মিনিমাইজ' : 'ফুল স্ক্রিন'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal with confirmation */}
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

        {/* Video Frame Container */}
        <div className="relative flex-1 w-full h-full bg-slate-950">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 space-y-3 pointer-events-none">
              <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-300">
                লাইভ ক্লাস লোড হচ্ছে...
              </p>
            </div>
          )}

          <iframe
            src={jitsiUrl}
            onLoad={() => setLoading(false)}
            allow="camera; microphone; display-capture; autoplay; clipboard-write; speaker; fullscreen"
            className="w-full h-full border-0"
            title="Live Classroom Video"
          />

          {/* Custom Confirmation Dialog for Closing Live Class */}
          {showConfirmClose && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
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
