import { mutation } from "./_generated/server";

export const migrateReturnsReason = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Pobierz wszystkie rekordy z tabeli "returns"
    const allReturns = await ctx.db.query("returns").collect();
    let migratedCount = 0;

    // 2. Przeiteruj przez każdy rekord i zaktualizuj pole "reason"
    for (const returnRecord of allReturns) {
      await ctx.db.patch(returnRecord._id, { 
        reason: "Other" 
      });
      migratedCount++;
    }

    // Zwróć podsumowanie
    return `Migracja zakończona. Zaktualizowano ${migratedCount} rekordów w tabeli returns.`;
  },
});
