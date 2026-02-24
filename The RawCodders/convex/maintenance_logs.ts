import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listMaintenanceLogs = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const logs = await ctx.db.query("maintenance_logs").order("desc").collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;

        const enrichedLogs = await Promise.all(
            logs.slice(offset, offset + limit).map(async (log) => {
                const eq = await ctx.db.get(log.equipmentId);
                return { ...log, equipmentName: eq ? eq.name : "Unknown Equipment" };
            })
        );
        
        return { data: enrichedLogs, total: logs.length };
    },
});

export const insertMaintenanceLog = mutation({
    args: {
        equipmentId: v.id("equipment"),
        issueType: v.string(),
        description: v.string(),
        logDate: v.string()
    },
    handler: async (ctx, args) => {
        // Automatically put equipment into Maintenance mode
        await ctx.db.patch(args.equipmentId, { status: "Maintenance" });
        return await ctx.db.insert("maintenance_logs", args);
    },
});

// add delete maintenance log mutation
export const deleteMaintenanceLog = mutation({
    args: { logId: v.id("maintenance_logs") },
    handler: async (ctx, args) => {
        const log = await ctx.db.get(args.logId);
        if (!log) throw new Error("Maintenance Log Not Found");

        // Optionally, you could also update the equipment status back to Available here
        // await ctx.db.patch(log.equipmentId, { status: "Available" });

        await ctx.db.delete(args.logId);
    },
});