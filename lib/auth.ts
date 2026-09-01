import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "principal" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authentication for the competition pilot
        if (credentials?.username === 'principal') {
          return {
            id: 'USR-PRIN-01',
            name: 'Estate Principal',
            email: 'principal@astera.local',
            role: 'principal',
            organizationId: 'ORG-AST-01',
          };
        }
        if (credentials?.username === 'manager') {
          return {
            id: 'ACT-USR-MGR',
            name: 'Staff Lead',
            email: 'manager@astera.local',
            role: 'estate_manager',
            organizationId: 'ORG-AST-01',
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/login', // Optional, if they want a custom login page later
  }
};
