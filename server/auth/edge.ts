import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Minimal auth config for Edge runtime (proxy.ts)
// This doesn't import Prisma or any Node.js-only modules
// It's only used for JWT validation in the proxy
// Note: Providers array is required by NextAuth, but empty is OK for JWT validation
const edgeAuthOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [], // Empty providers - only used for JWT validation, not authentication
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

// Export only the auth function for Edge runtime
// This doesn't include handlers, signIn, or signOut since those need the full config
export const { auth } = NextAuth(edgeAuthOptions);

