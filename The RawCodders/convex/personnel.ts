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

        if (limit === -1) return { data: personnel, count: personnel.length };

        return {
            data: args.limit !== undefined
                ? personnel.slice(offset, offset + args.limit)
                : personnel.slice(offset),
            count: personnel.length,
        };
    },
});

export const getPersonnel = query({
    args: {
        personnelId: v.id("personnel"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.personnelId);
    },
});

export const getPersonnelByEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("personnel")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
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
        return await ctx.db.insert("personnel", {
            name: args.name,
            email: args.email,
            phone: args.phone,
            role: args.role,
            certifications: args.certifications,
            baseStation: args.baseStation,
            isAvailable: args.isAvailable,
        });
    },
});

export const updatePersonnel = mutation({
    args: {
        personnelId: v.id("personnel"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        certifications: v.optional(v.array(v.string())),
        baseStation: v.optional(v.string()),
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
    args: {
        personnelId: v.id("personnel"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.personnelId);
    },
});

export const getPersonnelDetailStats = query({
    args: {
        personnelId: v.id("personnel"),
    },
    handler: async (ctx, args) => {
        const dispatches = await ctx.db
            .query("dispatches")
            .withIndex("by_personnelId", (q) => q.eq("personnelId", args.personnelId))
            .collect();

        let totalMissions = 0;
        let activeMissions = 0;
        let resolvedMissions = 0;

        for (const d of dispatches) {
            const incident = await ctx.db.get(d.incidentId);
            if (incident) {
                totalMissions++;
                if (incident.status === "active") activeMissions++;
                if (incident.status === "resolved") resolvedMissions++;
            }
        }

        const missionReports = await ctx.db
            .query("mission_reports")
            .withIndex("by_reporterId", (q) => q.eq("reporterId", args.personnelId))
            .collect();

        const averageDifficulty =
            missionReports.length > 0
                ? missionReports.reduce((sum, r) => sum + (r.difficultyRating ?? 0), 0) / missionReports.length
                : null;

        return {
            totalMissions,
            activeMissions,
            resolvedMissions,
            totalReports: missionReports.length,
            averageDifficulty,
        };
    },
});
