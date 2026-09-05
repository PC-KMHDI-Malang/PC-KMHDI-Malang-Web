"use client";

import dynamic from "next/dynamic";

// next/dynamic dengan ssr:false cuma boleh dipanggil dari Client Component — app/(public)/layout.tsx
// tempat ChatBot dipakai adalah Server Component (async, pakai auth()), jadi pembungkus tipis ini
// yang menampung pemanggilannya. ChatBot (dan basis pengetahuannya di data/chatbot.ts, ~10 KB) cuma
// dipakai kalau tombolnya di-tap, jadi tidak perlu ikut ke bundle awal ataupun di-render di server.
export const ChatBot = dynamic(() => import("@/components/ui/ChatBot").then((mod) => mod.ChatBot), { ssr: false });
