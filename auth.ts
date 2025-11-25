import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import db from "./database/drizzle";
import { users } from "./database/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return "/auth/error";

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .then((res) => res[0]);

      if (!existingUser) {
        return "/auth/error"; // unauthorized emails go here
      }

      return true;
    },

    async jwt({ token }) {
      if (!token.email) return token;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email))
        .then((res) => res[0]);

      if (existingUser) {
        token.id = existingUser.id.toString();
        token.role = existingUser.role;
        token.departmentId = existingUser.departmentId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as number;
      }
      return session;
    },
  },

  pages: {
    error: "/auth/error",
  },
});
