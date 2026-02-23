import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdminOrManager } from "./roleUtils";

export const listClients = query({
    args: {},
    handler: async (ctx) => {
        await requireAdminOrManager(ctx);
        return await ctx.db.query("clients").collect();
    },
});

export const getClient = query({
    args: {
        clientId: v.id("clients"),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
        return await ctx.db.get(args.clientId);
    },
});

export const getClientByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        await requireAdminOrManager(ctx);
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
        await requireAdminOrManager(ctx);
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
        await requireAdminOrManager(ctx);
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
        await requireAdminOrManager(ctx);
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
        await requireAdminOrManager(ctx);
        await ctx.db.delete(args.clientId);
    },
});
