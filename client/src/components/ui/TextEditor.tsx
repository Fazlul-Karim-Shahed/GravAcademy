'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
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
  minHeight = '180px',
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const format = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      format('createLink', url);
    }
  };

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-2xs">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => format('bold')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('italic')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('underline')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => format('formatBlock', '<h2>')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('formatBlock', '<h3>')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => format('insertUnorderedList')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('insertOrderedList')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('formatBlock', '<blockquote>')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={addLink}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('undo')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => format('redo')}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ minHeight }}
        className="p-4 text-sm text-slate-900 dark:text-white outline-none prose prose-slate dark:prose-invert max-w-none focus:outline-none"
        data-placeholder={placeholder}
      />
    </div>
  );
}
