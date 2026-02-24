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

    // -----------------------------
    // 1) Seed / Upsert Personnel (idempotent by email)
    // -----------------------------
    const personnelIds: any[] = [];

    for (let i = 0; i < 20; i++) {
      const name = `${randomItem(NAMES)} ${i}`;
      const email = `rescuer${i}@gopr.pl`;

      // Ensure certifications are unique-ish per person
      const certs = uniqueRandomItems(CERTIFICATIONS, randomInt(1, 3));

      const existing = await ctx.db
        .query("personnel")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

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
    ].join(" | ");
  },
});