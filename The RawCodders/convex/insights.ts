import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("insights").order("desc").first();
  },
});

export const save = mutation({
  args: {
    executive_summary: v.string(),
    key_findings: v.any(),
    recommendations: v.array(v.string()),
    raw_metrics: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("insights", args);
  },
});