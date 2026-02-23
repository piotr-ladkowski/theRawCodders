import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireAdminOrManager(
  ctx: QueryCtx | MutationCtx
): Promise<void> {
  const userId = await getAuthUserId(ctx);
  
  if (!userId) {
    throw new Error("Authentication required");
  }

  const user = await ctx.db.get(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  const role = user.role || "user";
  
  if (role !== "admin" && role !== "manager") {
    throw new Error("Access denied. Admin or manager role required.");
  }
}

export async function getUserRole(
  ctx: QueryCtx | MutationCtx
): Promise<"admin" | "manager" | "user" | null> {
  const userId = await getAuthUserId(ctx);
  
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  
  if (!user) {
    return null;
  }

  return user.role || "user";
}
