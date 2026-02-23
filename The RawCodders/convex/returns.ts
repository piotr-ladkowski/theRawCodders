import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdminOrManager } from "./roleUtils";

export const ReturnReason = v.union(
  v.literal("Product not received"),
  v.literal("Discrepancy with the description"),
  v.literal("Faulty product"),
  v.literal("Other")
);

export const listReturns = query({
    args: {},
    handler: async (ctx) => {
        await requireAdminOrManager(ctx);
        return await ctx.db.query("returns").collect();
    },
});

export const getReturn = query({
    args: {
        returnId: v.id("returns"),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        return await ctx.db.get(args.returnId);
    },
});

export const getReturnByOrder = query({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        return await ctx.db
            .query("returns")
            .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
            .unique();
    },
});

export const insertReturn = mutation({
    args: {
        orderId: v.id("orders"),
        reason: ReturnReason,
        description: v.string()
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        return await ctx.db.insert("returns", {
            orderId: args.orderId,
            reason: args.reason,
            description: args.description
        });
    },
});

export const updateReturn = mutation({
    args: {
        returnId: v.id("returns"),
        reason: ReturnReason,
        description: v.string(),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        await ctx.db.patch(args.returnId, { 
            reason: args.reason, 
            description: args.description
        });
        return args.returnId;
    },
});

export const deleteReturn = mutation({
    args: {
        returnId: v.id("returns"),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        await ctx.db.delete(args.returnId);
    },
});
