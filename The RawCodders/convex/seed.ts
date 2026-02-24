import { mutation } from "./_generated/server";

// --- Data Generators ---

const FIRST_NAMES = [
  "John", "Jane", "Michael", "Emily", "David", "Sarah", "James", "Jessica", "Robert", "Ashley",
  "William", "Brian", "Mary", "Daniel", "Jennifer", "Christopher", "Amanda", "Joseph", "Melissa", "Richard"
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"
];
const BASE_STATIONS = ["Alpine Station Alpha", "Valley Base Camp", "Summit Station", "Ridge Post", "Glacier Station", "Canyon Outpost"];
const ROLES = ["Rescuer", "Medic", "Pilot", "Coordinator", "K9 Handler", "Technical Specialist"];
const CERTIFICATIONS_POOL = ["CPR", "Avalanche L1", "Avalanche L2", "Swift Water Rescue", "High Angle Rescue", "Wilderness First Responder", "EMT-B", "Helicopter Ops", "K9 SAR"];
const EQUIPMENT_CATEGORIES = ["Vehicle", "Medical", "Climbing Gear", "Communication", "Shelter", "Navigation"];
const EQUIPMENT_STATUSES = ["Available", "In Use", "Maintenance", "Retired"];
const EQUIPMENT_NAMES = [
  "Mountain Rescue Truck", "Snowcat", "Helicopter Bell 412", "AED Defibrillator", "Trauma Kit",
  "50m Dynamic Rope", "Ice Axe Set", "Climbing Harness", "Satellite Phone", "Two-Way Radio",
  "Portable Stretcher", "Thermal Blanket Pack", "GPS Unit", "Avalanche Beacon", "Snow Probe Kit",
  "Mountain Tent", "Oxygen Tank", "Night Vision Goggles", "Drone Scout", "First Aid Kit"
];
const INCIDENT_TYPES = ["Avalanche", "Missing Person", "Medical Emergency", "Fall / Injury", "Other"];
const INCIDENT_STATUSES = ["standby", "active", "resolved"];
const WEATHER_CONDITIONS = ["Clear", "Snowy", "Foggy", "Rainy", "Windy", "Blizzard", "Overcast"];
const ISSUE_TYPES = ["Wear and Tear", "Malfunction", "Calibration Needed", "Battery Replacement", "Structural Damage"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generatePersonnel() {
  const first = randomItem(FIRST_NAMES);
  const last = randomItem(LAST_NAMES);
  const numCerts = randomInt(1, 4);
  const certs: string[] = [];
  while (certs.length < numCerts) {
    const cert = randomItem(CERTIFICATIONS_POOL);
    if (!certs.includes(cert)) certs.push(cert);
  }
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 10000)}@rescue.org`,
    phone: `${randomInt(100, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    role: randomItem(ROLES),
    certifications: certs,
    baseStation: randomItem(BASE_STATIONS),
    isAvailable: Math.random() > 0.3,
  };
}

function generateEquipment(index: number) {
  const baseName = index < EQUIPMENT_NAMES.length ? EQUIPMENT_NAMES[index] : `${randomItem(EQUIPMENT_CATEGORIES)} Unit ${randomInt(100, 9000)}`;
  return {
    name: baseName,
    category: randomItem(EQUIPMENT_CATEGORIES),
    status: randomItem(EQUIPMENT_STATUSES) as any,
    image: "https://placehold.co/200x200",
    lastInspected: randomDate(new Date(2025, 0, 1), new Date()).split("T")[0],
  };
}

// --- Seeding Functions ---

async function seedEquipment(ctx: any, targetTotal: number) {
  const existing = await ctx.db.query("equipment").collect();
  const existingNames = new Set(existing.map((e: any) => (e?.name ?? "").toLowerCase()).filter(Boolean));

  const missingCount = Math.max(0, targetTotal - existing.length);
  if (missingCount === 0) return existing;

  const items: any[] = [];
  let idx = existing.length;
  const hardStop = targetTotal * 20;
  let attempts = 0;

  while (items.length < missingCount && attempts < hardStop) {
    attempts++;
    const e = generateEquipment(idx + items.length);
    const key = (e.name ?? "").toLowerCase();
    if (!key || existingNames.has(key)) continue;
    existingNames.add(key);
    items.push(e);
  }

  const batchSize = 50;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((e) => ctx.db.insert("equipment", e)));
  }

  return await ctx.db.query("equipment").collect();
}

async function seedPersonnel(ctx: any, targetTotal: number) {
  const existing = await ctx.db.query("personnel").collect();
  const existingByEmail = new Map<string, any>();
  for (const p of existing) {
    const email = (p?.email ?? "").toLowerCase();
    if (email) existingByEmail.set(email, p);
  }

  const hardStop = targetTotal * 50;
  let attempts = 0;
  while (existingByEmail.size < targetTotal && attempts < hardStop) {
    attempts++;
    const p = generatePersonnel();
    const email = p.email.toLowerCase();
    if (existingByEmail.has(email)) continue;
    const id = await ctx.db.insert("personnel", p);
    existingByEmail.set(email, { _id: id, ...p });
  }

  return Array.from(existingByEmail.values());
}

