import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    departmentId: number;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      departmentId: number;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

// For JWT augmentation
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    departmentId: number;
  }
}
