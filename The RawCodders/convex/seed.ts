import { mutation } from "./_generated/server";

// -----------------------------
// Seed Data
// -----------------------------

const NAMES = [
  "Jan Kowalski",
  "Piotr Nowak",
  "Anna Wiśniewska",
  "Maciej Wójcik",
  "Tomasz Kamiński",
  "Katarzyna Lewandowska",
  "Michał Zieliński",
] as const;

const ROLES = ["Rescuer", "Medic", "Pilot", "Coordinator"] as const;

const CERTIFICATIONS = [
  "Avalanche L1",
  "Avalanche L2",
  "Rope Rescue Pro",
  "Paramedic",
  "Heli-Pilot",
  "K9 Handler",
] as const;

const BASES = [
  "Zakopane HQ",
  "Morskie Oko Station",
  "Dolina Pięciu Stawów",
  "Kasprowy Wierch",
] as const;

const EQ_CATEGORIES = [
  "Vehicle",
  "Medical",
  "Rope/Climbing",
  "Communication",
  "Search K9",
] as const;

const EQ_NAMES = [
  "Defibrillator AED",
  "Skidoo Snowmobile",
  "Rescue Helicopter Sokół",
  "Avalanche Probe",
  "Thermal Drone",
  "Stretcher",
  "VHF Radio",
] as const;

const INCIDENT_TYPES = [
  "Avalanche",
  "Missing Person",
  "Medical Emergency",
  "Fall / Injury",
  "Other",
] as const;

const WEATHER = [
  "Clear, -5C",
  "Heavy Snow, Low Visibility",
  "High Winds, -15C",
  "Sunny, 2C",
  "Foggy, 0C",
] as const;

const ISSUE_TYPES = [
  "Battery Failure",
  "Engine Malfunction",
  "Structural Damage",
  "Calibration Drift",
  "Wear and Tear",
  "Software Error",
  "Hydraulic Leak",
] as const;

const MAINTENANCE_DESCRIPTIONS = [
  "Battery pack depleted below safe threshold after extended cold-weather operation.",
  "Engine stalling intermittently during high-altitude runs; needs carburetor inspection.",
  "Frame cracked after impact during last rescue mission; requires welding.",
  "GPS module showing 15m drift; recalibration and firmware update needed.",
  "Rope abrasion detected near carabiner attachment point; replacement scheduled.",
  "On-board diagnostics software crash on startup; reinstallation required.",
  "Hydraulic fluid leak found at main lift cylinder seal.",
  "Radio antenna connector corroded; signal intermittent in bad weather.",
  "Stretcher locking mechanism jammed; pivot bolt replacement needed.",
  "Drone propeller blade chipped after landing in rocky terrain.",
  "Defibrillator self-test failed; electrode pads expired and need replacement.",
  "Snowmobile track tension out of spec; adjustment and track inspection required.",
] as const;

// Optional mission reports seed text
const MISSION_REPORT_NOTES = [
  "Successful response. Team reached casualty quickly despite difficult terrain.",
  "Search area expanded due to low visibility. Coordination with base remained stable.",
  "Evacuation completed safely. Weather conditions slowed descent.",
  "Medical stabilization performed on site before transport.",
  "False alarm after field verification; no injuries found.",
  "K9 support helped narrow the search zone significantly.",
  "High wind conditions required route adjustment during approach.",
  "Minor communication issues at first, resolved after radio channel switch.",
] as const;

// -----------------------------
// Helpers
// -----------------------------

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString();
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function randomRecentDate(monthsBack: number): string {
  return randomDate(monthsAgo(monthsBack), new Date());
}

