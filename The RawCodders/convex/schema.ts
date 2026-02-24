import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Replaces ReturnReason
export const EquipmentStatus = v.union(
  v.literal("Available"),
  v.literal("In Use"),
  v.literal("Maintenance"),
  v.literal("Retired")
);

// Replaces TransactionStatus
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

export default defineSchema({
  ...authTables,

  // Replaces "products"
  equipment: defineTable({
    name: v.string(),
    category: v.string(), // e.g., Vehicle, Medical, Climbing Gear
    status: EquipmentStatus,
    image: v.optional(v.string()),
    lastInspected: v.string(), // ISO date
  })
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // Replaces "clients"
  personnel: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.string(), // e.g., Rescuer, Medic, Pilot, Coordinator
    certifications: v.array(v.string()), // e.g., ["CPR", "Avalanche L2"]
    baseStation: v.string(),
    isAvailable: v.boolean(),
    aiProfileSummary: v.optional(v.string()), // Quick AI generated bio of their expertise
  })
    .index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_availability", ["isAvailable"]),

  // Replaces "transactions"
  incidents: defineTable({
    type: IncidentType,
    status: IncidentStatus,
    severityLevel: v.number(), // 1 to 5
    gpsCoordinates: v.object({
      latitude: v.float64(),
      longitude: v.float64(),
    }),
    weatherConditions: v.optional(v.string()),
    reportedDate: v.string(),
  }).index("by_status", ["status"]),

  // Replaces "orders" (linking incidents to resources)
  dispatches: defineTable({
    incidentId: v.id("incidents"),
    personnelId: v.optional(v.id("personnel")),
    equipmentId: v.optional(v.id("equipment")),
    dispatchTime: v.string(),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_personnelId", ["personnelId"])
    .index("by_equipmentId", ["equipmentId"]),

  // Replaces "returns"
  maintenance_logs: defineTable({
    equipmentId: v.id("equipment"),
    issueType: v.string(),
    description: v.string(),
    logDate: v.string(),
  }).index("by_equipmentId", ["equipmentId"]),

  // Replaces "opinions"
  mission_reports: defineTable({
    incidentId: v.id("incidents"),
    reporterId: v.id("personnel"),
    difficultyRating: v.optional(v.number()), // 1-5 scale of mission difficulty
    notes: v.string(),
    reportDate: v.string(),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_reporterId", ["reporterId"]),

  // Kept for AI but adapted field names
  insights: defineTable({
    executive_summary: v.string(),
    key_findings: v.any(),
    recommendations: v.array(v.string()),
    operational_actions: v.optional(v.array(v.string())), // Replaced marketing_actions
    raw_metrics: v.any(),
  }),
});