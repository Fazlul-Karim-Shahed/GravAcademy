'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Undo,
  Redo,
  Minus,
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
  placeholder = 'এখানে ক্লাসের পাঠ্য বিষয়, প্রয়োজনীয় সূত্রাবলী ও নির্দেশনা লিখুন...',
  minHeight = '240px',
}: TextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5 my-2 space-y-1',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5 my-2 space-y-1',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-normal',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-blue-500 pl-4 py-1 my-2 italic text-slate-600 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/20 rounded-r-xl',
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs my-2',
          },
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800 transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-content focus:outline-none p-4 text-sm text-slate-900 dark:text-white leading-relaxed max-w-none text-left',
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    immediatelyRender: false,
  });

  // Sync content when external value updates initially or on reset
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        style={{ minHeight }}
        className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 p-4 animate-pulse flex items-center justify-center text-xs text-slate-400"
      >
        এডিটর লোড হচ্ছে...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL লিংক লিখুন:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-2xs">
      {/* Comprehensive Rich Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Basic Styles */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('underline')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('strike')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('highlight')
              ? 'bg-amber-400 text-slate-900 shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Highlight Text"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'justify' })
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Lists & Block Elements */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Bullet List (বুলেন্ট পয়েন্ট)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Numbered List (নম্বর লিস্ট)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Quote / Note Box"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Divider Line (বিভাজক রেখা)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Link Tools */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* History */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* TipTap WYSIWYG Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
