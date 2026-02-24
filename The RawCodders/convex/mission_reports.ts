import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listMissionReports = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const reports = await ctx.db.query("mission_reports").collect();

        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;

        if (limit === -1) return { data: reports, total: reports.length };

        const slicedReports = args.limit !== undefined
            ? reports.slice(offset, offset + args.limit)
            : reports.slice(offset);

        const enrichedReports = await Promise.all(
            slicedReports.map(async (report) => {
                const reporter = await ctx.db.get(report.reporterId);
                const incident = await ctx.db.get(report.incidentId);
                return {
                    ...report,
                    reporterName: reporter ? reporter.name : "Unknown",
                    incidentType: incident ? incident.type : "Unknown",
                };
            })
        );

        return { data: enrichedReports, total: reports.length };
    },
});

export const getMissionReport = query({
    args: {
        reportId: v.id("mission_reports"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.reportId);
    },
});

export const insertMissionReport = mutation({
    args: {
        incidentId: v.id("incidents"),
        reporterId: v.id("personnel"),
        difficultyRating: v.optional(v.number()),
        notes: v.string(),
        reportDate: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("mission_reports", {
            incidentId: args.incidentId,
            reporterId: args.reporterId,
            difficultyRating: args.difficultyRating,
            notes: args.notes,
            reportDate: args.reportDate,
        });
    },
});

export const updateMissionReport = mutation({
    args: {
        reportId: v.id("mission_reports"),
        difficultyRating: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { reportId, ...fields } = args;
        await ctx.db.patch(reportId, fields);
        return reportId;
    },
});

export const deleteMissionReport = mutation({
    args: {
        reportId: v.id("mission_reports"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.reportId);
    },
});
