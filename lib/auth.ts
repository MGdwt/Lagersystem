import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import "@/lib/env-validation";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL!],

  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,

      scopes: ["openid", "profile", "user.Read", "email", "offline_access"],
      mapProfileToUser: async (profile: unknown) => {
        const p = profile as Record<string, unknown> | null;

        const name =
          (p && typeof p.name === "string" && p.name) ||
          (p && typeof p.displayName === "string" && p.displayName) ||
          "User";

        const email =
          (p && typeof p.email === "string" && p.email) ||
          (p && typeof p.mail === "string" && p.mail) ||
          (p &&
            typeof p.preferred_username === "string" &&
            p.preferred_username) ||
          (p &&
            typeof p.preferredUsername === "string" &&
            p.preferredUsername) ||
          "";

        return {
          name,
          email,
          image: null,
        };
      },

      authority: "https://login.microsoftonline.com",
    },
  },
  account: {
    storeAccountCookie: false,
  },
  plugins: [nextCookies()],
});
