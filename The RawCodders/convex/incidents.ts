import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { IncidentStatus, IncidentType } from "./schema";

export const listIncidents = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const incidents = await ctx.db.query("incidents").collect();
        const total = incidents.length;

        const offset = args.offset ?? 0;
        const sliced = args.limit !== undefined
            ? incidents.slice(offset, offset + args.limit)
            : incidents.slice(offset);

        return {
            incidents: sliced,
            count: total,
        };
    },
});

export const getIncident = query({
    args: {
        incidentId: v.id("incidents"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.incidentId);
    },
});

export const insertIncident = mutation({
    args: {
        type: IncidentType,
        status: IncidentStatus,
        severityLevel: v.number(),
        gpsCoordinates: v.object({
            latitude: v.float64(),
            longitude: v.float64(),
        }),
        weatherConditions: v.optional(v.string()),
        reportedDate: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("incidents", {
            type: args.type,
            status: args.status,
            severityLevel: args.severityLevel,
            gpsCoordinates: args.gpsCoordinates,
            weatherConditions: args.weatherConditions,
            reportedDate: args.reportedDate,
        });
    },
});

export const updateIncident = mutation({
    args: {
        incidentId: v.id("incidents"),
        type: v.optional(IncidentType),
        status: v.optional(IncidentStatus),
        severityLevel: v.optional(v.number()),
        gpsCoordinates: v.optional(v.object({
            latitude: v.float64(),
            longitude: v.float64(),
        })),
        weatherConditions: v.optional(v.string()),
        reportedDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { incidentId, ...fields } = args;
        await ctx.db.patch(incidentId, fields);
        return incidentId;
    },
});

export const deleteIncident = mutation({
    args: {
        incidentId: v.id("incidents"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.incidentId);
    },
});
