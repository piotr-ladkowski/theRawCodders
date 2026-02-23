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


// --- Main Mutation ---

export const seed = mutation({
  handler: async (ctx) => {
    // 1. Seed Products
    const products = await seedProducts(ctx, 500);
    
    // 2. Seed Clients
    const clients = await seedClients(ctx, 200);

    // 3. Seed Transactions (Target 1000 transactions, ~2000 orders, ~30 returns in last 3 months)
    await seedTransactionsFull(ctx, clients, products, 1000, 30);

    return "Database seeded successfully (Top-up: 1k transactions, ~2k orders, ~30 returns).";
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
