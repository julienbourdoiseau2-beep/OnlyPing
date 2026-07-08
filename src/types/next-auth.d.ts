import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "COACH" | "ADMIN";
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "USER" | "COACH" | "ADMIN";
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "COACH" | "ADMIN";
    emailVerified?: boolean;
  }
}