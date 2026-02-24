import { mutation } from "./_generated/server";

// ============================================================
// Deterministic, sensible demo seed for GOPR-style schema
// - Small dataset
// - Hardcoded incidents (20 total, 2 active)
// - Upsert personnel/equipment by email/name
// - Seed incidents/dispatches/logs/reports only if empty
// ============================================================

// -----------------------------
// Types (local)
// -----------------------------

type IncidentTypeT =
  | "Avalanche"
  | "Missing Person"
  | "Medical Emergency"
  | "Fall / Injury"
  | "Other";

type IncidentStatusT = "standby" | "active" | "resolved";

type EquipmentStatusT = "Available" | "In Use" | "Maintenance" | "Retired";

// -----------------------------
// Helpers
// -----------------------------

function daysAgoIso(n: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function addHours(dateIso: string, hours: number): string {
  const d = new Date(dateIso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function addDays(dateIso: string, days: number, hour = 10, minute = 0): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function clamp<T>(arr: T[], max: number): T[] {
  return arr.slice(0, Math.max(0, max));
}

// -----------------------------
// Hardcoded Personnel (sensible, varied)
// -----------------------------

const PERSONNEL_SEED = [
  {
    email: "jan.kowalski@gopr.pl",
    name: "Jan Kowalski",
    phone: "+48 501 101 101",
    role: "Coordinator",
    certifications: ["Avalanche L2", "Rope Rescue Pro"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Senior field coordinator with strong avalanche response and route planning experience.",
  },
  {
    email: "anna.wisniewska@gopr.pl",
    name: "Anna Wiśniewska",
    phone: "+48 501 101 102",
    role: "Medic",
    certifications: ["Paramedic", "Avalanche L1"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Mountain medic focused on trauma stabilization and hypothermia response.",
  },
  {
    email: "piotr.nowak@gopr.pl",
    name: "Piotr Nowak",
    phone: "+48 501 101 103",
    role: "Rescuer",
    certifications: ["Rope Rescue Pro", "Avalanche L2"],
    baseStation: "Kasprowy Wierch",
    isAvailable: true,
    aiProfileSummary: "Technical rescuer experienced in steep terrain evacuations.",
  },
  {
    email: "michal.zielinski@gopr.pl",
    name: "Michał Zieliński",
    phone: "+48 501 101 104",
    role: "Pilot",
    certifications: ["Heli-Pilot"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Helicopter pilot supporting rapid extraction and aerial search.",
  },
  {
    email: "katarzyna.lewandowska@gopr.pl",
    name: "Katarzyna Lewandowska",
    phone: "+48 501 101 105",
    role: "Rescuer",
    certifications: ["K9 Handler", "Avalanche L1"],
    baseStation: "Morskie Oko Station",
    isAvailable: true,
    aiProfileSummary: "K9 search specialist with experience in missing person operations.",
  },
  {
    email: "maciej.wojcik@gopr.pl",
    name: "Maciej Wójcik",
    phone: "+48 501 101 106",
    role: "Rescuer",
    certifications: ["Rope Rescue Pro"],
    baseStation: "Dolina Pięciu Stawów",
    isAvailable: true,
    aiProfileSummary: "Rescuer focused on rope systems and stretcher-based evacuation.",
  },
  {
    email: "tomasz.kaminski@gopr.pl",
    name: "Tomasz Kamiński",
    phone: "+48 501 101 107",
    role: "Rescuer",
    certifications: ["Avalanche L1"],
    baseStation: "Kasprowy Wierch",
    isAvailable: false,
    aiProfileSummary: "Field rescuer supporting winter patrol and incident response.",
  },
  {
    email: "ewa.mazur@gopr.pl",
    name: "Ewa Mazur",
    phone: "+48 501 101 108",
    role: "Medic",
    certifications: ["Paramedic"],
    baseStation: "Morskie Oko Station",
    isAvailable: true,
    aiProfileSummary: "Paramedic supporting field triage and patient transport preparation.",
  },
  {
    email: "lukasz.kaczmarek@gopr.pl",
    name: "Łukasz Kaczmarek",
    phone: "+48 501 101 109",
    role: "Coordinator",
    certifications: ["Avalanche L1"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Shift coordinator handling dispatch, communications and resource allocation.",
  },
  {
    email: "magdalena.krupa@gopr.pl",
    name: "Magdalena Krupa",
    phone: "+48 501 101 110",
    role: "Rescuer",
    certifications: ["Rope Rescue Pro", "Avalanche L1"],
    baseStation: "Dolina Pięciu Stawów",
    isAvailable: true,
    aiProfileSummary: "Rescuer experienced in mixed terrain approach and evacuation support.",
  },
  {
    email: "pawel.sikora@gopr.pl",
    name: "Paweł Sikora",
    phone: "+48 501 101 111",
    role: "Rescuer",
    certifications: ["K9 Handler"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Search K9 handler supporting missing person and area search missions.",
  },
  {
    email: "dorota.nowicka@gopr.pl",
    name: "Dorota Nowicka",
    phone: "+48 501 101 112",
    role: "Medic",
    certifications: ["Paramedic", "Avalanche L1"],
    baseStation: "Kasprowy Wierch",
    isAvailable: false,
    aiProfileSummary: "Field medic with experience in winter exposure and trauma care.",
  },
  {
    email: "jakub.adamczyk@gopr.pl",
    name: "Jakub Adamczyk",
    phone: "+48 501 101 113",
    role: "Rescuer",
    certifications: ["Avalanche L2", "Rope Rescue Pro"],
    baseStation: "Morskie Oko Station",
    isAvailable: true,
    aiProfileSummary: "Senior rescuer with strong winter terrain and avalanche rescue skills.",
  },
  {
    email: "olga.jablonska@gopr.pl",
    name: "Olga Jabłońska",
    phone: "+48 501 101 114",
    role: "Coordinator",
    certifications: ["Avalanche L1"],
    baseStation: "Zakopane HQ",
    isAvailable: true,
    aiProfileSummary: "Operations coordinator supporting incident logging and communications.",
  },
  {
    email: "sebastian.wrona@gopr.pl",
    name: "Sebastian Wrona",
    phone: "+48 501 101 115",
    role: "Rescuer",
    certifications: ["Rope Rescue Pro"],
    baseStation: "Kasprowy Wierch",
    isAvailable: true,
    aiProfileSummary: "Rescuer supporting technical extraction in rocky terrain.",
  },
  {
    email: "karolina.zalewska@gopr.pl",
    name: "Karolina Zalewska",
    phone: "+48 501 101 116",
    role: "Medic",
    certifications: ["Paramedic"],
    baseStation: "Dolina Pięciu Stawów",
    isAvailable: true,
    aiProfileSummary: "Medic focused on stabilization and handoff for evacuation transport.",
  },
] as const;

// -----------------------------
// Hardcoded Equipment (sensible, small)
// -----------------------------

const EQUIPMENT_SEED: Array<{
  name: string;
  category: string;
  status: EquipmentStatusT;
  lastInspectedDaysAgo: number;
  image?: string;
}> = [
  { name: "Rescue Helicopter Sokół (EQ-001)", category: "Vehicle", status: "Available", lastInspectedDaysAgo: 3 },
  { name: "Skidoo Snowmobile A (EQ-002)", category: "Vehicle", status: "Available", lastInspectedDaysAgo: 7 },
  { name: "Skidoo Snowmobile B (EQ-003)", category: "Vehicle", status: "In Use", lastInspectedDaysAgo: 5 },
  { name: "ATV Utility Quad (EQ-004)", category: "Vehicle", status: "Available", lastInspectedDaysAgo: 12 },

  { name: "Defibrillator AED 1 (EQ-005)", category: "Medical", status: "Available", lastInspectedDaysAgo: 4 },
  { name: "Defibrillator AED 2 (EQ-006)", category: "Medical", status: "Maintenance", lastInspectedDaysAgo: 16 },
  { name: "Trauma Kit Alpha (EQ-007)", category: "Medical", status: "Available", lastInspectedDaysAgo: 6 },
  { name: "Trauma Kit Bravo (EQ-008)", category: "Medical", status: "In Use", lastInspectedDaysAgo: 9 },
  { name: "Stretcher Basket 1 (EQ-009)", category: "Medical", status: "Available", lastInspectedDaysAgo: 11 },

  { name: "Rope Kit Alpine 1 (EQ-010)", category: "Rope/Climbing", status: "Available", lastInspectedDaysAgo: 8 },
  { name: "Rope Kit Alpine 2 (EQ-011)", category: "Rope/Climbing", status: "Maintenance", lastInspectedDaysAgo: 19 },
  { name: "Avalanche Probe Set (EQ-012)", category: "Rope/Climbing", status: "Available", lastInspectedDaysAgo: 10 },

  { name: "VHF Radio Set A (EQ-013)", category: "Communication", status: "Available", lastInspectedDaysAgo: 14 },
  { name: "VHF Radio Set B (EQ-014)", category: "Communication", status: "Available", lastInspectedDaysAgo: 15 },
  { name: "Base Repeater Unit (EQ-015)", category: "Communication", status: "In Use", lastInspectedDaysAgo: 22 },

  { name: "Thermal Drone 1 (EQ-016)", category: "Search K9", status: "Available", lastInspectedDaysAgo: 6 },
  { name: "K9 Unit Harness Set (EQ-017)", category: "Search K9", status: "Available", lastInspectedDaysAgo: 13 },
  { name: "Search Beacon Trainer (EQ-018)", category: "Search K9", status: "Retired", lastInspectedDaysAgo: 40 },
];

// -----------------------------
// Hardcoded Incidents (20 total, sensible, recent)
// 2 active, 1 standby, rest resolved
// -----------------------------

const ACTIVE_INCIDENT_COUNT = 2;

const INCIDENT_TEMPLATES: Array<{
  code: string;
  type: IncidentTypeT;
  severityLevel: number;
  weatherConditions: string;
  gpsCoordinates: { latitude: number; longitude: number };
  daysBack: number;
  status: IncidentStatusT;
  suggestedPersonnelEmails: string[];
  suggestedEquipmentNames: string[];
}> = [
  // Active (2)
  {
    code: "INC-001",
    type: "Missing Person",
    severityLevel: 4,
    weatherConditions: "Foggy, 0C",
    gpsCoordinates: { latitude: 49.2501, longitude: 19.9342 },
    daysBack: 0,
    status: "active",
    suggestedPersonnelEmails: [
      "jan.kowalski@gopr.pl",
      "katarzyna.lewandowska@gopr.pl",
      "pawel.sikora@gopr.pl",
      "lukasz.kaczmarek@gopr.pl",
    ],
    suggestedEquipmentNames: ["Thermal Drone 1 (EQ-016)", "VHF Radio Set A (EQ-013)"],
  },
  {
    code: "INC-002",
    type: "Medical Emergency",
    severityLevel: 5,
    weatherConditions: "Clear, -3C",
    gpsCoordinates: { latitude: 49.2326, longitude: 20.0083 },
    daysBack: 1,
    status: "active",
    suggestedPersonnelEmails: [
      "anna.wisniewska@gopr.pl",
      "ewa.mazur@gopr.pl",
      "michal.zielinski@gopr.pl",
      "jakub.adamczyk@gopr.pl",
    ],
    suggestedEquipmentNames: ["Rescue Helicopter Sokół (EQ-001)", "Defibrillator AED 1 (EQ-005)", "Trauma Kit Alpha (EQ-007)"],
  },

  // Standby (1)
  {
    code: "INC-003",
    type: "Avalanche",
    severityLevel: 4,
    weatherConditions: "Heavy Snow, Low Visibility",
    gpsCoordinates: { latitude: 49.2201, longitude: 20.0268 },
    daysBack: 2,
    status: "standby",
    suggestedPersonnelEmails: [
      "piotr.nowak@gopr.pl",
      "jakub.adamczyk@gopr.pl",
      "maciej.wojcik@gopr.pl",
      "olga.jablonska@gopr.pl",
    ],
    suggestedEquipmentNames: ["Avalanche Probe Set (EQ-012)", "Skidoo Snowmobile A (EQ-002)"],
  },

  // Resolved (17)
  {
    code: "INC-004",
    type: "Fall / Injury",
    severityLevel: 4,
    weatherConditions: "High Winds, -8C",
    gpsCoordinates: { latitude: 49.2248, longitude: 19.9819 },
    daysBack: 5,
    status: "resolved",
    suggestedPersonnelEmails: ["piotr.nowak@gopr.pl", "maciej.wojcik@gopr.pl", "anna.wisniewska@gopr.pl"],
    suggestedEquipmentNames: ["Stretcher Basket 1 (EQ-009)", "Rope Kit Alpine 1 (EQ-010)"],
  },
  {
    code: "INC-005",
    type: "Medical Emergency",
    severityLevel: 3,
    weatherConditions: "Sunny, 2C",
    gpsCoordinates: { latitude: 49.2681, longitude: 19.9812 },
    daysBack: 9,
    status: "resolved",
    suggestedPersonnelEmails: ["karolina.zalewska@gopr.pl", "sebastian.wrona@gopr.pl", "olga.jablonska@gopr.pl"],
    suggestedEquipmentNames: ["Trauma Kit Bravo (EQ-008)", "VHF Radio Set B (EQ-014)"],
  },
  {
    code: "INC-006",
    type: "Missing Person",
    severityLevel: 3,
    weatherConditions: "Clear, -6C",
    gpsCoordinates: { latitude: 49.2562, longitude: 19.9007 },
    daysBack: 13,
    status: "resolved",
    suggestedPersonnelEmails: ["katarzyna.lewandowska@gopr.pl", "pawel.sikora@gopr.pl", "lukasz.kaczmarek@gopr.pl"],
    suggestedEquipmentNames: ["Thermal Drone 1 (EQ-016)", "VHF Radio Set A (EQ-013)"],
  },
  {
    code: "INC-007",
    type: "Fall / Injury",
    severityLevel: 2,
    weatherConditions: "Clear, -1C",
    gpsCoordinates: { latitude: 49.2417, longitude: 19.9958 },
    daysBack: 16,
    status: "resolved",
    suggestedPersonnelEmails: ["magdalena.krupa@gopr.pl", "karolina.zalewska@gopr.pl"],
    suggestedEquipmentNames: ["Stretcher Basket 1 (EQ-009)"],
  },
  {
    code: "INC-008",
    type: "Other",
    severityLevel: 1,
    weatherConditions: "Foggy, 1C",
    gpsCoordinates: { latitude: 49.2304, longitude: 19.9614 },
    daysBack: 20,
    status: "resolved",
    suggestedPersonnelEmails: ["olga.jablonska@gopr.pl", "tomasz.kaminski@gopr.pl"],
    suggestedEquipmentNames: ["VHF Radio Set B (EQ-014)"],
  },
  {
    code: "INC-009",
    type: "Medical Emergency",
    severityLevel: 4,
    weatherConditions: "High Winds, -10C",
    gpsCoordinates: { latitude: 49.2489, longitude: 20.0215 },
    daysBack: 24,
    status: "resolved",
    suggestedPersonnelEmails: ["anna.wisniewska@gopr.pl", "dorota.nowicka@gopr.pl", "piotr.nowak@gopr.pl"],
    suggestedEquipmentNames: ["Defibrillator AED 1 (EQ-005)", "Trauma Kit Alpha (EQ-007)"],
  },
  {
    code: "INC-010",
    type: "Missing Person",
    severityLevel: 3,
    weatherConditions: "Foggy, -2C",
    gpsCoordinates: { latitude: 49.2145, longitude: 19.9533 },
    daysBack: 28,
    status: "resolved",
    suggestedPersonnelEmails: ["pawel.sikora@gopr.pl", "katarzyna.lewandowska@gopr.pl", "jan.kowalski@gopr.pl"],
    suggestedEquipmentNames: ["K9 Unit Harness Set (EQ-017)", "Thermal Drone 1 (EQ-016)"],
  },
  {
    code: "INC-011",
    type: "Fall / Injury",
    severityLevel: 3,
    weatherConditions: "Clear, 1C",
    gpsCoordinates: { latitude: 49.2614, longitude: 19.9448 },
    daysBack: 33,
    status: "resolved",
    suggestedPersonnelEmails: ["sebastian.wrona@gopr.pl", "karolina.zalewska@gopr.pl", "lukasz.kaczmarek@gopr.pl"],
    suggestedEquipmentNames: ["Rope Kit Alpine 1 (EQ-010)", "Stretcher Basket 1 (EQ-009)"],
  },
  {
    code: "INC-012",
    type: "Medical Emergency",
    severityLevel: 2,
    weatherConditions: "Sunny, 4C",
    gpsCoordinates: { latitude: 49.2369, longitude: 20.0141 },
    daysBack: 37,
    status: "resolved",
    suggestedPersonnelEmails: ["ewa.mazur@gopr.pl", "maciej.wojcik@gopr.pl"],
    suggestedEquipmentNames: ["Trauma Kit Alpha (EQ-007)"],
  },
  {
    code: "INC-013",
    type: "Other",
    severityLevel: 1,
    weatherConditions: "Clear, 0C",
    gpsCoordinates: { latitude: 49.2277, longitude: 19.9752 },
    daysBack: 42,
    status: "resolved",
    suggestedPersonnelEmails: ["olga.jablonska@gopr.pl", "jakub.adamczyk@gopr.pl"],
    suggestedEquipmentNames: ["VHF Radio Set A (EQ-013)"],
  },
  {
    code: "INC-014",
    type: "Avalanche",
    severityLevel: 5,
    weatherConditions: "Heavy Snow, Low Visibility",
    gpsCoordinates: { latitude: 49.2167, longitude: 20.0402 },
    daysBack: 47,
    status: "resolved",
    suggestedPersonnelEmails: ["piotr.nowak@gopr.pl", "jakub.adamczyk@gopr.pl", "anna.wisniewska@gopr.pl", "michal.zielinski@gopr.pl"],
    suggestedEquipmentNames: ["Rescue Helicopter Sokół (EQ-001)", "Avalanche Probe Set (EQ-012)", "Skidoo Snowmobile B (EQ-003)"],
  },
  {
    code: "INC-015",
    type: "Fall / Injury",
    severityLevel: 5,
    weatherConditions: "High Winds, -12C",
    gpsCoordinates: { latitude: 49.2438, longitude: 19.9897 },
    daysBack: 53,
    status: "resolved",
    suggestedPersonnelEmails: ["piotr.nowak@gopr.pl", "maciej.wojcik@gopr.pl", "karolina.zalewska@gopr.pl", "jan.kowalski@gopr.pl"],
    suggestedEquipmentNames: ["Rope Kit Alpine 2 (EQ-011)", "Stretcher Basket 1 (EQ-009)"],
  },
  {
    code: "INC-016",
    type: "Medical Emergency",
    severityLevel: 3,
    weatherConditions: "Foggy, -1C",
    gpsCoordinates: { latitude: 49.2524, longitude: 19.9726 },
    daysBack: 59,
    status: "resolved",
    suggestedPersonnelEmails: ["dorota.nowicka@gopr.pl", "sebastian.wrona@gopr.pl", "olga.jablonska@gopr.pl"],
    suggestedEquipmentNames: ["Defibrillator AED 1 (EQ-005)", "VHF Radio Set B (EQ-014)"],
  },
  {
    code: "INC-017",
    type: "Missing Person",
    severityLevel: 2,
    weatherConditions: "Clear, -4C",
    gpsCoordinates: { latitude: 49.2387, longitude: 19.9289 },
    daysBack: 64,
    status: "resolved",
    suggestedPersonnelEmails: ["pawel.sikora@gopr.pl", "katarzyna.lewandowska@gopr.pl"],
    suggestedEquipmentNames: ["K9 Unit Harness Set (EQ-017)"],
  },
  {
    code: "INC-018",
    type: "Other",
    severityLevel: 2,
    weatherConditions: "Sunny, 3C",
    gpsCoordinates: { latitude: 49.2455, longitude: 20.0036 },
    daysBack: 70,
    status: "resolved",
    suggestedPersonnelEmails: ["lukasz.kaczmarek@gopr.pl", "magdalena.krupa@gopr.pl"],
    suggestedEquipmentNames: ["ATV Utility Quad (EQ-004)"],
  },
  {
    code: "INC-019",
    type: "Fall / Injury",
    severityLevel: 3,
    weatherConditions: "Clear, -2C",
    gpsCoordinates: { latitude: 49.2199, longitude: 19.9474 },
    daysBack: 77,
    status: "resolved",
    suggestedPersonnelEmails: ["sebastian.wrona@gopr.pl", "ewa.mazur@gopr.pl", "jakub.adamczyk@gopr.pl"],
    suggestedEquipmentNames: ["Rope Kit Alpine 1 (EQ-010)", "Trauma Kit Bravo (EQ-008)"],
  },
  {
    code: "INC-020",
    type: "Medical Emergency",
    severityLevel: 4,
    weatherConditions: "High Winds, -7C",
    gpsCoordinates: { latitude: 49.2333, longitude: 19.9911 },
    daysBack: 84,
    status: "resolved",
    suggestedPersonnelEmails: ["anna.wisniewska@gopr.pl", "karolina.zalewska@gopr.pl", "jan.kowalski@gopr.pl"],
    suggestedEquipmentNames: ["Defibrillator AED 2 (EQ-006)", "Trauma Kit Alpha (EQ-007)"],
  },
];

// -----------------------------
// Hardcoded Maintenance Logs (sensible, recent)
// -----------------------------

const MAINTENANCE_LOG_SEED: Array<{
  equipmentName: string;
  issueType: string;
  description: string;
  daysAgo: number;
}> = [
  {
    equipmentName: "Defibrillator AED 2 (EQ-006)",
    issueType: "Battery Failure",
    description: "Self-test reported low battery reserve; battery module replacement scheduled.",
    daysAgo: 3,
  },
  {
    equipmentName: "Rope Kit Alpine 2 (EQ-011)",
    issueType: "Wear and Tear",
    description: "Visible sheath abrasion on main rope segment; set removed from service pending replacement.",
    daysAgo: 5,
  },
  {
    equipmentName: "Skidoo Snowmobile B (EQ-003)",
    issueType: "Engine Malfunction",
    description: "Intermittent engine stall during cold start; diagnostic inspection completed.",
    daysAgo: 7,
  },
  {
    equipmentName: "VHF Radio Set B (EQ-014)",
    issueType: "Calibration Drift",
    description: "Transmit power reading out of tolerance during inspection; recalibration performed.",
    daysAgo: 9,
  },
  {
    equipmentName: "Thermal Drone 1 (EQ-016)",
    issueType: "Structural Damage",
    description: "One propeller arm cover cracked during landing on rocky terrain; replaced.",
    daysAgo: 11,
  },
  {
    equipmentName: "Stretcher Basket 1 (EQ-009)",
    issueType: "Wear and Tear",
    description: "Locking pin wear detected on right-side latch; pin replaced and tested.",
    daysAgo: 13,
  },
  {
    equipmentName: "Rescue Helicopter Sokół (EQ-001)",
    issueType: "Hydraulic Leak",
    description: "Minor hydraulic seepage observed at access panel during post-flight check; seal replaced.",
    daysAgo: 16,
  },
  {
    equipmentName: "Base Repeater Unit (EQ-015)",
    issueType: "Software Error",
    description: "Controller process restart loop after power fluctuation; firmware patch applied.",
    daysAgo: 18,
  },
  {
    equipmentName: "Avalanche Probe Set (EQ-012)",
    issueType: "Wear and Tear",
    description: "Two probe segments bent during training exercise; set reconfigured and marked for replacement parts.",
    daysAgo: 21,
  },
  {
    equipmentName: "Trauma Kit Bravo (EQ-008)",
    issueType: "Wear and Tear",
    description: "Expired consumables found during routine check; restocked and resealed.",
    daysAgo: 24,
  },
  {
    equipmentName: "ATV Utility Quad (EQ-004)",
    issueType: "Engine Malfunction",
    description: "Irregular idle noted after steep ascent use; throttle body cleaned and tested.",
    daysAgo: 28,
  },
  {
    equipmentName: "Defibrillator AED 1 (EQ-005)",
    issueType: "Software Error",
    description: "Startup warning code after self-test; vendor diagnostics completed, no hardware issue found.",
    daysAgo: 33,
  },
  {
    equipmentName: "K9 Unit Harness Set (EQ-017)",
    issueType: "Wear and Tear",
    description: "Harness buckle showing stress marks; buckle assembly replaced.",
    daysAgo: 39,
  },
  {
    equipmentName: "VHF Radio Set A (EQ-013)",
    issueType: "Battery Failure",
    description: "Battery pack capacity degraded below operational target in cold weather; battery replaced.",
    daysAgo: 45,
  },
];

// -----------------------------
// Hardcoded Mission Reports (sensible, tied to incidents)
// -----------------------------

const MISSION_REPORT_SEED: Array<{
  incidentCode: string;
  reporterEmail: string;
  difficultyRating?: number;
  notes: string;
  hoursAfterIncident: number;
}> = [
  {
    incidentCode: "INC-001",
    reporterEmail: "jan.kowalski@gopr.pl",
    difficultyRating: 4,
    notes: "Search sector assignment completed. K9 and drone coverage prioritized due to low visibility.",
    hoursAfterIncident: 4,
  },
  {
    incidentCode: "INC-002",
    reporterEmail: "anna.wisniewska@gopr.pl",
    difficultyRating: 5,
    notes: "Patient stabilized on site and prepared for aerial evacuation. Strong coordination between medic and pilot.",
    hoursAfterIncident: 6,
  },
  {
    incidentCode: "INC-003",
    reporterEmail: "piotr.nowak@gopr.pl",
    difficultyRating: 4,
    notes: "Avalanche area assessed. Standby posture maintained after no confirmed burial.",
    hoursAfterIncident: 8,
  },
  {
    incidentCode: "INC-004",
    reporterEmail: "maciej.wojcik@gopr.pl",
    difficultyRating: 4,
    notes: "Steep icy section required rope protection for stretcher extraction. Patient transferred safely.",
    hoursAfterIncident: 12,
  },
  {
    incidentCode: "INC-005",
    reporterEmail: "karolina.zalewska@gopr.pl",
    difficultyRating: 3,
    notes: "Dehydration and fatigue treated on site. Assisted descent completed without complications.",
    hoursAfterIncident: 10,
  },
  {
    incidentCode: "INC-006",
    reporterEmail: "katarzyna.lewandowska@gopr.pl",
    difficultyRating: 3,
    notes: "Missing skier located near alternate descent route. K9 support shortened search time.",
    hoursAfterIncident: 14,
  },
  {
    incidentCode: "INC-009",
    reporterEmail: "dorota.nowicka@gopr.pl",
    difficultyRating: 4,
    notes: "Hypothermia protocol initiated in field. Wind exposure significantly impacted patient comfort.",
    hoursAfterIncident: 9,
  },
  {
    incidentCode: "INC-010",
    reporterEmail: "pawel.sikora@gopr.pl",
    difficultyRating: 3,
    notes: "Search pattern adjusted after terrain bottleneck. Thermal drone helped confirm route traces.",
    hoursAfterIncident: 11,
  },
  {
    incidentCode: "INC-011",
    reporterEmail: "sebastian.wrona@gopr.pl",
    difficultyRating: 3,
    notes: "Evacuation required short rope support over exposed section. Patient transported to trailhead.",
    hoursAfterIncident: 13,
  },
  {
    incidentCode: "INC-012",
    reporterEmail: "ewa.mazur@gopr.pl",
    difficultyRating: 2,
    notes: "Mild symptoms resolved after rest and hydration. No transport required.",
    hoursAfterIncident: 6,
  },
  {
    incidentCode: "INC-014",
    reporterEmail: "jakub.adamczyk@gopr.pl",
    difficultyRating: 5,
    notes: "Avalanche debris assessment and search completed under low visibility. Multi-team coordination effective.",
    hoursAfterIncident: 18,
  },
  {
    incidentCode: "INC-015",
    reporterEmail: "jan.kowalski@gopr.pl",
    difficultyRating: 5,
    notes: "Severe trauma suspected. Technical extraction and stretcher transport completed in high winds.",
    hoursAfterIncident: 16,
  },
  {
    incidentCode: "INC-016",
    reporterEmail: "olga.jablonska@gopr.pl",
    difficultyRating: 3,
    notes: "Communication relay and incident logging maintained without interruption during field treatment.",
    hoursAfterIncident: 7,
  },
  {
    incidentCode: "INC-017",
    reporterEmail: "katarzyna.lewandowska@gopr.pl",
    difficultyRating: 2,
    notes: "Delayed return confirmed as route deviation. Subject located responsive and ambulatory.",
    hoursAfterIncident: 8,
  },
  {
    incidentCode: "INC-019",
    reporterEmail: "ewa.mazur@gopr.pl",
    difficultyRating: 3,
    notes: "Shoulder dislocation managed in field with immobilization before assisted evacuation.",
    hoursAfterIncident: 12,
  },
  {
    incidentCode: "INC-020",
    reporterEmail: "anna.wisniewska@gopr.pl",
    difficultyRating: 4,
    notes: "Severe allergic reaction stabilized with emergency medication and monitored during transport.",
    hoursAfterIncident: 9,
  },
];

// -----------------------------
// Upsert Personnel (ALWAYS ensure sensible set exists)
// -----------------------------

async function ensurePersonnel(ctx: any) {
  let created = 0;
  let updated = 0;

  const idsByEmail = new Map<string, any>();

  for (const p of PERSONNEL_SEED) {
    const existing = (
      await ctx.db
        .query("personnel")
        .withIndex("by_email", (q: any) => q.eq("email", p.email))
        .collect()
    )[0];

    const doc = {
      name: p.name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      certifications: [...p.certifications],
      baseStation: p.baseStation,
      isAvailable: p.isAvailable,
      aiProfileSummary: p.aiProfileSummary,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      idsByEmail.set(p.email, existing._id);
      updated++;
    } else {
      const id = await ctx.db.insert("personnel", doc);
      idsByEmail.set(p.email, id);
      created++;
    }
  }

  const allPersonnel = await ctx.db.query("personnel").collect();

  return {
    createdPersonnel: created,
    updatedPersonnel: updated,
    totalPersonnel: allPersonnel.length,
    personnelIds: allPersonnel.map((x: any) => x._id),
    personnelIdByEmail: idsByEmail,
  };
}

// -----------------------------
// Upsert Equipment (deterministic by name)
// -----------------------------

async function ensureEquipment(ctx: any) {
  let created = 0;
  let updated = 0;

  const existing = await ctx.db.query("equipment").collect();
  const byName = new Map<string, any>(
    existing.map((e: any) => [String(e.name), e] as [string, any])
  );

  const idsByName = new Map<string, any>();

  for (const e of EQUIPMENT_SEED) {
    const doc = {
      name: e.name,
      category: e.category,
      status: e.status,
      image: e.image,
      lastInspected: daysAgoIso(e.lastInspectedDaysAgo, 8, 30),
    };

    const found = byName.get(e.name);
    if (found) {
      await ctx.db.patch(found._id, doc);
      idsByName.set(e.name, found._id);
      updated++;
    } else {
      const id = await ctx.db.insert("equipment", doc);
      idsByName.set(e.name, id);
      created++;
    }
  }

  const allEquipment = await ctx.db.query("equipment").collect();

  return {
    createdEquipment: created,
    updatedEquipment: updated,
    totalEquipment: allEquipment.length,
    equipmentIds: allEquipment.map((x: any) => x._id),
    equipmentIdByName: idsByName,
  };
}

// -----------------------------
// Seed Incidents + Dispatches (hardcoded, if empty)
// -----------------------------

async function seedIncidentsAndDispatchesIfEmpty(
  ctx: any,
  personnelIdByEmail: Map<string, any>,
  equipmentIdByName: Map<string, any>
) {
  let createdIncidents = 0;
  let createdDispatches = 0;

  const existingIncidents = await ctx.db.query("incidents").collect();
  if (existingIncidents.length > 0) {
    return {
      skipped: true,
      createdIncidents,
      createdDispatches,
      existingIncidentsCount: existingIncidents.length,
      incidentIds: existingIncidents.map((i: any) => i._id),
      incidentIdByCode: new Map<string, any>(),
    };
  }

  const incidentIds: any[] = [];
  const incidentIdByCode = new Map<string, any>();

  for (const inc of INCIDENT_TEMPLATES) {
    const incidentId = await ctx.db.insert("incidents", {
      type: inc.type,
      status: inc.status,
      severityLevel: inc.severityLevel,
      gpsCoordinates: inc.gpsCoordinates,
      weatherConditions: inc.weatherConditions,
      reportedDate: daysAgoIso(inc.daysBack, 9, 15),
    });

    incidentIds.push(incidentId);
    incidentIdByCode.set(inc.code, incidentId);
    createdIncidents++;

    // Dispatch personnel
    for (const email of inc.suggestedPersonnelEmails) {
      const personnelId = personnelIdByEmail.get(email);
      if (!personnelId) continue;

      await ctx.db.insert("dispatches", {
        incidentId,
        personnelId,
        equipmentId: undefined,
        dispatchTime: daysAgoIso(inc.daysBack, 9, 20),
      });
      createdDispatches++;
    }

    // Dispatch equipment
    for (const eqName of inc.suggestedEquipmentNames) {
      const equipmentId = equipmentIdByName.get(eqName);
      if (!equipmentId) continue;

      await ctx.db.insert("dispatches", {
        incidentId,
        personnelId: undefined,
        equipmentId,
        dispatchTime: daysAgoIso(inc.daysBack, 9, 25),
      });
      createdDispatches++;
    }
  }

  return {
    skipped: false,
    createdIncidents,
    createdDispatches,
    existingIncidentsCount: 0,
    incidentIds,
    incidentIdByCode,
  };
}

// -----------------------------
// Seed Maintenance Logs (hardcoded, if empty)
// -----------------------------

async function seedMaintenanceLogsIfEmpty(
  ctx: any,
  equipmentIdByName: Map<string, any>
) {
  let createdMaintenanceLogs = 0;

  const existingLogs = await ctx.db.query("maintenance_logs").collect();
  if (existingLogs.length > 0) {
    return {
      skipped: true,
      createdMaintenanceLogs,
      existingLogsCount: existingLogs.length,
    };
  }

  for (const log of MAINTENANCE_LOG_SEED) {
    const equipmentId = equipmentIdByName.get(log.equipmentName);
    if (!equipmentId) continue;

    await ctx.db.insert("maintenance_logs", {
      equipmentId,
      issueType: log.issueType,
      description: log.description,
      logDate: daysAgoIso(log.daysAgo, 11, 0),
    });
    createdMaintenanceLogs++;
  }

  return {
    skipped: false,
    createdMaintenanceLogs,
    existingLogsCount: 0,
  };
}

// -----------------------------
// Seed Mission Reports (hardcoded, if empty)
// -----------------------------

async function seedMissionReportsIfEmpty(
  ctx: any,
  incidentIdByCodeFromSeed: Map<string, any>,
  personnelIdByEmail: Map<string, any>
) {
  let createdMissionReports = 0;

  const existingReports = await ctx.db.query("mission_reports").collect();
  if (existingReports.length > 0) {
    return {
      skipped: true,
      createdMissionReports,
      existingReportsCount: existingReports.length,
    };
  }

  // If incidents were skipped because they already existed, we don't have code->id mapping.
  // In that case, skip mission reports too (avoids mismatched assumptions).
  if (incidentIdByCodeFromSeed.size === 0) {
    return {
      skipped: true,
      createdMissionReports,
      existingReportsCount: existingReports.length,
    };
  }

  // Load incident dates for proper report timestamps
  const incidents = await ctx.db.query("incidents").collect();
  const incidentById = new Map<string, any>(
    incidents.map((i: any) => [String(i._id), i] as [string, any])
  );

  for (const r of MISSION_REPORT_SEED) {
    const incidentId = incidentIdByCodeFromSeed.get(r.incidentCode);
    const reporterId = personnelIdByEmail.get(r.reporterEmail);
    if (!incidentId || !reporterId) continue;

    const incident = incidentById.get(String(incidentId));
    if (!incident) continue;

    await ctx.db.insert("mission_reports", {
      incidentId,
      reporterId,
      difficultyRating: r.difficultyRating,
      notes: r.notes,
      reportDate: addHours(incident.reportedDate, r.hoursAfterIncident),
    });

    createdMissionReports++;
  }

  return {
    skipped: false,
    createdMissionReports,
    existingReportsCount: 0,
  };
}

// -----------------------------
// Main seed mutation
// -----------------------------

export const seed = mutation({
  handler: async (ctx) => {
    // 1) Always ensure sensible personnel/equipment are present
    const personnel = await ensurePersonnel(ctx);
    const equipment = await ensureEquipment(ctx);

    // 2) Seed hardcoded incidents + dispatches (only if empty)
    const incidentsResult = await seedIncidentsAndDispatchesIfEmpty(
      ctx,
      personnel.personnelIdByEmail,
      equipment.equipmentIdByName
    );

    // 3) Seed hardcoded maintenance logs (only if empty)
    const maintenanceResult = await seedMaintenanceLogsIfEmpty(
      ctx,
      equipment.equipmentIdByName
    );

    // 4) Seed hardcoded mission reports (only if empty and incidents were seeded now)
    const missionReportsResult = await seedMissionReportsIfEmpty(
      ctx,
      incidentsResult.incidentIdByCode,
      personnel.personnelIdByEmail
    );

    return [
      "✅ Seed completed (sensible demo data)",
      `Personnel: +${personnel.createdPersonnel} created, ${personnel.updatedPersonnel} updated (total: ${personnel.totalPersonnel})`,
      `Equipment: +${equipment.createdEquipment} created, ${equipment.updatedEquipment} updated (total: ${equipment.totalEquipment})`,
      incidentsResult.skipped
        ? `Incidents: skipped (already had ${incidentsResult.existingIncidentsCount})`
        : `Incidents: +${incidentsResult.createdIncidents} created (hardcoded 20, ${ACTIVE_INCIDENT_COUNT} active)`,
      incidentsResult.skipped
        ? "Dispatches: skipped (incident seed skipped)"
        : `Dispatches: +${incidentsResult.createdDispatches} created`,
      maintenanceResult.skipped
        ? `Maintenance Logs: skipped (already had ${maintenanceResult.existingLogsCount})`
        : `Maintenance Logs: +${maintenanceResult.createdMaintenanceLogs} created`,
      missionReportsResult.skipped
        ? `Mission Reports: skipped (already had ${missionReportsResult.existingReportsCount} or incidents already existed)`
        : `Mission Reports: +${missionReportsResult.createdMissionReports} created`,
    ].join(" | ");
  },
});
