import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listDispatches = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const allDispatches = await ctx.db.query("dispatches").order("desc").collect();

        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;

        return {
            data: allDispatches.slice(offset, offset + limit),
            total: allDispatches.length,
        };
    },
});

export const getDispatch = query({
    args: {
        dispatchId: v.id("dispatches"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.dispatchId);
    },
});

export const getDispatchesByIncident = query({
    args: {
        incidentId: v.id("incidents"),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const allDispatches = await ctx.db
            .query("dispatches")
            .withIndex("by_incidentId", (q) =>
                q.eq("incidentId", args.incidentId),
            )
            .order("desc")
            .collect();

        const offset = args.offset ?? 0;
        const limit = args.limit ?? allDispatches.length;

        return {
            data: allDispatches.slice(offset, offset + limit),
            total: allDispatches.length,
        };
    },
});

export const insertDispatch = mutation({
    args: {
        incidentId: v.id("incidents"),
        personnelId: v.optional(v.id("personnel")),
        equipmentId: v.optional(v.id("equipment")),
        dispatchTime: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("dispatches", {
            incidentId: args.incidentId,
            personnelId: args.personnelId,
            equipmentId: args.equipmentId,
            dispatchTime: args.dispatchTime,
        });
    },
});

export const updateDispatch = mutation({
    args: {
        dispatchId: v.id("dispatches"),
        incidentId: v.optional(v.id("incidents")),
        personnelId: v.optional(v.id("personnel")),
        equipmentId: v.optional(v.id("equipment")),
        dispatchTime: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { dispatchId, ...fields } = args;
        await ctx.db.patch(dispatchId, fields);
        return dispatchId;
    },
});

export const deleteDispatch = mutation({
    args: {
        dispatchId: v.id("dispatches"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.dispatchId);
    },
});
