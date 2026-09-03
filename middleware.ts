export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/profile", "/profile/:path*", "/dashboard/:path*", "/admin/:path*"],
};
