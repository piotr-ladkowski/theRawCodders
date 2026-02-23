import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listClients = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("clients").collect();
    },
});

export const getClient = query({
    args: {
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.clientId);
    },
});

export const getClientByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("clients")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

export const getClientByName = query({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("clients")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .unique();
    },
});

export const insertClient = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        birthDate: v.string(),
        sex: v.string(),
        address: v.object({
            line1: v.string(),
            line2: v.string(),
            postCode: v.string(),
            city: v.string(),
            country: v.string(),
        })
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("clients", {
            name: args.name,
            email: args.email,
            phone: args.phone,
            birthDate: args.birthDate,
            sex: args.sex,
            address: args.address
        });
    },
});

export const updateClient = mutation({
    args: {
        clientId: v.id("clients"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        birthDate: v.optional(v.string()),
        sex: v.optional(v.string()),
        address: v.optional(v.object({
            line1: v.string(),
            line2: v.string(),
            postCode: v.string(),
            city: v.string(),
            country: v.string(),
        }))
    },
    handler: async (ctx, args) => {
        const { clientId, ...fields } = args;
        await ctx.db.patch(clientId, fields);
        return clientId;
    },
});

export const deleteClient = mutation({
    args: {
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.clientId);
    },
});

export const getClientDetailStats = query({
    args: {
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .collect();

        let totalSpending = 0;
        let totalOrders = 0;
        let totalReturns = 0;
        const spendingByDate: Record<string, number> = {};

        for (const tx of transactions) {
            if (tx.status === "completed") {
                totalSpending += tx.totalPrice;
                if (tx.date) {
                    const date = tx.date.split("T")[0];
                    spendingByDate[date] = (spendingByDate[date] || 0) + tx.totalPrice;
                }
            }

            for (const orderId of tx.orderId) {
                totalOrders++;
                const ret = await ctx.db
                    .query("returns")
                    .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
                    .unique();
                if (ret) totalReturns++;
            }
        }

        const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

        const spendingOverTime = Object.entries(spendingByDate)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { totalSpending, totalOrders, totalReturns, returnRate, spendingOverTime };
    },
});
