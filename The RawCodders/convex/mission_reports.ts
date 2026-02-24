import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listReports = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const reports = await ctx.db.query("mission_reports").order("desc").collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        
        return {
            data: limit === -1 ? reports : reports.slice(offset, offset + limit),
            count: reports.length
        };
    },
});

export const insertReport = mutation({
    args: {
        incidentId: v.id("incidents"),
        reporterId: v.id("personnel"),
        difficultyRating: v.optional(v.number()),
        notes: v.string(),
        reportDate: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("mission_reports", args);
    },
});

export const deleteReport = mutation({
    args: { reportId: v.id("mission_reports") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.reportId);
    },
});