/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as clients from "../personnel.js";
import type * as http from "../http.js";
import type * as insights from "../insights.js";
import type * as myFunctions from "../myFunctions.js";
import type * as orders from "../dispatches.js";
import type * as products from "../equipment.js";
import type * as returns from "../maintenance_logs.js";
import type * as seed from "../seed.js";
import type * as transactions from "../incidents.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  clients: typeof clients;
  http: typeof http;
  insights: typeof insights;
  myFunctions: typeof myFunctions;
  orders: typeof orders;
  products: typeof products;
  returns: typeof returns;
  seed: typeof seed;
  transactions: typeof transactions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
