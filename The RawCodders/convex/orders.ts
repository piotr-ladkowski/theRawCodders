import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listOrders = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("orders").collect();
    },
});

export const getOrder = query({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.orderId);
    },
});

export const getOrdersByTransaction = query({
    args: {
        transactionId: v.id("transactions"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("orders")
            .withIndex("by_transactionId", (q) =>
                q.eq("transactionId", args.transactionId),
            )
            .collect();
    },
});

export const getOrdersByProduct = query({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("orders")
            .withIndex("by_productId", (q) =>
                q.eq("productId", args.productId),
            )
            .collect();
    },
});

export const insertOrder = mutation({
    args: {
        transactionId: v.id("transactions"),
        productId: v.id("products"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("orders", {
            transactionId: args.transactionId,
            productId: args.productId,
            quantity: args.quantity,
        });
    },
});

export const updateOrder = mutation({
    args: {
        orderId: v.id("orders"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.orderId, { quantity: args.quantity });
        return args.orderId;
    },
});

export const deleteOrder = mutation({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.orderId);
    },
});
