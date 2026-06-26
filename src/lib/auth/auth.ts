import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "drasa_ai_development_secret_32_bytes",
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only sync to DB if MongoDB is configured
      try {
        await connectDB();
        if (account?.provider === "google") {
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name || "User",
              email: user.email,
              image: user.image,
              role: "user",
              plan: "free",
              isGuest: false,
              preferences: {
                theme: "system",
                language: "en",
                thinkingMode: false,
                temporaryChat: false,
                ttsEnabled: false,
                defaultModel: "openai/gpt-oss-120b:free",
              },
              usage: {
                messagesUsedToday: 0,
                tokensUsedToday: 0,
                filesUsedToday: 0,
                imagesUsedToday: 0,
                toolsUsedToday: 0,
                websiteGenerationsUsed: 0,
                lastResetDate: new Date(),
              }
            });
          }
        }
      } catch (dbError) {
        console.warn("⚠️ Could not sync user to MongoDB (DB may not be configured):", (dbError as Error).message);
        // Don't block sign-in if DB is down
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user || !token.id) {
        try {
          await connectDB();
          const email = user?.email || token.email;
          if (email) {
            const dbUser = await User.findOne({ email });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
              token.plan = dbUser.plan;
            }
          }
        } catch (dbError) {
          console.warn("⚠️ Could not fetch user from MongoDB for JWT:", (dbError as Error).message);
          // Set defaults if DB is unavailable
          if (!token.role) token.role = "user";
          if (!token.plan) token.plan = "free";
        }
      }

      // Handle client-side update() calls
      if (trigger === "update" && session) {
        if (session.plan) token.plan = session.plan;
        if (session.role) token.role = session.role;
        if (session.user?.plan) token.plan = session.user.plan;
        if (session.user?.role) token.role = session.user.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "user";
        session.user.plan = (token.plan as string) || "free";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});
