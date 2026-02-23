import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdminOrManager } from "./roleUtils";

const UserRole = v.union(
  v.literal("admin"),
  v.literal("user"),
  v.literal("manager")
);

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    return await ctx.db.get(args.userId);
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(UserRole),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    const { userId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(userId, filteredUpdates);
    return userId;
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrManager(ctx);
    await ctx.db.delete(args.userId);
  },
});
