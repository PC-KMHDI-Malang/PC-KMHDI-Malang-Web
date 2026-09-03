"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send } from "lucide-react";
import { knowledgeBase } from "@/data/chatbot";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

// Fungsi pencarian jawaban manual
function findBestAnswer(input: string): string {
  const lowerInput = input.toLowerCase();
  let bestMatch = { matchCount: 0, answer: "" };

  for (const item of knowledgeBase) {
    let matchCount = 0;
    for (const keyword of item.keywords) {
      if (lowerInput.includes(keyword)) {
        matchCount++;
      }
    }

    if (matchCount > bestMatch.matchCount) {
      bestMatch = { matchCount, answer: item.answer };
    }
  }

  if (bestMatch.matchCount > 0) {
    return bestMatch.answer;
  }

  return "Maaf, Kaka belum menemukan informasi yang tepat terkait hal itu. Coba tanyakan hal lain seputar profil KMHDI, cara bergabung, kaderisasi, atau kegiatan di PC KMHDI Malang ya! 🙏";
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Om Swastyastu! 🙏\n\nHalo, saya Kaka Assistant dari PC KMHDI Malang. Kamu bisa bertanya apapun seputar KMHDI, mulai dari sejarah, jati diri, hingga cara bergabung. Ada yang ingin kamu ketahui?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Tambah pesan user
    const newUserMsg: Message = { id: Date.now().toString(), sender: "user", text };
    setMessages((prev) => [...prev, newUserMsg]);
    setMessage("");
    setIsTyping(true);

    // Simulasi waktu mikir AI (1 - 2 detik)
    const typingDelay = Math.floor(Math.random() * 1000) + 1000;
    setTimeout(() => {
      const botReply = findBestAnswer(text);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "bot", text: botReply }]);
      setIsTyping(false);
    }, typingDelay);
  };

  return (
    <div className="fixed bottom-24 right-5 md:right-6 z-50 flex flex-col items-end">
      {/* Jendela Chat */}
      {isOpen && (
        <div className="mb-4 w-[320px] sm:w-[360px] overflow-hidden rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1A1A1A] border-b border-slate-100 dark:border-white/5 px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A80000] font-black text-white shadow-lg tracking-wider">KA</div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight leading-tight">Kaka Assistant</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2.5 text-slate-400 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Area Pesan */}
          <div className="h-[360px] overflow-y-auto bg-white dark:bg-[#121212] p-5 flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#A80000] text-white rounded-2xl rounded-tr-sm font-medium"
                      : "bg-slate-100 dark:bg-[#1E1E1E] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-white/5 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Indikator Mengetik */}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="bg-slate-100 dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 rounded-2xl rounded-tl-sm px-4 py-4 flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-neutral-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Tombol Aksi Cepat */}
          <div className="bg-white dark:bg-[#121212] px-5 pb-3 flex gap-2 overflow-x-auto hide-scrollbar border-t border-slate-50 dark:border-transparent pt-2">
            <button
              onClick={() => handleSend("Apa itu KMHDI?")}
              className="shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1E1E] px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-[#A80000]/50 hover:text-[#A80000] dark:hover:text-white transition-colors"
            >
              Profil KMHDI
            </button>
            <button
              onClick={() => handleSend("Bagaimana cara gabung?")}
              className="shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1E1E] px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-[#A80000]/50 hover:text-[#A80000] dark:hover:text-white transition-colors"
            >
              Cara Gabung
            </button>
            <button
              onClick={() => handleSend("Tahapan kaderisasi apa saja?")}
              className="shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1E1E] px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-[#A80000]/50 hover:text-[#A80000] dark:hover:text-white transition-colors"
            >
              Kaderisasi
            </button>
          </div>

          {/* Area Input */}
          <div className="bg-slate-50 dark:bg-[#1A1A1A] p-4 border-t border-slate-100 dark:border-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(message);
              }}
              className="flex items-center gap-3 relative"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesan Anda..."
                className="flex-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] pl-5 pr-12 py-3 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-[#A80000] dark:focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/10 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className="absolute right-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A80000] text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={15} className="-ml-0.5 mt-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tombol Mengambang (Floating) */}
      <div className="relative flex items-center">
        {/* Tooltip */}
        {!isOpen && (
          <div
            className={`absolute right-full mr-5 whitespace-nowrap rounded-2xl bg-white dark:bg-slate-800 px-5 py-2.5 text-[13px] font-bold tracking-wide text-slate-800 dark:text-white shadow-xl border border-slate-100 dark:border-white/10 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"
            }`}
          >
            Tanya Asisten AI
            {/* Segitiga Panah Tooltip */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-[7px] border-transparent border-l-white dark:border-l-slate-800"></div>
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-[0_10px_25px_rgba(168,0,0,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 z-10 ${
            isOpen ? "bg-slate-800 dark:bg-[#1E1E1E] text-white" : "bg-gradient-to-tr from-[#8B0000] to-[#C00000] text-white hover:brightness-110"
          }`}
        >
          {isOpen ? <X size={26} /> : <Bot size={28} />}

          {/* Animasi detak (ping) di belakang tombol */}
          {!isOpen && <span className="absolute -z-10 inline-flex h-[110%] w-[110%] animate-ping rounded-full bg-[#A80000] opacity-40"></span>}
        </button>
      </div>
    </div>
  );
}
