import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const IncidentStatus = v.union(
  v.literal("standby"),
  v.literal("active"),
  v.literal("resolved")
);

export const IncidentType = v.union(
  v.literal("Avalanche"),
  v.literal("Missing Person"),
  v.literal("Medical Emergency"),
  v.literal("Fall / Injury"),
  v.literal("Other")
);

export const listIncidents = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let incidents = await ctx.db.query("incidents").order("desc").collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;

        return {
            data: limit === -1 ? incidents : incidents.slice(offset, offset + limit),
            count: incidents.length
        };
    },
});

export const getIncident = query({
    args: { incidentId: v.id("incidents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.incidentId);
    },
});

export const insertIncident = mutation({
    args: {
        type: IncidentType,
        status: IncidentStatus,
        severityLevel: v.number(),
        gpsCoordinates: v.object({ latitude: v.float64(), longitude: v.float64() }),
        weatherConditions: v.optional(v.string()),
        reportedDate: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("incidents", args);
    },
});

export const updateIncidentStatus = mutation({
    args: {
        incidentId: v.id("incidents"),
        status: IncidentStatus,
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.incidentId, { status: args.status });
        return args.incidentId;
    },
});

export const deleteIncident = mutation({
    args: { incidentId: v.id("incidents") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.incidentId);
    },
});