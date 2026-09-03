import type { Metadata } from "next";

// The login page itself is a client component and can't export metadata, so the segment
// layout carries it. Auth screens hold nothing worth indexing.
export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
