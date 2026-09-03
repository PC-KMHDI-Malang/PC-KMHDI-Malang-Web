import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabase";

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

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        // Gunakan supabaseAdmin (Service Role) karena RLS mencegah Anon Key membaca tabel User
        const { data: user, error } = await supabaseAdmin.from("User").select("*").eq("email", email).single();

        if (error || !user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

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
      const role = (auth?.user as any)?.role;
      const isAdmin = role === "ADMIN";
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnProfile = nextUrl.pathname.startsWith("/profile");

      if (isOnAdmin) {
        if (isLoggedIn && isAdmin) return true;
        if (isLoggedIn && !isAdmin) return Response.redirect(new URL("/profile", nextUrl));
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnProfile) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        if (isAdmin) return Response.redirect(new URL("/admin", nextUrl));
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
