import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { recalculateTransaction } from "./transactions";

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
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        if (product.stock < args.quantity) {
            throw new Error(`Insufficient stock. Cannot order ${args.quantity}. Only ${product.stock} left.`);
        }

        await ctx.db.patch(args.productId, { stock: product.stock - args.quantity });

        const orderId = await ctx.db.insert("orders", {
            transactionId: args.transactionId,
            productId: args.productId,
            quantity: args.quantity,
        });

        await recalculateTransaction(ctx, args.transactionId);

        return orderId;
    },
});

export const updateOrder = mutation({
    args: {
        orderId: v.id("orders"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        const product = await ctx.db.get(order.productId);
        if (product) {
            const diff = args.quantity - order.quantity;
            if (product.stock < diff) {
                throw new Error(`Insufficient stock for update. Cannot increase order by ${diff}. Only ${product.stock} left.`);
            }
            await ctx.db.patch(order.productId, { stock: product.stock - diff });
        }

        await ctx.db.patch(args.orderId, { quantity: args.quantity });
        await recalculateTransaction(ctx, order.transactionId);
        
        return args.orderId;
    },
});

export const deleteOrder = mutation({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        const order = await ctx.db.get(args.orderId);
        if (order) {
            const product = await ctx.db.get(order.productId);
            if (product) {
                await ctx.db.patch(order.productId, { stock: product.stock + order.quantity });
            }

            await ctx.db.delete(args.orderId);
            await recalculateTransaction(ctx, order.transactionId);
        }
    },
})