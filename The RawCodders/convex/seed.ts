import { mutation } from "./_generated/server";

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

// eqIndex is a direct index into the eqIds array (0-29).
// Equipment type is EQ_NAMES[eqIndex % 7]:
//   0=Defibrillator AED, 1=Skidoo Snowmobile, 2=Rescue Helicopter Sokół,
//   3=Avalanche Probe, 4=Thermal Drone, 5=Stretcher, 6=VHF Radio
const MAINTENANCE_LOG_ENTRIES = [
  { eqIndex: 0, issueType: "Battery Failure", description: "Battery pack depleted below safe threshold after extended cold-weather operation." },
  { eqIndex: 1, issueType: "Engine Malfunction", description: "Engine stalling intermittently during high-altitude runs; needs carburetor inspection." },
  { eqIndex: 2, issueType: "Structural Damage", description: "Tail rotor vibration detected during post-flight inspection; requires immediate servicing." },
  { eqIndex: 3, issueType: "Calibration Drift", description: "Probe depth markings misaligned after repeated use in icy conditions; recalibration required." },
  { eqIndex: 4, issueType: "Wear and Tear", description: "Drone propeller blade chipped after landing in rocky terrain." },
  { eqIndex: 5, issueType: "Structural Damage", description: "Stretcher locking mechanism jammed; pivot bolt replacement needed." },
  { eqIndex: 6, issueType: "Wear and Tear", description: "Radio antenna connector corroded; signal intermittent in bad weather." },
  { eqIndex: 7, issueType: "Software Error", description: "Defibrillator self-test failed; electrode pads expired and need replacement." },
  { eqIndex: 8, issueType: "Wear and Tear", description: "Snowmobile track tension out of spec; adjustment and track inspection required." },
  { eqIndex: 9, issueType: "Hydraulic Leak", description: "Hydraulic fluid leak found at main lift cylinder seal on helicopter." },
  { eqIndex: 10, issueType: "Structural Damage", description: "Avalanche probe tip bent after striking submerged rock; replacement needed." },
  { eqIndex: 11, issueType: "Software Error", description: "Drone GPS firmware crash during flight; emergency landing triggered." },
  { eqIndex: 12, issueType: "Wear and Tear", description: "Stretcher fabric worn thin at load-bearing points; re-stitching required." },
  { eqIndex: 13, issueType: "Battery Failure", description: "VHF radio battery failing to hold charge; replacement cell ordered." },
  { eqIndex: 14, issueType: "Battery Failure", description: "Defibrillator battery capacity degraded below 60%; replacement scheduled." },
  { eqIndex: 15, issueType: "Engine Malfunction", description: "Snowmobile starter motor engaging inconsistently in sub-zero temperatures." },
  { eqIndex: 16, issueType: "Structural Damage", description: "Helicopter windshield micro-cracks found during routine inspection." },
  { eqIndex: 17, issueType: "Calibration Drift", description: "Avalanche probe length markings faded; needs re-marking and validation." },
  { eqIndex: 18, issueType: "Software Error", description: "Thermal drone camera feed dropping intermittently; firmware update required." },
  { eqIndex: 19, issueType: "Structural Damage", description: "Stretcher wheel axle bent after rough terrain transport; needs replacement." },
] as const;

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

