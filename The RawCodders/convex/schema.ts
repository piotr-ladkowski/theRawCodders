import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  products: defineTable({
    name: v.string(),
    price: v.number(),
    stock: v.number(),
    image: v.string()
  })
  .index("by_name", ["name"]),

  clients: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.number()
  }).index("by_email", ["email"]),

  transactions: defineTable({
    clientId: v.id("clients"),
    status: v.string(),
    totalPrice: v.float64(),
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
    reason: v.string(),
  }).index("by_orderId", ["orderId"]),
});
