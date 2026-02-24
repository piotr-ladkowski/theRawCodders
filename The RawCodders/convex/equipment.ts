import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const EquipmentStatus = v.union(
  v.literal("Available"),
  v.literal("In Use"),
  v.literal("Maintenance"),
  v.literal("Retired")
);

export const insertEquipment = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        status: EquipmentStatus,
        image: v.optional(v.string()),
        lastInspected: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('equipment', args);
    },
});

export const updateEquipment = mutation({
    args: {
        equipmentId: v.id('equipment'),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        status: v.optional(EquipmentStatus),
        image: v.optional(v.string()),
        lastInspected: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { equipmentId, ...fields } = args;
        const equipment = await ctx.db.get(equipmentId);
        if (!equipment) throw new Error("Equipment Not Found");

        await ctx.db.patch(equipmentId, fields);
        return equipmentId;
    },
});

export const listEquipment = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const equipmentList = await ctx.db.query('equipment').collect();
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        
        return { 
            data: limit === -1 ? equipmentList : equipmentList.slice(offset, offset + limit),
            total: equipmentList.length
        }
    },
});

export const getEquipment = query({
    args: { equipmentId: v.id('equipment') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.equipmentId);
    },
});

export const deleteEquipment = mutation({
    args: { equipmentId: v.id("equipment") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.equipmentId);
    },
});