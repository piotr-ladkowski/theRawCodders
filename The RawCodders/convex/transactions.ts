import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const TransactionStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cancelled")
);

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
        status: TransactionStatus,
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

export const updateTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        clientId: v.id("clients"),
        status: TransactionStatus,
        discount: v.float64(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.transactionId, { 
            clientId: args.clientId,
            status: args.status, 
            discount: args.discount 
        });
        return args.transactionId;
    },
});

export const updateTransactionStatus = mutation({
    args: {
        transactionId: v.id("transactions"),
        status: TransactionStatus,
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.transactionId, { status: args.status });
        return args.transactionId;
    },
});

export const addOrderToTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        const order = await ctx.db.get(args.orderId);
        if (!order) {
            throw new Error("Order not found");
        }

        if (transaction.orderId.includes(args.orderId)) {
            return args.transactionId;
        }

        const product = await ctx.db.get(order.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        const orderTotal = product.price * order.quantity;
        const newOrderIds = [...transaction.orderId, args.orderId];
        
        await ctx.db.patch(args.transactionId, {
            orderId: newOrderIds,
            totalPrice: transaction.totalPrice + orderTotal
        });

        if (order.transactionId !== args.transactionId) {
            await ctx.db.patch(args.orderId, { transactionId: args.transactionId });
        }

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