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

export const insertClient = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.number()
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("clients", {
            name: args.name,
            email: args.email,
            phone: args.phone
        });
    },
});

export const updateClient = mutation({
    args: {
        clientId: v.id("clients"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
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
