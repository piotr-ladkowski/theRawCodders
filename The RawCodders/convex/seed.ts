import { mutation } from "./_generated/server";

const NAMES = ["Jan Kowalski", "Piotr Nowak", "Anna Wiśniewska", "Maciej Wójcik", "Tomasz Kamiński", "Katarzyna Lewandowska", "Michał Zieliński"];
const ROLES = ["Rescuer", "Medic", "Pilot", "Coordinator"];
const CERTIFICATIONS = ["Avalanche L1", "Avalanche L2", "Rope Rescue Pro", "Paramedic", "Heli-Pilot", "K9 Handler"];
const BASES = ["Zakopane HQ", "Morskie Oko Station", "Dolina Pięciu Stawów", "Kasprowy Wierch"];

const EQ_CATEGORIES = ["Vehicle", "Medical", "Rope/Climbing", "Communication", "Search K9"];
const EQ_NAMES = ["Defibrillator AED", "Skidoo Snowmobile", "Rescue Helicopter Sokół", "Avalanche Probe", "Thermal Drone", "Stretcher", "VHF Radio"];

const INCIDENT_TYPES = ["Avalanche", "Missing Person", "Medical Emergency", "Fall / Injury", "Other"];
const WEATHER = ["Clear, -5C", "Heavy Snow, Low Visibility", "High Winds, -15C", "Sunny, 2C", "Foggy, 0C"];

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(start: Date, end: Date): string {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

export const seed = mutation({
  handler: async (ctx) => {
    // 1. Seed Personnel
    const personnelIds = [];
    for (let i = 0; i < 20; i++) {
      const id = await ctx.db.insert("personnel", {
        name: randomItem(NAMES) + " " + i,
        email: `rescuer${i}@gopr.pl`,
        phone: `+48 ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
        role: randomItem(ROLES),
        certifications: [randomItem(CERTIFICATIONS), randomItem(CERTIFICATIONS)],
        baseStation: randomItem(BASES),
        isAvailable: true,
      });
      personnelIds.push(id);
    }

    // 2. Seed Equipment
    const eqIds = [];
    for (let i = 0; i < 30; i++) {
      const id = await ctx.db.insert("equipment", {
        name: randomItem(EQ_NAMES) + ` (ID-${randomInt(1000,9999)})`,
        category: randomItem(EQ_CATEGORIES),
        status: "Available",
        lastInspected: new Date().toISOString()
      });
      eqIds.push(id);
    }

    // 3. Seed Incidents & Dispatches
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    for (let i = 0; i < 50; i++) {
      // Create Incident
      const incidentId = await ctx.db.insert("incidents", {
        type: randomItem(INCIDENT_TYPES) as any,
        status: "resolved",
        severityLevel: randomInt(1, 5),
        // Random coords in the Tatra mountains approx (Lat: 49.2, Lon: 19.9)
        gpsCoordinates: {
          latitude: 49.2 + (Math.random() * 0.1),
          longitude: 19.9 + (Math.random() * 0.1),
        },
        weatherConditions: randomItem(WEATHER),
        reportedDate: randomDate(sixMonthsAgo, now),
      });

      // Dispatch 2-4 Rescuers
      const numRescuers = randomInt(2, 4);
      for (let j = 0; j < numRescuers; j++) {
        await ctx.db.insert("dispatches", {
          incidentId,
          personnelId: randomItem(personnelIds),
          dispatchTime: new Date().toISOString(),
        });
      }

      // Dispatch 1-2 pieces of Equipment
      for (let j = 0; j < randomInt(1, 2); j++) {
        await ctx.db.insert("dispatches", {
          incidentId,
          equipmentId: randomItem(eqIds),
          dispatchTime: new Date().toISOString(),
        });
      }
    }

    return "Seeded 20 Personnel, 30 Equipment items, and 50 Rescue Incidents.";
  },
});