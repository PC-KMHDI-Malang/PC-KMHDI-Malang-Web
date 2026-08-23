import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
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
        const { data: user, error } = await supabaseAdmin
          .from("User")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

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
      const isAdmin = role === 'ADMIN';
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      
      if (isOnAdmin) {
        if (isLoggedIn && isAdmin) return true;
        if (isLoggedIn && !isAdmin) return Response.redirect(new URL('/dashboard', nextUrl));
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnDashboard) {
        if (isLoggedIn && isAdmin) return Response.redirect(new URL('/admin', nextUrl));
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn && nextUrl.pathname === '/login') {
        if (isAdmin) return Response.redirect(new URL('/admin', nextUrl));
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      const jwtToken = token as typeof token & {
        id?: string;
        role?: string;
      };

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
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});