export const seed = mutation({
  handler: async (ctx) => {
    let createdPersonnel = 0;
    let updatedPersonnel = 0;
    let createdEquipment = 0;
    let updatedEquipment = 0;
    let createdIncidents = 0;
    let createdDispatches = 0;
    let createdMaintenanceLogs = 0;

    // -----------------------------
    // 1) Seed / Upsert Personnel (idempotent by email)
    // -----------------------------
    const personnelIds: any[] = [];

    for (let i = 0; i < 20; i++) {
      const name = `${randomItem(NAMES)} ${i}`;
      const email = `rescuer${i}@gopr.pl`;

      // Ensure certifications are unique-ish per person
      const certs = uniqueRandomItems(CERTIFICATIONS, randomInt(1, 3));

      const existingMatches = await ctx.db
      .query("personnel")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

      const existing = existingMatches[0] ?? null;

      const doc = {
        name,
        email,
        phone: `+48 ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(
          100,
          999
        )}`,
        role: randomItem(ROLES),
        certifications: certs,
        baseStation: randomItem(BASES),
        isAvailable: Math.random() > 0.25,
        // aiProfileSummary intentionally omitted (optional)
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
        personnelIds.push(existing._id);
        updatedPersonnel++;
      } else {
        const id = await ctx.db.insert("personnel", doc);
        personnelIds.push(id);
        createdPersonnel++;
      }
    }

    // -----------------------------
    // 2) Seed / Upsert Equipment (idempotent by deterministic name)
    // NOTE: no by_name index in schema, so small-table scan is acceptable
    // -----------------------------
    const existingEquipment = await ctx.db.query("equipment").collect();
    const equipmentByName = new Map(existingEquipment.map((e) => [e.name, e]));

    const eqIds: any[] = [];

    for (let i = 0; i < 30; i++) {
      // Deterministic names = same seed can safely patch instead of duplicate
      const baseName = EQ_NAMES[i % EQ_NAMES.length];
      const category = EQ_CATEGORIES[i % EQ_CATEGORIES.length];
      const equipmentName = `${baseName} (EQ-${String(i + 1).padStart(3, "0")})`;

      const doc = {
        name: equipmentName,
        category,
        status:
          (["Available", "In Use", "Maintenance"][i % 3] as
            | "Available"
            | "In Use"
            | "Maintenance"
            | "Retired"),
        lastInspected: new Date(
          Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        // image optional omitted
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

    // -----------------------------
    // 3) Seed Incidents & Dispatches
    // Idempotency strategy: if incidents already exist, skip creating more
    // (No unique key/index in schema to safely upsert incidents)
    // -----------------------------
    const existingIncidents = await ctx.db.query("incidents").collect();
    if (existingIncidents.length === 0) {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      for (let i = 0; i < 50; i++) {
        const reportedDate = randomDate(sixMonthsAgo, now);

        const incidentId = await ctx.db.insert("incidents", {
          type: randomItem(INCIDENT_TYPES),
          status:
            i < 5 ? "active" : i < 8 ? "standby" : "resolved",
          severityLevel: randomInt(1, 5),
          gpsCoordinates: {
            // Tatra-ish area
            latitude: 49.2 + Math.random() * 0.1,
            longitude: 19.9 + Math.random() * 0.1,
          },
          weatherConditions: randomItem(WEATHER),
          reportedDate,
        });

        createdIncidents++;

        // Pick unique personnel/equipment per incident to avoid duplicates within one incident
        const rescuersForIncident = uniqueRandomItems(
          personnelIds,
          randomInt(2, 4)
        );
        const equipmentForIncident = uniqueRandomItems(eqIds, randomInt(1, 2));

        for (const personnelId of rescuersForIncident) {
          await ctx.db.insert("dispatches", {
            incidentId,
            personnelId,
            dispatchTime: reportedDate,
          });
          createdDispatches++;
        }

        for (const equipmentId of equipmentForIncident) {
          await ctx.db.insert("dispatches", {
            incidentId,
            equipmentId,
            dispatchTime: reportedDate,
          });
          createdDispatches++;
        }
      }
    }

    // -----------------------------
    // 4) Seed Maintenance Logs
    // Idempotency: skip if logs already exist
    // -----------------------------
    const existingLogs = await ctx.db.query("maintenance_logs").collect();
    if (existingLogs.length === 0) {
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);

      for (let i = 0; i < MAINTENANCE_LOG_ENTRIES.length; i++) {
        const entry = MAINTENANCE_LOG_ENTRIES[i];
        const equipmentId = eqIds[entry.eqIndex];
        await ctx.db.insert("maintenance_logs", {
          equipmentId,
          issueType: entry.issueType,
          description: entry.description,
          logDate: randomDate(threeMonthsAgo, now),
        });
        createdMaintenanceLogs++;
      }
    }

    return [
      "✅ Seed completed",
      `Personnel: +${createdPersonnel} created, ${updatedPersonnel} updated`,
      `Equipment: +${createdEquipment} created, ${updatedEquipment} updated`,
      existingIncidents.length === 0
        ? `Incidents: +${createdIncidents} created`
        : `Incidents: skipped (already had ${existingIncidents.length})`,
      existingIncidents.length === 0
        ? `Dispatches: +${createdDispatches} created`
        : "Dispatches: skipped (incident seed skipped)",
      existingLogs.length === 0
        ? `Maintenance Logs: +${createdMaintenanceLogs} created`
        : `Maintenance Logs: skipped (already had ${existingLogs.length})`,
    ].join(" | ");
  },
});