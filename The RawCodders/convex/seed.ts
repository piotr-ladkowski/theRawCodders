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

async function seedProducts(ctx: any, count: number) {
  const existing = await ctx.db.query("products").take(1);
  if (existing.length > 0) {
    console.log("Products already seeded. Skipping.");
    return await ctx.db.query("products").collect();
  }

  const products = [];
  for (let i = 0; i < count; i++) {
    products.push(generateProduct());
  }
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Promise.all(batch.map((p) => ctx.db.insert("products", p)));
  }
  
  console.log(`Seeded ${count} products.`);
  return await ctx.db.query("products").collect();
}

async function seedClients(ctx: any, count: number) {
  const existing = await ctx.db.query("clients").take(1);
  if (existing.length > 0) {
    console.log("Clients already seeded. Skipping.");
    return await ctx.db.query("clients").collect();
  }

  const clients = [];
  for (let i = 0; i < count; i++) {
    clients.push(generateClient());
  }

  const batchSize = 50;
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    await Promise.all(batch.map((c) => ctx.db.insert("clients", c)));
  }

  console.log(`Seeded ${count} clients.`);
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
