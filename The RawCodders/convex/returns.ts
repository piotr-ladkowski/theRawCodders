import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const ReturnReason = v.union(
  v.literal("Product not received"),
  v.literal("Discrepancy with the description"),
  v.literal("Faulty product"),
  v.literal("Other")
);

export const listReturns = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let returns = await ctx.db.query("returns").collect();

        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        if (args.limit !== undefined) {
            return returns.slice(offset, offset + args.limit);
        }
        
        return returns.slice(offset);
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
        reason: ReturnReason,
        description: v.string()
    },
    handler: async (ctx, args) => {
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
        await ctx.db.delete(args.returnId);
    },
});

export const listReturnsWithDates = query({
    args: {},
    handler: async (ctx) => {
        const returns = await ctx.db.query("returns").collect();
        const result = [];

        for (const ret of returns) {
            const order = await ctx.db.get(ret.orderId);
            if (order) {
                const transaction = await ctx.db.get(order.transactionId);
                if (transaction) {
                    result.push({
                        ...ret,
                        date: transaction.date,
                    });
                }
            }
        }

        return result;
    },
});
