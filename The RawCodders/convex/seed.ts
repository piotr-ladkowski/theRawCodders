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
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];
const COUNTRIES = ["USA", "Canada", "UK", "Australia", "Germany", "France", "Japan", "Brazil"];
const STREETS = ["Main St", "Oak Ave", "Pine Ln", "Maple Dr", "Cedar Rd", "Elm St", "Washington Blvd", "Lakeview Dr"];
const PRODUCT_ADJECTIVES = ["Premium", "Deluxe", "Standard", "Basic", "Pro", "Ultra", "Super", "Eco", "Smart", "Compact"];
const PRODUCT_NOUNS = ["Widget", "Gadget", "Device", "Tool", "System", "Module", "Unit", "Machine", "Appliance", "Instrument"];
const RETURN_REASONS = ["Product not received", "Discrepancy with the description", "Faulty product", "Other"];
const TRANSACTION_STATUSES = ["pending", "completed", "cancelled"];



// --- Optional "must-have" records (MERGE-safe) ---
const REQUIRED_CLIENTS: Array<{
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  sex?: "Male" | "Female";
  address?: {
    line1: string;
    line2?: string;
    postCode: string;
    city: string;
    country: string;
  };
}> = [];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generateClient() {
  const first = randomItem(FIRST_NAMES);
  const last = randomItem(LAST_NAMES);
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 10000)}@example.com`,
    phone: `${randomInt(100, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    birthDate: randomDate(new Date(1950, 0, 1), new Date(2005, 0, 1)).split('T')[0],
    sex: Math.random() > 0.5 ? "Male" : "Female",
    address: {
      line1: `${randomInt(1, 9999)} ${randomItem(STREETS)}`,
      line2: Math.random() > 0.7 ? `Apt ${randomInt(1, 100)}` : "",
      postCode: `${randomInt(10000, 99999)}`,
      city: randomItem(CITIES),
      country: randomItem(COUNTRIES),
    },
  };
}

function generateProduct() {
  const price = randomFloat(10, 1000);
  const cost = parseFloat((price * (Math.random() * (0.7 - 0.4) + 0.4)).toFixed(2));
  return {
    name: `${randomItem(PRODUCT_ADJECTIVES)} ${randomItem(PRODUCT_NOUNS)} ${randomInt(100, 9000)}`,
    price,
    cost,
    stock: randomInt(0, 500),
    image: "https://placehold.co/200x200", // Placeholder image
  };
}

// --- Seeding Functions ---

async function seedProducts(ctx: any, targetTotal: number) {
  const existing = await ctx.db.query("products").collect();
  const existingNames = new Set(existing.map((p: any) => (p?.name ?? "").toLowerCase()).filter(Boolean));

  const missingCount = Math.max(0, targetTotal - existing.length);
  if (missingCount === 0) {
    return existing;
  }

  const products: any[] = [];
  const hardStop = targetTotal * 20;
  let attempts = 0;

  while (products.length < missingCount && attempts < hardStop) {
    attempts++;
    const p = generateProduct();
    const key = (p.name ?? "").toLowerCase();
    if (!key || existingNames.has(key)) continue;
    existingNames.add(key);
    products.push(p);
  }

  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Promise.all(batch.map((p) => ctx.db.insert("products", p)));
  }

  return await ctx.db.query("products").collect();
}


async function seedClients(ctx: any, targetTotal: number) {
  const existing = await ctx.db.query("clients").collect();
  const existingByEmail = new Map<string, any>();
  for (const c of existing) {
    const email = (c?.email ?? "").toLowerCase();
    if (email) existingByEmail.set(email, c);
  }

  let inserted = 0;

  const ensureClient = async (candidate: any) => {
    const email = (candidate?.email ?? "").toLowerCase();
    if (!email || existingByEmail.has(email)) return false;

    const id = await ctx.db.insert("clients", candidate);
    existingByEmail.set(email, { _id: id, ...candidate });
    inserted++;
    return true;
  };

  for (const rc of REQUIRED_CLIENTS) {
    await ensureClient(rc);
  }

  const hardStop = targetTotal * 50;
  let attempts = 0;
  while (existingByEmail.size < targetTotal && attempts < hardStop) {
    attempts++;
    const c = generateClient();
    await ensureClient(c);
  }

  return Array.from(existingByEmail.values());
}


