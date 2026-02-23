import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const TransactionStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cancelled")
);

export async function recalculateTransaction(ctx: MutationCtx, transactionId: Id<"transactions">) {
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) return;

    const orders = await ctx.db
        .query("orders")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
        .collect();

    let sum = 0;
    const orderIds = [];

    for (const order of orders) {
        orderIds.push(order._id);
        const product = await ctx.db.get(order.productId);
        if (product) {
            sum += product.price * order.quantity;
        }
    }

    const totalPrice = Math.max(0, sum - transaction.discount);

    await ctx.db.patch(transactionId, {
        orderId: orderIds,
        totalPrice: totalPrice,
    });
}

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
        orderId: v.array(v.id("orders")), 
        date: v.string()
    },
    handler: async (ctx, args) => {
        // total price to be calculated
        const totalPrice = 0
        
        return await ctx.db.insert("transactions", {
            clientId: args.clientId,
            status: args.status,
            totalPrice: totalPrice,
            discount: args.discount,
            orderId: args.orderId, 
            date: args.date
        });
    },
});

export const updateTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        clientId: v.id("clients"),
        status: TransactionStatus,
        discount: v.float64(),
        date: v.optional(v.string())
    },
    handler: async (ctx, args) => {    
    const patchData: any = {
        clientId: args.clientId,
        status: args.status, 
        discount: args.discount 
    };
    
    if (args.date !== undefined) {
        patchData.date = args.date;
    }

    await ctx.db.patch(args.transactionId, patchData);
    
    await recalculateTransaction(ctx, args.transactionId);
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
        if (!transaction) throw new Error("Transaction not found");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        if (order.transactionId !== args.transactionId) {
            await ctx.db.patch(args.orderId, { transactionId: args.transactionId });
        }

        await recalculateTransaction(ctx, args.transactionId);
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