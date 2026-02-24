import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listDispatches = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const dispatches = await ctx.db.query("dispatches").order("desc").collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        
        return {
            data: dispatches.slice(offset, offset + limit),
            total: dispatches.length,
        };
    },
});

export const getDispatchesByIncident = query({
    args: { incidentId: v.id("incidents") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dispatches")
            .withIndex("by_incidentId", (q) => q.eq("incidentId", args.incidentId))
            .collect();
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
        // If personnel is dispatched, mark them unavailable
        if (args.personnelId) {
            await ctx.db.patch(args.personnelId, { isAvailable: false });
        }
        // If equipment is dispatched, mark it in use
        if (args.equipmentId) {
            await ctx.db.patch(args.equipmentId, { status: "In Use" });
        }

        return await ctx.db.insert("dispatches", args);
    },
});