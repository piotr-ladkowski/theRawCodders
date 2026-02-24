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
import type * as dispatches from "../dispatches.js";
import type * as equipment from "../equipment.js";
import type * as http from "../http.js";
import type * as incidents from "../incidents.js";
import type * as insights from "../insights.js";
import type * as maintenance_logs from "../maintenance_logs.js";
import type * as myFunctions from "../myFunctions.js";
import type * as personnel from "../personnel.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dispatches: typeof dispatches;
  equipment: typeof equipment;
  http: typeof http;
  incidents: typeof incidents;
  insights: typeof insights;
  maintenance_logs: typeof maintenance_logs;
  myFunctions: typeof myFunctions;
  personnel: typeof personnel;
  seed: typeof seed;
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
