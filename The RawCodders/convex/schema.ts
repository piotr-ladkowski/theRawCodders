import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const ReturnReason = v.union(
  v.literal("Product not received"),
  v.literal("Discrepancy with the description"),
  v.literal("Faulty product"),
  v.literal("Other")
);

export const TransactionStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cancelled")
);

export default defineSchema({
  ...authTables,
  users: defineTable({
    ...authTables.users.validator.fields,
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("manager")
    )),
  })
    .index("email", ["email"]),

  products: defineTable({
    name: v.string(),
    price: v.number(),
    stock: v.number(),
    image: v.string(),
    // cost: v.float64()
  })
  .index("by_name", ["name"]),

  clients: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    birthDate: v.string(),
    sex: v.string(),
    address: v.object({
      line1: v.string(),
      line2: v.string(),
      postCode: v.string(),
      city: v.string(),
      country: v.string(),
    })
  }).index("by_email", ["email"])
    .index("by_name", ["name"]),

  transactions: defineTable({
    clientId: v.id("clients"),
    status: TransactionStatus,
    totalPrice: v.float64(),
    discount: v.float64(),
    orderId: v.array(v.id("orders")),
    date: v.string(),
  }).index("by_clientId", ["clientId"]),

  orders: defineTable({
    transactionId: v.id("transactions"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_transactionId", ["transactionId"])
    .index("by_productId", ["productId"]),

  returns: defineTable({
    orderId: v.id("orders"),
    reason: ReturnReason,
    description: v.string()
  }).index("by_orderId", ["orderId"]),
  
});
