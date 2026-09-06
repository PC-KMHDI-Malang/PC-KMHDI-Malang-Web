"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, ImageIcon, Loader2, Undo2, Redo2, Link2, Unlink } from "lucide-react";
import { uploadFileAction } from "@/lib/actions";
import { looksLikeHtml } from "@/lib/richText";

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  bucket?: string;
  placeholder?: string;
}

interface ToolbarButton {
  command: string;
  value?: string;
  icon: typeof Bold;
  label: string;
}

const formattingButtons: ToolbarButton[] = [
  { command: "bold", icon: Bold, label: "Tebal (Bold)" },
  { command: "italic", icon: Italic, label: "Miring (Italic)" },
  { command: "underline", icon: Underline, label: "Garis Bawah (Underline)" },
];

const listButtons: ToolbarButton[] = [
  { command: "insertUnorderedList", icon: List, label: "Daftar Bullet" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Daftar Bernomor" },
];

const alignButtons: (ToolbarButton & { align: string })[] = [
  { command: "justifyLeft", align: "left", icon: AlignLeft, label: "Rata Kiri" },
  { command: "justifyCenter", align: "center", icon: AlignCenter, label: "Rata Tengah" },
  { command: "justifyRight", align: "right", icon: AlignRight, label: "Rata Kanan" },
  { command: "justifyFull", align: "justify", icon: AlignJustify, label: "Rata Kiri-Kanan (Justify)" },
];

const BLOCK_SELECTOR = "p,div,li,h1,h2,h3,h4,h5,h6,blockquote";

const historyButtons: ToolbarButton[] = [
  { command: "undo", icon: Undo2, label: "Urungkan" },
  { command: "redo", icon: Redo2, label: "Ulangi" },
];

// Editor teks kaya ala Moodle: toolbar bold/italic/underline, perataan paragraf, daftar,
// dan sisip gambar di tengah isi artikel. Memakai contentEditable + document.execCommand —
// cukup untuk kebutuhan admin menulis artikel tanpa menambah dependency baru.
export function RichTextEditor({ name, defaultValue = "", bucket = "article-images", placeholder = "Ketik isi lengkap artikel Anda di sini..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);
  const [error, setError] = useState<string | null>(null);

  // Popover sisip tautan. Seleksi teks di editor hilang begitu fokus pindah ke input URL,
  // jadi posisinya disimpan dulu (savedRangeRef) supaya bisa dikembalikan saat tautan diterapkan.
  // Teks tampilan (linkText) dan URL tujuan (linkUrl) sengaja dipisah — nama link bisa bebas
  // diketik/diubah tapi tetap mengarah ke URL yang dimasukkan saat diklik.
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const savedRangeRef = useRef<Range | null>(null);

  // Status tombol aktif (bold/italic/underline/list/perataan) mengikuti posisi kursor saat ini,
  // supaya admin tahu format apa yang sedang menyala tanpa harus menebak dari tampilan teks.
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [activeAlign, setActiveAlign] = useState("left");

  // Isi editor sekali saat mount. Konten lama (teks polos) dikonversi jadi <br> agar baris
  // barunya tetap tampil, sedangkan konten baru (sudah HTML) dipakai apa adanya.
  useEffect(() => {
    if (!editorRef.current) return;
    const initial = defaultValue && !looksLikeHtml(defaultValue) ? defaultValue.replace(/\n/g, "<br>") : defaultValue;
    editorRef.current.innerHTML = initial;
    setHtml(initial);
    setIsEmpty(!editorRef.current.textContent?.trim() && !editorRef.current.querySelector("img"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFromEditor = () => {
    if (!editorRef.current) return;
    setHtml(editorRef.current.innerHTML);
    setIsEmpty(!editorRef.current.textContent?.trim() && !editorRef.current.querySelector("img"));
  };

  // Membaca status format di posisi kursor sekarang supaya tombol toolbar bisa menyala/mati
  // sesuai konteks (mis. kursor di teks tebal -> tombol Bold menyala).
  const updateActiveStates = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) return;

    const formats = new Set<string>();
    ["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"].forEach((command) => {
      try {
        if (document.queryCommandState(command)) formats.add(command);
      } catch {
        // queryCommandState bisa melempar di beberapa browser lama untuk command tertentu — abaikan saja.
      }
    });
    setActiveFormats(formats);

    // execCommand tidak punya cara baca "perataan saat ini" yang konsisten lintas browser,
    // jadi telusuri elemen blok terdekat dari kursor dan baca text-align efektifnya.
    let node: Node | null = selection.anchorNode;
    let align = "left";
    while (node && node !== editor) {
      if (node instanceof HTMLElement) {
        const textAlign = window.getComputedStyle(node).textAlign;
        if (textAlign === "left" || textAlign === "center" || textAlign === "right" || textAlign === "justify") {
          align = textAlign;
          break;
        }
      }
      node = node.parentNode;
    }
    setActiveAlign(align);
  };

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveStates);
    return () => document.removeEventListener("selectionchange", updateActiveStates);
  }, []);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncFromEditor();
    updateActiveStates();
  };

  // Perataan diterapkan manual (bukan lewat execCommand) karena browser sering menolak
  // justifyLeft ketika teks belum terbungkus elemen blok (mis. konten lama berupa teks polos
  // + <br>) — execCommand menganggap "sudah rata kiri" lalu tidak melakukan apa-apa, sehingga
  // tombol Rata Kiri terasa "kadang gamau". Di sini text-align di-set langsung ke elemen blok
  // pembungkus setiap baris yang tercakup seleksi.
  const applyAlign = (align: string) => {
    const editor = editorRef.current;
    editor?.focus();
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0);
    const blocks = new Set<HTMLElement>();

    const collectBlock = (node: Node | null) => {
      let el = node instanceof HTMLElement ? node : node?.parentElement ?? null;
      while (el && el !== editor && !el.matches(BLOCK_SELECTOR)) {
        el = el.parentElement;
      }
      blocks.add(el && el !== editor ? el : editor);
    };

    if (range.collapsed) {
      collectBlock(range.startContainer);
    } else {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
      });
      let found = false;
      let current = walker.nextNode();
      while (current) {
        found = true;
        collectBlock(current);
        current = walker.nextNode();
      }
      if (!found) collectBlock(range.startContainer);
    }

    blocks.forEach((el) => {
      el.style.textAlign = align;
    });

    syncFromEditor();
    updateActiveStates();
  };

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const openLinkPopover = () => {
    const selection = window.getSelection();
    const hasSelectionInEditor = selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode);
    savedRangeRef.current = hasSelectionInEditor ? selection.getRangeAt(0).cloneRange() : null;
    // Teks yang sedang diseleksi jadi teks tampilan awal, supaya tinggal isi URL-nya saja.
    setLinkText(savedRangeRef.current && !savedRangeRef.current.collapsed ? savedRangeRef.current.toString() : "");
    setLinkUrl("");
    setIsLinkPopoverOpen(true);
  };

  const closeLinkPopover = () => setIsLinkPopoverOpen(false);

  const applyLink = () => {
    const rawUrl = linkUrl.trim();
    if (!rawUrl) return;
    // Biar admin tidak wajib ketik "https://" — nomor telepon (wa.me), email, dan tautan relatif tetap dibiarkan apa adanya.
    const url = /^([a-z][a-z0-9+.-]*:|\/)/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const displayText = (linkText.trim() || rawUrl).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    editorRef.current?.focus();
    const selection = window.getSelection();
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }

    // insertHTML mengganti seleksi yang aktif (atau menyisip di posisi kursor jika tidak ada
    // seleksi), jadi teks tampilan selalu persis sesuai yang diketik admin — terlepas dari
    // teks asli yang diseleksi sebelumnya.
    document.execCommand("insertHTML", false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${displayText}</a>`);

    syncFromEditor();
    setIsLinkPopoverOpen(false);
  };

  const removeLink = () => runCommand("unlink");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Format gambar harus JPG, PNG, WEBP, atau GIF.");
      return;
    }
    // Bucket "article-images" di Supabase dikonfigurasi dengan batas 1 MB per file — validasi
    // client ini wajib sama persis, kalau tidak upload akan lolos di sini tapi ditolak Supabase.
    if (file.size > 1 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 1 MB.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("bucket", bucket);
      const url = await uploadFileAction(uploadData);
      runCommand("insertHTML", `<img src="${url}" alt="" style="display:block;max-width:100%;height:auto;margin:1.25rem auto;border-radius:0.75rem;" />`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "terjadi kesalahan";
      setError("Gagal mengunggah gambar: " + msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Tombol yang sedang aktif diberi warna merah terisi (bukan cuma abu-abu hover) supaya jelas
  // beda dari tombol biasa — admin bisa langsung lihat format apa yang menyala di posisi kursor.
  const toolbarButtonClass = (isActive: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
      isActive
        ? "bg-red-600 text-white dark:bg-rose-600 dark:text-white"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
    }`;

  const renderButton = (btn: ToolbarButton, isActive = false) => {
    const Icon = btn.icon;
    return (
      <button
        key={btn.command + (btn.value || "")}
        type="button"
        title={btn.label}
        aria-pressed={isActive}
        onMouseDown={(e) => e.preventDefault()} // jaga seleksi teks agar tidak hilang saat klik toolbar
        onClick={() => runCommand(btn.command, btn.value)}
        className={toolbarButtonClass(isActive)}
      >
        <Icon size={16} />
      </button>
    );
  };

  const renderAlignButton = (btn: ToolbarButton & { align: string }) => {
    const Icon = btn.icon;
    const isActive = activeAlign === btn.align;
    return (
      <button
        key={btn.command}
        type="button"
        title={btn.label}
        aria-pressed={isActive}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyAlign(btn.align)}
        className={toolbarButtonClass(isActive)}
      >
        <Icon size={16} />
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1.5">
        {formattingButtons.map((btn) => renderButton(btn, activeFormats.has(btn.command)))}
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/10" />
        {listButtons.map((btn) => renderButton(btn, activeFormats.has(btn.command)))}
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/10" />
        {alignButtons.map(renderAlignButton)}
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/10" />

        <button
          type="button"
          title="Sisipkan Tautan"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPopover}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isLinkPopoverOpen ? "bg-slate-200 dark:bg-white/15 text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
          }`}
        >
          <Link2 size={16} />
        </button>
        <button
          type="button"
          title="Hapus Tautan"
          onMouseDown={(e) => e.preventDefault()}
          onClick={removeLink}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Unlink size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/10" />

        <button
          type="button"
          title="Sisipkan Gambar"
          onClick={handleImageButtonClick}
          disabled={isUploading}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />

        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/10" />
        {historyButtons.map((btn) => renderButton(btn))}
      </div>

      {isLinkPopoverOpen && (
        <div className="space-y-2 border-x border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Teks Tampilan</label>
              <input
                type="text"
                autoFocus
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  } else if (e.key === "Escape") {
                    closeLinkPopover();
                  }
                }}
                placeholder="mis. Klik di sini"
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111114] dark:text-white px-3 py-1.5 text-sm outline-none focus:border-red-500 dark:focus:border-rose-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">URL Tujuan</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  } else if (e.key === "Escape") {
                    closeLinkPopover();
                  }
                }}
                placeholder="https://contoh.com atau wa.me/62..."
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111114] dark:text-white px-3 py-1.5 text-sm outline-none focus:border-red-500 dark:focus:border-rose-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeLinkPopover}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={applyLink}
              disabled={!linkUrl.trim()}
              className="rounded-lg bg-red-600 dark:bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 dark:hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Sisipkan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="border-x border-slate-200 dark:border-white/10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold ml-2 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      <div className="relative">
        {isEmpty && <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          className="rich-content min-h-[240px] w-full rounded-b-xl border border-t-0 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111114] dark:text-white p-4 outline-none transition-all focus:border-red-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-rose-500/20"
        />
      </div>

      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