// --- Organic Review Seeding ---

const REVIEWER_PERSONAS = [
  {
    name: "brief-positive",
    intros: ["Solid product.", "Really good overall.", "Happy with this one.", "Works well."],
    likes: ["Easy to use", "Feels well made", "Good value", "Does what I expected", "Arrived in good condition"],
    quirks: ["Would buy again.", "No complaints so far.", "Pretty satisfied.", "Met my expectations."],
  },
  {
    name: "practical-detail",
    intros: ["I've been using this for a bit now.", "Bought this recently and tested it a few times.", "Used it enough to leave a review."],
    likes: ["quality is decent", "setup was straightforward", "performance is consistent", "price-to-quality ratio is fair", "it feels durable"],
    quirks: ["Packaging was okay.", "Delivery was on time.", "Instructions could be clearer.", "I wish it came in more variants."],
  },
  {
    name: "balanced",
    intros: ["Overall, pretty good.", "Decent purchase.", "Good, but not perfect."],
    likes: ["works as described", "the size/form factor is convenient", "it does the job", "value is reasonable"],
    quirks: ["A few small things could be improved.", "Took a little time to get used to it.", "Still happy with the purchase."],
  },
  {
    name: "enthusiastic",
    intros: ["Love it.", "Excellent purchase.", "Very impressed."],
    likes: ["better than expected", "great build quality", "super easy to use", "worth the money", "works perfectly for my needs"],
    quirks: ["Would definitely recommend.", "I ended up ordering another one.", "One of the better purchases I've made recently."],
  },
];

function pickWeightedRating(): number {
  // Skew positive to feel realistic in e-commerce
  const r = Math.random();
  if (r < 0.40) return 5;
  if (r < 0.75) return 4;
  if (r < 0.90) return 3;
  if (r < 0.97) return 2;
  return 1;
}

function maybe<T>(value: T, probability = 0.5): T | "" {
  return Math.random() < probability ? value : "";
}

