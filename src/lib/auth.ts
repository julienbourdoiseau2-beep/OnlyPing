import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET manquant");
}

function toAppRole(role: string): "USER" | "COACH" | "ADMIN" | null {
  if (role === "USER" || role === "COACH" || role === "ADMIN") {
    return role;
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        const role = toAppRole(user.role);
        if (!role) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          emailVerified: user.emailVerified
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = Boolean((user as { emailVerified?: boolean }).emailVerified);
      }

      if (trigger === "update" && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, emailVerified: true }
        });

        if (freshUser) {
          token.role = toAppRole(freshUser.role) ?? token.role;
          token.emailVerified = freshUser.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "COACH" | "ADMIN";
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      return session;
    }
  },
  secret: nextAuthSecret
};