import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listPersonnel = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const personnel = await ctx.db.query("personnel").collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        
        return {
            data: limit === -1 ? personnel : personnel.slice(offset, offset + limit),
            count: personnel.length
        };
    },
});

export const getPersonnel = query({
    args: { personnelId: v.id("personnel") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.personnelId);
    },
});

export const insertPersonnel = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        role: v.string(),
        certifications: v.array(v.string()),
        baseStation: v.string(),
        isAvailable: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("personnel", args);
    },
});

export const updatePersonnel = mutation({
    args: {
        personnelId: v.id("personnel"),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        isAvailable: v.optional(v.boolean()),
        aiProfileSummary: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { personnelId, ...fields } = args;
        await ctx.db.patch(personnelId, fields);
        return personnelId;
    },
});

export const deletePersonnel = mutation({
    args: { personnelId: v.id("personnel") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.personnelId);
    },
});

// Replaces Client Stats with Personnel Operational Stats
export const getPersonnelDetailStats = query({
    args: { personnelId: v.id("personnel") },
    handler: async (ctx, args) => {
        const dispatches = await ctx.db
            .query("dispatches")
            .withIndex("by_personnelId", (q) => q.eq("personnelId", args.personnelId))
            .collect();

        const totalMissions = dispatches.length;
        const missionDates: Record<string, number> = {};

        for (const dispatch of dispatches) {
            const date = dispatch.dispatchTime.split("T")[0];
            missionDates[date] = (missionDates[date] || 0) + 1;
        }

        const missionsOverTime = Object.entries(missionDates)
            .map(([date, count]) => ({ date, amount: count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { totalMissions, missionsOverTime };
    },
});