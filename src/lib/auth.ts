import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { normalizeUsername, isAllowedUsername } from "./auth-config";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = normalizeUsername(credentials.username);

        if (!isAllowedUsername(username)) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || user.status !== "active") return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = true;
        token.role = user.role as string;
        token.status = user.status as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = true;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
};