function uniqueRandomItems<T>(arr: readonly T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < count) {
    const idx = randomInt(0, copy.length - 1);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function addHours(dateIso: string, minHours: number, maxHours: number): string {
  const d = new Date(dateIso);
  d.setHours(d.getHours() + randomInt(minHours, maxHours));
  return d.toISOString();
}

// -----------------------------
// Ensure / Upsert Personnel (ALWAYS there)
// -----------------------------

async function ensurePersonnel(ctx: any, targetTotal: number) {
  let createdPersonnel = 0;
  let updatedPersonnel = 0;
  const seededPersonnelIds: any[] = [];

  for (let i = 0; i < targetTotal; i++) {
    const name = `${randomItem(NAMES)} ${i + 1}`;
    const email = `rescuer${i}@gopr.pl`;
    const certs = uniqueRandomItems(CERTIFICATIONS, randomInt(1, 3));

    const existingMatches = await ctx.db
      .query("personnel")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .collect();

    const existing = existingMatches[0] ?? null;

    const doc = {
      name,
      email,
      phone: `+48 ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
      role: randomItem(ROLES),
      certifications: certs,
      baseStation: randomItem(BASES),
      isAvailable: Math.random() > 0.25,
      // aiProfileSummary optional
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      seededPersonnelIds.push(existing._id);
      updatedPersonnel++;
    } else {
      const id = await ctx.db.insert("personnel", doc);
      seededPersonnelIds.push(id);
      createdPersonnel++;
    }
  }

  // Include any manually-created personnel too, so dispatches can use the full pool
  const allPersonnel = await ctx.db.query("personnel").collect();

  return {
    personnelIds: allPersonnel.length > 0 ? allPersonnel.map((p: any) => p._id) : seededPersonnelIds,
    createdPersonnel,
    updatedPersonnel,
    totalPersonnel: allPersonnel.length,
  };
}

// -----------------------------
// Upsert Equipment (deterministic names)
// -----------------------------

async function ensureEquipment(ctx: any, targetTotal: number) {
  let createdEquipment = 0;
  let updatedEquipment = 0;

  const existingEquipment = await ctx.db.query("equipment").collect();
  const equipmentByName = new Map(existingEquipment.map((e: any) => [e.name, e]));
  const eqIds: any[] = [];

  for (let i = 0; i < targetTotal; i++) {
    const baseName = EQ_NAMES[i % EQ_NAMES.length];
    const category = EQ_CATEGORIES[i % EQ_CATEGORIES.length];
    const equipmentName = `${baseName} (EQ-${String(i + 1).padStart(3, "0")})`;

    const doc = {
      name: equipmentName,
      category,
      status: (["Available", "In Use", "Maintenance"][i % 3] as
        | "Available"
        | "In Use"
        | "Maintenance"
        | "Retired"),
      image: undefined,
      lastInspected: new Date(
        Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    const existing = equipmentByName.get(equipmentName);
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      eqIds.push(existing._id);
      updatedEquipment++;
    } else {
      const id = await ctx.db.insert("equipment", doc);
      eqIds.push(id);
      createdEquipment++;
    }
  }

  const allEquipment = await ctx.db.query("equipment").collect();

  return {
    equipmentIds: allEquipment.length > 0 ? allEquipment.map((e: any) => e._id) : eqIds,
    createdEquipment,
    updatedEquipment,
    totalEquipment: allEquipment.length,
  };
}

// -----------------------------
// Seed Incidents + Dispatches (recent months, skip if incidents exist)
// -----------------------------

async function seedIncidentsAndDispatchesIfEmpty(
  ctx: any,
  personnelIds: any[],
  equipmentIds: any[],
  targetIncidents = 50
) {
  let createdIncidents = 0;
  let createdDispatches = 0;

  const existingIncidents = await ctx.db.query("incidents").collect();
  if (existingIncidents.length > 0) {
    return {
      createdIncidents,
      createdDispatches,
      skipped: true,
      existingIncidentsCount: existingIncidents.length,
      incidentIds: existingIncidents.map((i: any) => i._id),
    };
  }

  if (personnelIds.length === 0) {
    throw new Error("Cannot seed incidents: no personnel found.");
  }
  if (equipmentIds.length === 0) {
    throw new Error("Cannot seed incidents: no equipment found.");
  }

  const now = new Date();
  const fourMonthsAgo = monthsAgo(4);
  const incidentIds: any[] = [];

  for (let i = 0; i < targetIncidents; i++) {
    const reportedDate = randomDate(fourMonthsAgo, now);

    const incidentId = await ctx.db.insert("incidents", {
      type: randomItem(INCIDENT_TYPES),
      status: i < 5 ? "active" : i < 8 ? "standby" : "resolved",
      severityLevel: randomInt(1, 5),
      gpsCoordinates: {
        // Tatra-ish area
        latitude: 49.2 + Math.random() * 0.1,
        longitude: 19.9 + Math.random() * 0.1,
      },
      weatherConditions: randomItem(WEATHER),
      reportedDate,
    });

    incidentIds.push(incidentId);
    createdIncidents++;

    // Unique personnel/equipment per incident
    const rescuersForIncident = uniqueRandomItems(
      personnelIds,
      randomInt(2, Math.min(4, personnelIds.length))
    );
    const equipmentForIncident = uniqueRandomItems(
      equipmentIds,
      randomInt(1, Math.min(2, equipmentIds.length))
    );

    for (const personnelId of rescuersForIncident) {
      await ctx.db.insert("dispatches", {
        incidentId,
        personnelId,
        equipmentId: undefined,
        dispatchTime: reportedDate,
      });
      createdDispatches++;
    }

    for (const equipmentId of equipmentForIncident) {
      await ctx.db.insert("dispatches", {
        incidentId,
        personnelId: undefined,
        equipmentId,
        dispatchTime: reportedDate,
      });
      createdDispatches++;
    }
  }

  return {
    createdIncidents,
    createdDispatches,
    skipped: false,
    existingIncidentsCount: 0,
    incidentIds,
  };
}

// -----------------------------
// Seed Maintenance Logs (recent months, skip if logs exist)
// -----------------------------

async function seedMaintenanceLogsIfEmpty(
  ctx: any,
  equipmentIds: any[],
  targetLogs = 20
) {
  let createdMaintenanceLogs = 0;

  const existingLogs = await ctx.db.query("maintenance_logs").collect();
  if (existingLogs.length > 0) {
    return {
      createdMaintenanceLogs,
      skipped: true,
      existingLogsCount: existingLogs.length,
    };
  }

  if (equipmentIds.length === 0) {
    throw new Error("Cannot seed maintenance logs: no equipment found.");
  }

  const now = new Date();
  const twoMonthsAgo = monthsAgo(2);

  for (let i = 0; i < targetLogs; i++) {
    const equipmentId = equipmentIds[i % equipmentIds.length];
    await ctx.db.insert("maintenance_logs", {
      equipmentId,
      issueType: ISSUE_TYPES[i % ISSUE_TYPES.length],
      description: MAINTENANCE_DESCRIPTIONS[i % MAINTENANCE_DESCRIPTIONS.length],
      logDate: randomDate(twoMonthsAgo, now),
    });
    createdMaintenanceLogs++;
  }

  return {
    createdMaintenanceLogs,
    skipped: false,
    existingLogsCount: 0,
  };
}

// -----------------------------
// Seed Mission Reports (optional, recent, skip if already exist)
// -----------------------------

async function seedMissionReportsIfEmpty(
  ctx: any,
  incidentIds: any[],
  personnelIds: any[],
  targetReports = 25
) {
  let createdMissionReports = 0;

  const existingReports = await ctx.db.query("mission_reports").collect();
  if (existingReports.length > 0) {
    return {
      createdMissionReports,
      skipped: true,
      existingReportsCount: existingReports.length,
    };
  }

  if (incidentIds.length === 0 || personnelIds.length === 0) {
    return {
      createdMissionReports,
      skipped: true,
      existingReportsCount: existingReports.length,
    };
  }

  // Load incidents so report dates can be after incident date
  const incidents = await ctx.db.query("incidents").collect();
  const incidentById = new Map(incidents.map((i: any) => [String(i._id), i]));

  const usedPairs = new Set<string>();
  let safety = 0;

  while (createdMissionReports < targetReports && safety < targetReports * 20) {
    safety++;
    const incidentId = randomItem(incidentIds);
    const reporterId = randomItem(personnelIds);

    const pairKey = `${String(incidentId)}::${String(reporterId)}`;
    if (usedPairs.has(pairKey)) continue;

    const incident = incidentById.get(String(incidentId));
    if (!incident) continue;

    usedPairs.add(pairKey);

    await ctx.db.insert("mission_reports", {
      incidentId,
      reporterId,
      difficultyRating: Math.random() < 0.8 ? randomInt(2, 5) : undefined,
      notes: randomItem(MISSION_REPORT_NOTES),
      reportDate: addHours(incident.reportedDate, 1, 72), // 1h to 3 days later
    });

    createdMissionReports++;
  }

  return {
    createdMissionReports,
    skipped: false,
    existingReportsCount: 0,
  };
}

// -----------------------------
// Main Seed Mutation
// -----------------------------

export const seed = mutation({
  handler: async (ctx) => {
    // 1) ALWAYS ensure personnel exists
    const {
      personnelIds,
      createdPersonnel,
      updatedPersonnel,
      totalPersonnel,
    } = await ensurePersonnel(ctx, 20);

    // 2) ALWAYS ensure equipment exists
    const {
      equipmentIds,
      createdEquipment,
      updatedEquipment,
      totalEquipment,
    } = await ensureEquipment(ctx, 30);

    // 3) Incidents + dispatches (recent months)
    const incidentsResult = await seedIncidentsAndDispatchesIfEmpty(
      ctx,
      personnelIds,
      equipmentIds,
      50
    );

    // 4) Maintenance logs (recent months)
    const maintenanceResult = await seedMaintenanceLogsIfEmpty(
      ctx,
      equipmentIds,
      20
    );

    // 5) Mission reports (optional but nice for demo data)
    const missionReportsResult = await seedMissionReportsIfEmpty(
      ctx,
      incidentsResult.incidentIds,
      personnelIds,
      25
    );

    return [
      "✅ Seed completed",
      `Personnel: +${createdPersonnel} created, ${updatedPersonnel} updated (total: ${totalPersonnel})`,
      `Equipment: +${createdEquipment} created, ${updatedEquipment} updated (total: ${totalEquipment})`,
      incidentsResult.skipped
        ? `Incidents: skipped (already had ${incidentsResult.existingIncidentsCount})`
        : `Incidents: +${incidentsResult.createdIncidents} created (last ~4 months)`,
      incidentsResult.skipped
        ? "Dispatches: skipped (incident seed skipped)"
        : `Dispatches: +${incidentsResult.createdDispatches} created`,
      maintenanceResult.skipped
        ? `Maintenance Logs: skipped (already had ${maintenanceResult.existingLogsCount})`
        : `Maintenance Logs: +${maintenanceResult.createdMaintenanceLogs} created (last ~2 months)`,
      missionReportsResult.skipped
        ? `Mission Reports: skipped (already had ${missionReportsResult.existingReportsCount})`
        : `Mission Reports: +${missionReportsResult.createdMissionReports} created`,
    ].join(" | ");
  },
});