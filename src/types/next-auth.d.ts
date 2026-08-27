import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: boolean;
      role: string;
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    emailVerified?: boolean;
    role?: string;
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified: boolean;
    role: string;
    status: string;
  }
}