function joinReviewParts(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateOrganicReviewText(rating: number, persona: (typeof REVIEWER_PERSONAS)[number]): string {
  const intro = randomItem(persona.intros);

  // Slightly different wording based on rating
  if (rating >= 5) {
    return joinReviewParts([
      intro,
      `${randomItem(persona.likes)}.`,
      maybe(`${randomItem(persona.quirks)}`, 0.8),
    ]);
  }

  if (rating === 4) {
    return joinReviewParts([
      intro,
      `Overall ${randomItem(["I'm happy with it", "it works well", "it's a good buy for the price"])}.`,
      maybe(`${randomItem(persona.likes)}.`, 0.8),
      maybe(`${randomItem(["Small nitpick, but nothing major.", "Minor issue at first, but fine after using it more.", "Not perfect, but I would still recommend it."])}`, 0.7),
    ]);
  }

  if (rating === 3) {
    return joinReviewParts([
      randomItem(["It's okay.", "Average experience.", "Mixed feelings on this one."]),
      `${randomItem(["It works, but I expected a bit more", "The product is usable, just not amazing", "Some parts are good, some are just average"])}.`,
      maybe(`${randomItem(["Good enough for occasional use.", "I might try a different option next time.", "Not bad, just not great."])}`, 0.8),
    ]);
  }

  if (rating === 2) {
    return joinReviewParts([
      randomItem(["A bit disappointing.", "Not great for me.", "Expected better."]),
      `${randomItem(["It works inconsistently", "Quality feels below expectations", "Didn't match what I hoped for"])}.`,
      maybe(`${randomItem(["Customer support might help, but I haven't reached out yet.", "I can still use it, but I wouldn't reorder.", "Maybe I got an unlucky unit."])}`, 0.7),
    ]);
  }

  // rating === 1
  return joinReviewParts([
    randomItem(["Very disappointed.", "Would not recommend.", "Poor experience overall."]),
    `${randomItem(["Did not work as expected", "Quality was much lower than expected", "Had issues almost immediately"])}.`,
    maybe(`${randomItem(["I requested a return.", "I stopped using it.", "Not worth the price in my case."])}`, 0.8),
  ]);
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function seedOpinionsOrganic(ctx: any, targetTotal: number) {
  const existingOpinions = await ctx.db.query("opinions").collect();
  if (existingOpinions.length >= targetTotal) {
    console.log(`Opinions already >= ${targetTotal}. Skipping.`);
    return;
  }

  const existingPairs = new Set(
    existingOpinions.map((o: any) => `${String(o.clientId)}::${String(o.productId)}`)
  );

  // Pull purchase history and only review completed transactions
  const [transactions, orders] = await Promise.all([
    ctx.db.query("transactions").collect(),
    ctx.db.query("orders").collect(),
  ]);

  const completedById = new Map<string, any>();
  for (const t of transactions) {
    if (t.status === "completed") completedById.set(String(t._id), t);
  }

  type Candidate = {
    clientId: any;
    productId: any;
    purchaseDate: string;
  };

  const candidatePairs: Candidate[] = [];
  const seenCandidatePairs = new Set<string>();

  for (const o of orders) {
    const tx = completedById.get(String(o.transactionId));
    if (!tx) continue;

    const key = `${String(tx.clientId)}::${String(o.productId)}`;
    if (existingPairs.has(key) || seenCandidatePairs.has(key)) continue;

    seenCandidatePairs.add(key);
    candidatePairs.push({
      clientId: tx.clientId,
      productId: o.productId,
      purchaseDate: tx.date,
    });
  }

  if (candidatePairs.length === 0) {
    console.log("No candidate completed purchases found for opinions.");
    return;
  }

  // Cluster reviews around a few active buyers
  const byClient = new Map<string, Candidate[]>();
  for (const c of candidatePairs) {
    const k = String(c.clientId);
    if (!byClient.has(k)) byClient.set(k, []);
    byClient.get(k)!.push(c);
  }

  // Sort clients by number of purchased products (more active buyers first)
  const clientBuckets = Array.from(byClient.entries())
    .sort((a, b) => b[1].length - a[1].length);

  // Choose a few core reviewers (e.g. 8-12)
  const coreReviewerCount = Math.min(10, clientBuckets.length);
  const coreClients = clientBuckets.slice(0, coreReviewerCount);

  // Build selection pool with heavier weight on core reviewers
  // 80% from core reviewers, 20% from everyone else
  const corePool = coreClients.flatMap(([, arr]) => arr);
  const allPool = candidatePairs;

  const missing = Math.min(targetTotal - existingOpinions.length, candidatePairs.length);
  const selected: Candidate[] = [];
  const selectedKeys = new Set<string>();

  let safety = 0;
  while (selected.length < missing && safety < missing * 50) {
    safety++;
    const useCore = Math.random() < 0.8 && corePool.length > 0;
    const pool = useCore ? corePool : allPool;
    const c = randomItem(pool);
    const key = `${String(c.clientId)}::${String(c.productId)}`;
    if (selectedKeys.has(key)) continue;
    selectedKeys.add(key);
    selected.push(c);
  }

  // Assign personas mostly per client for consistency of voice
  const personaByClient = new Map<string, (typeof REVIEWER_PERSONAS)[number]>();
  for (const [clientId] of clientBuckets) {
    personaByClient.set(clientId, randomItem(REVIEWER_PERSONAS));
  }

  for (const c of selected) {
    const clientKey = String(c.clientId);
    const persona = personaByClient.get(clientKey) ?? randomItem(REVIEWER_PERSONAS);
    const rating = pickWeightedRating();
    const text = generateOrganicReviewText(rating, persona);

    // Review date after purchase date, usually within 1-30 days
    const reviewDate = addDays(c.purchaseDate, randomInt(1, 30));

    await ctx.db.insert("opinions", {
      productId: c.productId,
      clientId: c.clientId,
      rating,
      text,
      date: reviewDate,
    });
  }

  console.log(`Seeded ${selected.length} organic opinions. Total opinions should be ~${existingOpinions.length + selected.length}.`);
}


// --- Main Mutation ---

export const seed = mutation({
  handler: async (ctx) => {
    // 1. Seed Products
    const products = await seedProducts(ctx, 500);
    
    // 2. Seed Clients
    const clients = await seedClients(ctx, 200);

    // 3. Seed Transactions
    await seedTransactionsFull(ctx, clients, products, 1000, 30);

    // 4. Seed organic reviews/opinions  <-- missing in your current file
    await seedOpinionsOrganic(ctx, 50);

    return "Database seeded successfully (Top-up: 1k transactions, ~2k orders, ~30 returns, ~50 organic opinions).";
  },
});

async function seedTransactionsFull(ctx: any, clients: any[], products: any[], targetTransactions: number, targetReturns: number) {
    const existingTrans = await ctx.db.query("transactions").collect();
    const existingReturns = await ctx.db.query("returns").collect();
    
    const missingTransCount = Math.max(0, targetTransactions - existingTrans.length);
    
    if (missingTransCount === 0) {
        console.log(`Transactions already >= ${targetTransactions}. Skipping.`);
        return;
    }
    
    if (clients.length === 0 || products.length === 0) {
        console.log("Missing clients or products. Cannot seed transactions.");
        return;
    }
    
    const batchSize = 50;
    console.log(`Adding ${missingTransCount} transactions to reach ${targetTransactions}...`);

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    let returnsCreated = existingReturns.length;

    for (let i = 0; i < missingTransCount; i+=batchSize) {
        const batchPromises = [];
        for (let j=0; j<batchSize && i+j < missingTransCount; j++) {
            batchPromises.push((async () => {
                const client = randomItem(clients);
                // Average ~2 orders per transaction (skewed towards 1-2)
                const numOrders = Math.random() > 0.8 ? randomInt(3, 5) : randomInt(1, 2);
                const orderIds = [];
                let calculatedTotal = 0;
                
                const status = randomItem(TRANSACTION_STATUSES) as any;
                const discount = randomInt(0, 10);
                
                // Distribute dates over last 6 months
                const date = randomDate(sixMonthsAgo, now);
                const isRecent = new Date(date) > threeMonthsAgo;

                // 1. Create Transaction Shell
                const transactionId = await ctx.db.insert("transactions", {
                    clientId: client._id,
                    status,
                    totalPrice: 0, 
                    discount,
                    orderId: [],
                    date: date
                });
                
                // 2. Create Orders
                for (let k=0; k<numOrders; k++) {
                    const product = randomItem(products);
                    const quantity = randomInt(1, 5);
                    const price = product.price || 0;

                    const orderId = await ctx.db.insert("orders", {
                        transactionId,
                        productId: product._id,
                        quantity
                    });
                    orderIds.push(orderId);
                    calculatedTotal += price * quantity;
                    
                    // Logic to hit ~targetReturns in last 3 months
                    // Only add if transaction is recent and we haven't hit the target
                    if (isRecent && returnsCreated < targetReturns) {
                        // Increase probability if we are far from target
                        const prob = (targetReturns - returnsCreated) / (missingTransCount - i);
                        if (Math.random() < Math.max(prob, 0.1)) {
                           await ctx.db.insert("returns", {
                                orderId,
                                reason: randomItem(RETURN_REASONS) as any,
                                description: "Automated test return"
                            });
                            returnsCreated++;
                        }
                    }
                }
                
                // 3. Update Transaction with total and order IDs
                const finalPrice = Math.max(0, calculatedTotal - discount);
                await ctx.db.patch(transactionId, {
                    orderId: orderIds,
                    totalPrice: parseFloat(finalPrice.toFixed(2))
                });
            })());
        }
        await Promise.all(batchPromises);
    }
    console.log(`Seeding complete. Total transactions: ${targetTransactions}. Total returns: ${returnsCreated}`);
}
