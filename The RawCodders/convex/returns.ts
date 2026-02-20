import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listReturns = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("returns").collect();
    },
});

export const getReturn = query({
    args: {
        returnId: v.id("returns"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.returnId);
    },
});

export const getReturnByOrder = query({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("returns")
            .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
            .unique();
    },
});

export const insertReturn = mutation({
    args: {
        orderId: v.id("orders"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("returns", {
            orderId: args.orderId,
            reason: args.reason,
        });
    },
});

export const updateReturn = mutation({
    args: {
        returnId: v.id("returns"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.returnId, { reason: args.reason });
        return args.returnId;
    },
});

export const deleteReturn = mutation({
    args: {
        returnId: v.id("returns"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.returnId);
    },
});