async function seedIncidentsAndDispatches(
  ctx: any,
  personnel: any[],
  equipment: any[],
  targetIncidents: number,
  targetMaintenanceLogs: number
) {
  const existingIncidents = await ctx.db.query("incidents").collect();
  const existingLogs = await ctx.db.query("maintenance_logs").collect();

  const missingIncidents = Math.max(0, targetIncidents - existingIncidents.length);
  if (missingIncidents === 0) {
    console.log(`Incidents already >= ${targetIncidents}. Skipping.`);
    return;
  }

  if (personnel.length === 0 || equipment.length === 0) {
    console.log("Missing personnel or equipment. Cannot seed incidents.");
    return;
  }

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  let maintenanceCreated = existingLogs.length;

  const batchSize = 50;
  for (let i = 0; i < missingIncidents; i += batchSize) {
    const batchPromises = [];
    for (let j = 0; j < batchSize && i + j < missingIncidents; j++) {
      batchPromises.push((async () => {
        const reportedDate = randomDate(sixMonthsAgo, now);

        const incidentId = await ctx.db.insert("incidents", {
          type: randomItem(INCIDENT_TYPES) as any,
          status: randomItem(INCIDENT_STATUSES) as any,
          severityLevel: randomInt(1, 5),
          gpsCoordinates: {
            latitude: randomFloat(46.0, 47.5),
            longitude: randomFloat(6.5, 10.5),
          },
          weatherConditions: randomItem(WEATHER_CONDITIONS),
          reportedDate,
        });

        // Create 1-3 dispatches per incident
        const numDispatches = randomInt(1, 3);
        for (let k = 0; k < numDispatches; k++) {
          await ctx.db.insert("dispatches", {
            incidentId,
            personnelId: randomItem(personnel)._id,
            equipmentId: randomItem(equipment)._id,
            dispatchTime: reportedDate,
          });
        }

        // Optionally create maintenance logs
        if (maintenanceCreated < targetMaintenanceLogs && Math.random() < 0.15) {
          const eq = randomItem(equipment);
          await ctx.db.insert("maintenance_logs", {
            equipmentId: eq._id,
            issueType: randomItem(ISSUE_TYPES),
            description: "Routine post-mission maintenance check",
            logDate: reportedDate.split("T")[0],
          });
          maintenanceCreated++;
        }
      })());
    }
    await Promise.all(batchPromises);
  }

  console.log(`Seeding complete. Incidents: ${targetIncidents}. Maintenance logs: ${maintenanceCreated}`);
}

async function seedMissionReports(ctx: any, targetTotal: number) {
  const existingReports = await ctx.db.query("mission_reports").collect();
  if (existingReports.length >= targetTotal) {
    console.log(`Mission reports already >= ${targetTotal}. Skipping.`);
    return;
  }

  const incidents = await ctx.db.query("incidents").collect();
  const personnel = await ctx.db.query("personnel").collect();

  if (incidents.length === 0 || personnel.length === 0) return;

  const resolvedIncidents = incidents.filter((i: any) => i.status === "resolved");
  if (resolvedIncidents.length === 0) return;

  const missing = Math.min(targetTotal - existingReports.length, resolvedIncidents.length);
  const selectedIncidents = resolvedIncidents.slice(0, missing);

  for (const incident of selectedIncidents) {
    const reporter = randomItem(personnel);
    await ctx.db.insert("mission_reports", {
      incidentId: incident._id,
      reporterId: reporter._id,
      difficultyRating: randomInt(1, 5),
      notes: randomItem([
        "Mission completed successfully. Team performed well under pressure.",
        "Challenging conditions but objective achieved. Recommend additional training for similar scenarios.",
        "Routine operation. All protocols followed correctly.",
        "Difficult terrain made access challenging. Consider alternative routes for future operations.",
        "Patient stabilized and evacuated. Quick response time was critical.",
      ]),
      reportDate: incident.reportedDate,
    });
  }

  console.log(`Seeded ${selectedIncidents.length} mission reports.`);
}

// --- Main Mutation ---

export const seed = mutation({
  handler: async (ctx) => {
    // 1. Seed Equipment
    const equipment = await seedEquipment(ctx, 100);

    // 2. Seed Personnel
    const personnel = await seedPersonnel(ctx, 200);

    // 3. Seed Incidents, Dispatches, and Maintenance Logs
    await seedIncidentsAndDispatches(ctx, personnel, equipment, 500, 30);

    // 4. Seed Mission Reports
    await seedMissionReports(ctx, 50);

    return "Database seeded successfully (Mountain Rescue: 100 equipment, 200 personnel, 500 incidents, ~30 maintenance logs, ~50 mission reports).";
  },
});
