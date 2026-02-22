import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listTransactions = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("transactions").collect();
    },
});

export const getTransaction = query({
    args: {
        transactionId: v.id("transactions"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.transactionId);
    },
});

export const getTransactionsByClient = query({
    args: {
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .collect();
    },
});

export const insertTransaction = mutation({
    args: {
        clientId: v.id("clients"),
        status: v.string(),
        discount: v.float64(),
        orderId: v.array(v.id("orders"))
    },
    handler: async (ctx, args) => {
        // total price to be calculated
        const totalPrice = 0
        
        return await ctx.db.insert("transactions", {
            clientId: args.clientId,
            status: args.status,
            totalPrice: totalPrice,
            discount: args.discount,
            orderId: args.orderId
        });
    },
});

export const updateTransactionStatus = mutation({
    args: {
        transactionId: v.id("transactions"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.transactionId, { status: args.status });
        return args.transactionId;
    },
});

export const deleteTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.transactionId);
    },
});
