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
// Add real clients here that you *always* want present. Seeding will upsert by email.
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
}> = [
  // مثال:
  // {
  //   name: "Acme Admin",
  //   email: "admin@acme.com",
  //   phone: "111-222-3333",
  //   birthDate: "1990-01-01",
  //   sex: "Male",
  //   address: { line1: "1 Main St", postCode: "00-001", city: "Warsaw", country: "Poland" },
  // },
];
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
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function generateClient() {
  const first = randomItem(FIRST_NAMES);
  const last = randomItem(LAST_NAMES);
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 1000)}@example.com`,
    phone: `${randomInt(100, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    birthDate: randomDate(new Date(1950, 0, 1), new Date(2005, 0, 1)),
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
  return {
    name: `${randomItem(PRODUCT_ADJECTIVES)} ${randomItem(PRODUCT_NOUNS)} ${randomInt(100, 900)}`,
    price: randomFloat(10, 1000),
    stock: randomInt(0, 500),
    image: "https://placehold.co/200x200", // Placeholder image
  };
}

// --- Seeding Functions ---

async function seedProducts(ctx: any, targetTotal: number) {
  // MERGE-friendly: ensure at least `targetTotal` products exist.
  // We treat product `name` as the unique key for de-duplication.
  const existing = await ctx.db.query("products").collect();
  const existingNames = new Set(existing.map((p: any) => (p?.name ?? "").toLowerCase()).filter(Boolean));

  const missingCount = Math.max(0, targetTotal - existing.length);
  if (missingCount === 0) {
    console.log(`Products already >= ${targetTotal}. Skipping.`);
    return existing;
  }

  const products: any[] = [];
  // Generate products until we have enough *new* names.
  // Hard stop to avoid infinite loops if name space is too small.
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

  if (products.length === 0) {
    console.log("No new unique products could be generated. Skipping.");
    return existing;
  }

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Promise.all(batch.map((p) => ctx.db.insert("products", p)));
  }

  console.log(`Seeded ${products.length} new products (targetTotal=${targetTotal}).`);
  return await ctx.db.query("products").collect();
}


async function seedClients(ctx: any, targetTotal: number) {
  // MERGE-friendly: upsert by email.
  // 1) Ensure REQUIRED_CLIENTS exist (by email).
  // 2) Then generate random clients until total clients >= targetTotal (without duplicating emails).

  const existing = await ctx.db.query("clients").collect();
  const existingByEmail = new Map<string, any>();
  for (const c of existing) {
    const email = (c?.email ?? "").toLowerCase();
    if (email) existingByEmail.set(email, c);
  }

  let inserted = 0;
  let ensured = 0;

  // Helper: insert only if missing
  const ensureClient = async (candidate: any) => {
    const email = (candidate?.email ?? "").toLowerCase();
    if (!email) return false;
    if (existingByEmail.has(email)) return false;

    const id = await ctx.db.insert("clients", candidate);
    existingByEmail.set(email, { _id: id, ...candidate });
    inserted++;
    ensured++;
    return true;
  };

  // 1) Required clients first
  for (const rc of REQUIRED_CLIENTS) {
    const email = (rc.email ?? "").toLowerCase();
    if (!email) continue;
    if (existingByEmail.has(email)) {
      // Optional: merge/patch missing fields (non-destructive).
      // If you want to actively update existing clients, uncomment below.
      // await ctx.db.patch(existingByEmail.get(email)._id, { ...rc });
      continue;
    }
    await ensureClient(rc);
  }

  // 2) Top-up random clients until targetTotal is reached
  const missingCount = Math.max(0, targetTotal - existingByEmail.size);
  if (missingCount === 0) {
    console.log(`Clients already >= ${targetTotal}. Required ensured: ${ensured}.`);
    return await ctx.db.query("clients").collect();
  }

  const hardStop = targetTotal * 50; // avoid infinite loops
  let attempts = 0;
  while (existingByEmail.size < targetTotal && attempts < hardStop) {
    attempts++;
    const c = generateClient();
    const email = (c.email ?? "").toLowerCase();
    if (!email || existingByEmail.has(email)) continue;
    await ensureClient(c);
  }

  console.log(
    `Seeded/ensured ${inserted} new clients (targetTotal=${targetTotal}, requiredEnsured=${ensured}).`
  );
  return await ctx.db.query("clients").collect();
}


// --- Main Mutation ---

export const seed = mutation({
  handler: async (ctx) => {
    // 1. Seed Products (Idempotent: returns existing if found)
    const products = await seedProducts(ctx, 400);
    
    // 2. Seed Clients (Idempotent: returns existing if found)
    const clients = await seedClients(ctx, 100);

    // 3. Seed Transactions (Idempotent: skips if transactions/orders exist)
    await seedTransactionsFull(ctx, clients, products);

    return "Database seeded successfully (idempotent check passed).";
  },
});

async function seedTransactionsFull(ctx: any, clients: any[], products: any[]) {
    // Check all related tables to ensure a clean slate for transactions
    const existingTrans = await ctx.db.query("transactions").take(1);
    const existingOrders = await ctx.db.query("orders").take(1);
    
    if (existingTrans.length > 0 || existingOrders.length > 0) {
        console.log("Transactions or Orders already exist. Skipping transaction seeding.");
        return;
    }
    
    if (clients.length === 0 || products.length === 0) {
        console.log("Missing clients or products. Cannot seed transactions.");
        return;
    }
    
    const numTransactions = 300; 
    const batchSize = 20;

    console.log(`Seeding ~${numTransactions} transactions...`);

    for (let i = 0; i < numTransactions; i+=batchSize) {
        const batchPromises = [];
        for (let j=0; j<batchSize && i+j < numTransactions; j++) {
            batchPromises.push((async () => {
                const client = randomItem(clients);
                const numOrders = randomInt(1, 4);
                const orderIds = [];
                let calculatedTotal = 0;
                
                const status = randomItem(TRANSACTION_STATUSES) as any;
                const discount = randomInt(0, 10);
                
                // 1. Create Transaction Shell
                const transactionId = await ctx.db.insert("transactions", {
                    clientId: client._id,
                    status,
                    totalPrice: 0, 
                    discount,
                    orderId: []
                });
                
                // 2. Create Orders
                for (let k=0; k<numOrders; k++) {
                    const product = randomItem(products);
                    const quantity = randomInt(1, 5);
                    
                    // Safety check for price
                    const price = product.price || 0;

                    const orderId = await ctx.db.insert("orders", {
                        transactionId,
                        productId: product._id,
                        quantity
                    });
                    orderIds.push(orderId);
                    calculatedTotal += price * quantity;
                    
                    // Randomly add return
                    if (Math.random() > 0.9) {
                        await ctx.db.insert("returns", {
                            orderId,
                            reason: randomItem(RETURN_REASONS) as any,
                            description: "Automated return reason"
                        });
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
    console.log("Transactions seeded.");
}
