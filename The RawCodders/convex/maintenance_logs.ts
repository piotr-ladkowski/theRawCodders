import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listMaintenanceLogs = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const logs = await ctx.db.query("maintenance_logs").collect();

        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;

        if (limit === -1) return { data: logs, total: logs.length };

        const slicedLogs = args.limit !== undefined
            ? logs.slice(offset, offset + args.limit)
            : logs.slice(offset);

        const enrichedLogs = await Promise.all(
            slicedLogs.map(async (log) => {
                const equipment = await ctx.db.get(log.equipmentId);
                return {
                    ...log,
                    equipmentName: equipment ? equipment.name : "Unknown Equipment",
                };
            })
        );

        return { data: enrichedLogs, total: logs.length };
    },
});

export const getMaintenanceLog = query({
    args: {
        logId: v.id("maintenance_logs"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.logId);
    },
});

export const insertMaintenanceLog = mutation({
    args: {
        equipmentId: v.id("equipment"),
        issueType: v.string(),
        description: v.string(),
        logDate: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("maintenance_logs", {
            equipmentId: args.equipmentId,
            issueType: args.issueType,
            description: args.description,
            logDate: args.logDate,
        });
    },
});

export const updateMaintenanceLog = mutation({
    args: {
        logId: v.id("maintenance_logs"),
        issueType: v.optional(v.string()),
        description: v.optional(v.string()),
        logDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { logId, ...fields } = args;
        await ctx.db.patch(logId, fields);
        return logId;
    },
});

export const deleteMaintenanceLog = mutation({
    args: {
        logId: v.id("maintenance_logs"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.logId);
    },
});

export const listMaintenanceLogsWithDates = query({
    args: {},
    handler: async (ctx) => {
        const logs = await ctx.db.query("maintenance_logs").collect();
        return logs.map((log) => ({
            ...log,
            date: log.logDate,
        }));
    },
});
