import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub; // keep your user id
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always send user to /home after login
      return "/home";
    },
  },

  pages: {
    signIn: "/", // optional, tells NextAuth to use landing page as login
  },
});

export { handler as GET, handler as POST };
