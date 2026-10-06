import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabase";
import { canAccessAdminPath, isAdminPanelRole } from "@/lib/roles";
import { isTreasurerEmail } from "@/lib/kas";
import { checkLock, clearAttempts, clientIpFrom, emailKey, ipKey, recordFailure } from "@/lib/loginRateLimit";

export const {
  handlers,
  signIn,
  signOut,
  auth,
  unstable_update: update,
} = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 Jam (Otomatis logout setelah 2 jam)
    updateAge: 15 * 60, // Perbarui token jika ada aktivitas setiap 15 menit
  },
  jwt: {
    maxAge: 2 * 60 * 60, // 2 Jam
  },

  // Login dilakukan di apps.kmhdimalang.org, tapi status login juga dibutuhkan di domain publik
  // kmhdimalang.org (tombol suka, membaca PDF e-book, nama di navbar) — lihat lib/appHost.ts.
  // Dengan AUTH_COOKIE_DOMAIN=".kmhdimalang.org", cookie sesi berlaku untuk kedua domain. Namanya
  // sengaja dibedakan dari cookie bawaan supaya tidak bentrok dengan cookie lama (yang hanya
  // berlaku di satu domain) — akibatnya pengguna cukup login ulang sekali setelah ini aktif.
  // Tidak dipakai di deployment Preview Vercel (*.vercel.app): browser menolak cookie bertanda
  // ".kmhdimalang.org" dari domain lain, sehingga login di Preview akan gagal total.
  ...(process.env.AUTH_COOKIE_DOMAIN && process.env.VERCEL_ENV !== "preview"
    ? {
        cookies: {
          sessionToken: {
            name: "__Secure-kmhdi.session-token",
            options: { domain: process.env.AUTH_COOKIE_DOMAIN, httpOnly: true, sameSite: "lax" as const, path: "/", secure: true },
          },
        },
      }
    : {}),

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@kmhdimalang.org",
        },

        password: {
          label: "Password",
          type: "password",
          placeholder: "Masukkan password",
        },
      },

      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        // Dihitung per alamat email DAN per IP: yang pertama menahan serangan yang membidik
        // satu akun, yang kedua menahan penyapuan banyak akun dari satu sumber.
        const ip = clientIpFrom(request.headers);
        const keys = [emailKey(email), ...(ip ? [ipKey(ip)] : [])];

        // Diperiksa sebelum query & bcrypt: percobaan yang sedang terkunci tidak boleh
        // menghabiskan waktu CPU server sama sekali.
        const { locked } = await checkLock(keys);
        if (locked) return null;

        // Gunakan supabaseAdmin (Service Role) karena RLS mencegah Anon Key membaca tabel User
        const { data: user, error } = await supabaseAdmin.from("User").select("*").eq("email", email).single();

        if (error || !user) {
          await recordFailure(keys);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          await recordFailure(keys);
          return null;
        }

        await clearAttempts(keys);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: String(user.role),
        };
      },
    }),
  ],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnProfile = nextUrl.pathname.startsWith("/profile");

      if (isOnAdmin) {
        if (!isLoggedIn) return false; // Redirect unauthenticated users to login page
        // Role di luar ADMIN/KONTRIBUTOR (anggota biasa) tidak berurusan sama sekali dengan
        // panel admin — diarahkan ke halaman profil kader. KONTRIBUTOR boleh masuk panel admin
        // tapi cuma ke halaman yang diizinkan (Beranda, Artikel, e-Book) — lihat lib/roles.ts.
        if (!isAdminPanelRole(role)) return Response.redirect(new URL("/profile", nextUrl));
        if (!canAccessAdminPath(role, nextUrl.pathname)) return Response.redirect(new URL("/admin", nextUrl));
        return true;
      }

      // /kas: setiap akun yang login boleh melihat catatan iurannya sendiri. /kas/kelola cuma
      // untuk akun bendahara — siapa pun selain itu (termasuk ADMIN) dikembalikan ke /kas.
      if (nextUrl.pathname === "/kas" || nextUrl.pathname.startsWith("/kas/")) {
        if (!isLoggedIn) return false;
        if (nextUrl.pathname.startsWith("/kas/kelola") && !isTreasurerEmail(auth?.user?.email)) {
          return Response.redirect(new URL("/kas", nextUrl));
        }
        return true;
      }

      if (isOnProfile) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        if (isAdminPanelRole(role)) return Response.redirect(new URL("/admin", nextUrl));
        return Response.redirect(new URL("/profile", nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      const jwtToken = token as typeof token & {
        id?: string;
        role?: string;
      };

      if (trigger === "update" && session) {
        if (session.user?.name) {
          jwtToken.name = session.user.name;
        }
      }

      if (user) {
        const authenticatedUser = user as typeof user & {
          role: string;
        };

        jwtToken.id = authenticatedUser.id;
        jwtToken.role = authenticatedUser.role;
      }

      return jwtToken;
    },

    async session({ session, token }) {
      const jwtToken = token as typeof token & {
        id?: string;
        role?: string;
      };

      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id: string;
          role: string;
        };

        sessionUser.id = jwtToken.id ?? "";
        sessionUser.role = jwtToken.role ?? "";
        if (jwtToken.name) {
          sessionUser.name = jwtToken.name;
        }
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
