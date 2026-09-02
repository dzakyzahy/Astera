import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./utils/password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
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
  pages: {
    signIn: '/login', // Optional, if they want a custom login page later
  }
};
