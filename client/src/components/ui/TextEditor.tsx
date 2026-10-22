'use client';

import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Code,
  Eye,
  Edit3,
} from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function TextEditor({
  value,
  onChange,
  placeholder = 'এখানে লেসনের বিস্তারিত নোট, কনসেপ্ট বা গাইডলাইন লিখুন...',
  minHeight = '220px',
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  // Helper to wrap selected text with markdown or HTML tag
  const applyFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const selectedText = currentText.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newText =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    onChange(newText);

    // Reposition cursor inside or after formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const addLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
    const newText =
      currentText.substring(0, lineStart) +
      prefix +
      ' ' +
      currentText.substring(lineStart);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length + 1, end + prefix.length + 1);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g. https://...):');
    if (!url) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end) || 'এখানে লিংক টেক্সট লিখুন';

    const markdownLink = `[${selectedText}](${url})`;
    const newText = currentText.substring(0, start) + markdownLink + currentText.substring(end);
    onChange(newText);
  };

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-2xs">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => applyFormat('**', '**', 'বোল্ড টেক্সট')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*', '*', 'ইটালিক টেক্সট')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('<u>', '</u>', 'আন্ডারলাইন টেক্সট')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Underline (<u>text</u>)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => addLinePrefix('##')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Heading 2 (## Title)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => addLinePrefix('###')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Heading 3 (### Title)"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => addLinePrefix('-')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Bullet List (- item)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => addLinePrefix('1.')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => addLinePrefix('>')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Quote (> note)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('`', '`', 'code')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Code (`code`)"
          >
            <Code className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Insert Link [Text](url)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Write / Preview Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              mode === 'write'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>লিখুন (Write)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              mode === 'preview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>প্রিভিউ (Preview)</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          dir="ltr"
          className="w-full p-4 text-sm text-slate-900 dark:text-white bg-transparent outline-none resize-y placeholder:text-slate-400 font-normal leading-relaxed text-left focus:outline-none"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="p-4 text-sm text-slate-800 dark:text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed"
        >
          {value ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none text-left"
              dangerouslySetInnerHTML={{
                __html: formatMarkdownPreview(value),
              }}
            />
          ) : (
            <p className="text-slate-400 italic">প্রিভিউ দেখার জন্য কিছু টেক্সট লিখুন...</p>
          )}
        </div>
      )}
    </div>
  );
}

// Simple and safe markdown to html preview converter
function formatMarkdownPreview(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold my-2 text-blue-600 dark:text-blue-400">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold my-2 text-slate-900 dark:text-white">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Underline
  html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gim, '<u>$1</u>');

  // Quotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-3 my-2 text-slate-600 dark:text-slate-300 italic">$1</blockquote>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-blue-600 underline font-medium">$1</a>');

  // Lists
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/^([0-9]+)\. (.*$)/gim, '<li class="ml-4 list-decimal">$2</li>');

  // Code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs text-rose-500 font-mono">$1</code>');

  return html.replace(/\n/g, '<br />');
}
