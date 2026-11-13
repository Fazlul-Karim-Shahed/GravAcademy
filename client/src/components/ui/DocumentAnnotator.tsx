'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Check,
  X,
  RotateCcw,
  Square,
  Type,
  Eraser,
  Download,
  Save,
  CheckCircle,
  XCircle,
  HelpCircle,
  Highlighter,
  Sliders,
} from 'lucide-react';

interface DocumentAnnotatorProps {
  fileUrl: string;
  backgroundFileUrl?: string;
  fileName?: string;
  onSaveAnnotated: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

export const DocumentAnnotator: React.FC<DocumentAnnotatorProps> = ({
  fileUrl,
  backgroundFileUrl,
  fileName = 'student_document',
  onSaveAnnotated,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Tools: 'pen' | 'highlighter' | 'text' | 'tick' | 'cross' | 'eraser'
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'text' | 'tick' | 'cross' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState('#ef4444'); // Default teacher red pen
  const [penWidth, setPenWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isPdf, setIsPdf] = useState(false);

  // Text comment tool state
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas with document image
  useEffect(() => {
    const isPdfFile = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('application/pdf');
    setIsPdf(isPdfFile);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let imageUrl = fileUrl;
    // Format drive thumbnail or direct view if Google Drive
    if (fileUrl.includes('drive.google.com/file/d/')) {
      const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Thumbnail view API loads as image
        imageUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`;
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    // Keep the clean document separately so the eraser can restore the
    // original pixels instead of painting a white stroke over the script.
    let backgroundImageUrl = backgroundFileUrl || fileUrl;
    if (backgroundImageUrl.includes('drive.google.com/file/d/')) {
      const match = backgroundImageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        backgroundImageUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`;
      }
    }
    const cleanImg = new Image();
    cleanImg.crossOrigin = 'anonymous';
    cleanImg.onload = () => {
      backgroundImageRef.current = cleanImg;
    };
    cleanImg.onerror = () => {
      backgroundImageRef.current = null;
    };
    cleanImg.src = backgroundImageUrl;

    img.onload = () => {
      // Set high-res canvas size based on loaded image
      const maxWidth = 1200;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setBgImage(img);
      setImageLoaded(true);

      // Save initial state to history
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryStep(0);
    };

    img.onerror = () => {
      // Fallback: create blank white review paper
      canvas.width = 900;
      canvas.height = 1200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw document watermark
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`ডকুমেন্ট প্রিভিউ: ${fileName}`, canvas.width / 2, 60);
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(ডিজিটাল রিভিউ শিট - আপনি এখানে মন্তব্য ও মার্কিং লিখতে পারেন)', canvas.width / 2, 90);

      setImageLoaded(true);
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryStep(0);
    };
  }, [fileUrl, backgroundFileUrl, fileName]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevStep = historyStep - 1;
    ctx.putImageData(history[prevStep], 0, 0);
    setHistoryStep(prevStep);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const restoreBackgroundAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const cleanImage = backgroundImageRef.current;
    if (!canvas || !cleanImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = 10;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(cleanImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    lastPointRef.current = { x, y };

    if (activeTool === 'tick') {
      // Draw Teacher Green/Red Checkmark stamp
      ctx.save();
      ctx.strokeStyle = '#16a34a'; // Green tick
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x - 2, y + 10);
      ctx.lineTo(x + 18, y - 12);
      ctx.stroke();
      ctx.restore();
      saveState();
      return;
    }

    if (activeTool === 'cross') {
      // Draw Teacher Red Cross stamp
      ctx.save();
      ctx.strokeStyle = '#dc2626'; // Red Cross
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 12);
      ctx.lineTo(x + 12, y + 12);
      ctx.moveTo(x + 12, y - 12);
      ctx.lineTo(x - 12, y + 12);
      ctx.stroke();
      ctx.restore();
      saveState();
      return;
    }

    if (activeTool === 'text') {
      setTextPos({ x, y });
      return;
    }

    // Freehand drawing / Highlighter / Eraser
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (activeTool === 'highlighter') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; // Semitransparent Yellow
      ctx.lineWidth = 18;
      ctx.lineCap = 'square';
    } else if (activeTool === 'eraser') {
      // Eraser: restore the clean document underneath the annotation.
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      restoreBackgroundAt(x, y);
    } else {
      // Pen Tool
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'eraser') {
      const previous = lastPointRef.current || { x, y };
      const distance = Math.hypot(x - previous.x, y - previous.y);
      const steps = Math.max(1, Math.ceil(distance / 8));
      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        restoreBackgroundAt(
          previous.x + (x - previous.x) * progress,
          previous.y + (y - previous.y) * progress
        );
      }
      lastPointRef.current = { x, y };
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    saveState();
  };

  // Add text comment onto canvas
  const handleAddText = () => {
    if (!textPos || !textInput.trim()) {
      setTextPos(null);
      setTextInput('');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.font = 'bold 16px Arial, sans-serif';

    // Draw background bubble for comment
    const textWidth = ctx.measureText(textInput).width;
    ctx.fillStyle = '#fee2e2'; // Light red bubble
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(textPos.x - 8, textPos.y - 20, textWidth + 16, 28, 8);
    ctx.fill();
    ctx.stroke();

    // Draw Text
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.restore();

    saveState();
    setTextPos(null);
    setTextInput('');
  };

  // Export merged annotated document
  const handleConfirmAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onSaveAnnotated(blob, previewUrl);
      }
    }, 'image/png', 0.95);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Top Floating Toolbar */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <PenTool className="w-4 h-4 text-rose-500" />
            <span>শিক্ষক খাতা মূল্যায়ন টুলবার</span>
          </span>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
            Live Pen
          </span>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {/* Red Pen */}
          <button
            type="button"
            onClick={() => {
              setActiveTool('pen');
              setPenColor('#ef4444');
              setPenWidth(3);
            }}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="লাল কলম (Red Pen)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">কলম</span>
          </button>

          {/* Tick Stamp */}
          <button
            type="button"
            onClick={() => setActiveTool('tick')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'tick'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="সঠিক চিহ্ন (✔ টিক)"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">টিক (✔)</span>
          </button>

          {/* Cross Stamp */}
          <button
            type="button"
            onClick={() => setActiveTool('cross')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'cross'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="ভুল চিহ্ন (✖ ক্রস)"
          >
            <X className="w-4 h-4 text-rose-300" />
            <span className="hidden sm:inline">ভুল (✖)</span>
          </button>

          {/* Highlighter */}
          <button
            type="button"
            onClick={() => setActiveTool('highlighter')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'highlighter'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="হাইলাইটার (Yellow Highlighter)"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">হাইলাইট</span>
          </button>

          {/* Text Comment Note */}
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="নোট বা টেক্সট লিখুন"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">মন্তব্য</span>
          </button>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'eraser' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="ইরেজার (মুছুন)"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {/* Undo */}
          <button
            type="button"
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="আগের অবস্থায় ফিরুন (Undo)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Finish & Save Annotated Copy */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleConfirmAnnotation}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>চেক করা কপি সংযুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Canvas Workspace Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex items-center justify-center relative select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`shadow-2xl rounded-xl max-w-full bg-white transition-all ${
            activeTool === 'pen' || activeTool === 'highlighter'
              ? 'cursor-crosshair'
              : activeTool === 'text'
              ? 'cursor-text'
              : 'cursor-pointer'
          }`}
        />

        {/* Text Input Popup when user clicks on Canvas */}
        {textPos && (
          <div
            className="absolute z-40 bg-slate-900 border border-rose-500 p-2.5 rounded-xl shadow-2xl flex items-center gap-2"
            style={{
              left: `${Math.min(textPos.x + 30, 400)}px`,
              top: `${Math.min(textPos.y + 40, 500)}px`,
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder="কী ভুল হয়েছে সংক্ষেপে লিখুন..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
                if (e.key === 'Escape') setTextPos(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-rose-500 w-56"
            />
            <button
              type="button"
              onClick={handleAddText}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 cursor-pointer"
            >
              যোগ করুন
            </button>
            <button
              type="button"
              onClick={() => setTextPos(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Help bar at bottom */}
      <div className="bg-slate-950 border-t border-slate-800 p-2.5 px-4 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>খাতার যেকোনো লাইনে কলম দিয়ে দাগ দিন, টিক/ভুল চিহ্ন বসান অথবা ক্লিক করে লাল কালিতে নোট লিখে দিন।</span>
        </span>
        <span className="text-slate-500">মূল্যায়ন শেষে "চেক করা কপি সংযুক্ত করুন" বাটনে ক্লিক করুন।</span>
      </div>
    </div>
  );
};
