import { mutation } from "./_generated/server";

export const seedClients = mutation({
  handler: async (ctx) => {
    const clients = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        birthDate: "1990-01-01",
        sex: "Male",
        address: {
          line1: "123 Main St",
          line2: "Apt 4B",
          postCode: "10001",
          city: "New York",
          country: "USA",
        },
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "987-654-3210",
        birthDate: "1985-05-15",
        sex: "Female",
        address: {
          line1: "456 Oak Ave",
          line2: "",
          postCode: "90210",
          city: "Beverly Hills",
          country: "USA",
        },
      },
      {
        name: "Peter Jones",
        email: "peter.jones@example.com",
        phone: "555-555-5555",
        birthDate: "1992-08-20",
        sex: "Male",
        address: {
          line1: "789 Pine Ln",
          line2: "",
          postCode: "60601",
          city: "Chicago",
          country: "USA",
        },
      },
    ];

    for (const client of clients) {
      const existingClient = await ctx.db
        .query("clients")
        .withIndex("by_email", (q) => q.eq("email", client.email))
        .unique();

      if (!existingClient) {
        await ctx.db.insert("clients", client);
      }
    }

    return {
      success: true,
      message: "Database seeded successfully with initial client data.",
    };
  },
});
