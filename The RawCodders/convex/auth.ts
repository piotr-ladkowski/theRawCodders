import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if user exists
      if (args.existingUserId) {
        return args.existingUserId;
      }
      
      // Check if this is the first user
      const existingUsers = await ctx.db.query("users").first();
      const isFirstUser = !existingUsers;
      
      // Create new user with role (admin if first user, otherwise user)
      const userId = await ctx.db.insert("users", {
        email: args.profile.email,
        role: isFirstUser ? "admin" : "user",
      });
      
      return userId;
    },
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("manager")),
  },
  handler: async (ctx, args) => {
    // Optional: Add authorization check here to ensure only admins can update roles
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.userId, { role: args.role });
    return args.userId;
  },
});