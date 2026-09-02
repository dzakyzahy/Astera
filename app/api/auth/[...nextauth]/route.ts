import NextAuthImport from "next-auth";
import { authOptions } from "@/lib/auth";

const NextAuth =
  typeof NextAuthImport === 'function'
    ? NextAuthImport
    : (NextAuthImport as unknown as { default?: typeof NextAuthImport })?.default;

const handler = typeof NextAuth === 'function' ? NextAuth(authOptions) : () => new Response('NextAuth not initialized', { status: 500 });

export { handler as GET, handler as POST };
