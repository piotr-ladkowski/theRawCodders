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

// add delete dispatch mutation
export const deleteDispatch = mutation({
    args: { dispatchId: v.id("dispatches") },
    handler: async (ctx, args) => {
        const dispatch = await ctx.db.get(args.dispatchId);
        if (!dispatch) throw new Error("Dispatch Not Found");

        // If personnel was dispatched, mark them available again
        if (dispatch.personnelId) {
            await ctx.db.patch(dispatch.personnelId, { isAvailable: true });
        }
        // If equipment was dispatched, mark it available again
        if (dispatch.equipmentId) {
            await ctx.db.patch(dispatch.equipmentId, { status: "Available" });
        }

        await ctx.db.delete(args.dispatchId);
    },
});

export const updateDispatch = mutation({
    args: {
        dispatchId: v.id("dispatches"),
        personnelId: v.optional(v.id("personnel")),
        equipmentId: v.optional(v.id("equipment")),
        dispatchTime: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { dispatchId, ...fields } = args;
        const dispatch = await ctx.db.get(dispatchId);
        if (!dispatch) throw new Error("Dispatch Not Found");

        // Handle personnel changes
        if (fields.personnelId && fields.personnelId !== dispatch.personnelId) {
            // Mark old personnel available
            if (dispatch.personnelId) {
                await ctx.db.patch(dispatch.personnelId, { isAvailable: true });
            }
            // Mark new personnel unavailable
            await ctx.db.patch(fields.personnelId, { isAvailable: false });
        }

        // Handle equipment changes
        if (fields.equipmentId && fields.equipmentId !== dispatch.equipmentId) {
            // Mark old equipment available
            if (dispatch.equipmentId) {
                await ctx.db.patch(dispatch.equipmentId, { status: "Available" });
            }
            // Mark new equipment in use
            await ctx.db.patch(fields.equipmentId, { status: "In Use" });
        }

        await ctx.db.patch(dispatchId, fields);
        return dispatchId;
    },
});