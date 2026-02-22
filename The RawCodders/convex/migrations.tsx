import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const fixOrderedTransactionStatuses = mutation({
  args: {
    to: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { to = "pending", limit = 1000 }) => {
    const txs = await ctx.db.query("transactions").collect();

    let changed = 0;
    for (const tx of txs) {
      if (tx.status === "ordered") {
        await ctx.db.patch(tx._id, { status: to });
        changed++;
        if (changed >= limit) break;
      }
    }
    return { changed, mappedTo: to };
  },
});