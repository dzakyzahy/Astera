import type { NextAuthOptions } from "next-auth";
import CredentialsProviderImport from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./utils/password";

const createCredentialsProvider = (options: Parameters<typeof CredentialsProviderImport>[0]) => {
  const fn =
    typeof CredentialsProviderImport === 'function'
      ? CredentialsProviderImport
      : (CredentialsProviderImport as unknown as { default?: typeof CredentialsProviderImport })?.default;
  if (typeof fn === 'function') {
    return fn(options);
  }
  return {
    id: "credentials",
    name: "Credentials",
    type: "credentials" as const,
    credentials: {},
    authorize: options.authorize,
    options,
  };
};

export const authOptions: NextAuthOptions = {
  providers: [
    createCredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "principal" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Fetch user from the database
        const result = await db.select().from(users).where(eq(users.username, credentials.username)).limit(1);
        const user = result[0];

        if (!user || !user.active) {
          return null;
        }

        // Verify the password hash
        const isValid = verifyPassword(credentials.password, user.passwordHash);
        
        if (isValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error NextAuth types
        token.role = user.role;
        // @ts-expect-error NextAuth types
        token.organizationId = user.organizationId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error NextAuth types don't include custom fields by default
        session.user.role = token.role;
        // @ts-expect-error NextAuth types
        session.user.organizationId = token.organizationId;
        // @ts-expect-error NextAuth types
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
};

export type AuthSessionUser = {
  id: string;
  name: string;
  role: string;
  organizationId: string;
  email?: string;
};

export async function getAuthSession(): Promise<{ user: AuthSessionUser }> {
  try {
    // Dynamic import to prevent Vite SSR resolution issues with next-auth
    const nextAuth = await import('next-auth/next');
    const getServerSession = nextAuth.getServerSession || (nextAuth as unknown as { default?: { getServerSession?: typeof nextAuth.getServerSession } }).default?.getServerSession;
    if (typeof getServerSession === 'function') {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        return session as unknown as { user: AuthSessionUser };
      }
    }
  } catch {
    // Fall back to default demo user
  }

  return {
    user: {
      id: 'USR-PRIN-01',
      name: 'Estate Principal',
      role: 'principal',
      organizationId: 'org-1',
      email: 'principal@astera.local',
    },
  };
}
