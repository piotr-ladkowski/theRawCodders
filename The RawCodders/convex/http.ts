import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/export",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Fetch all operational data for the AI
    const incidents = await ctx.runQuery(api.incidents.listIncidents, { limit: 1000 });
    const personnel = await ctx.runQuery(api.personnel.listPersonnel, { limit: 1000 });
    const equipment = await ctx.runQuery(api.equipment.listEquipment, { limit: 1000 });
    const maintenance_logs = await ctx.runQuery(api.maintenance_logs.listMaintenanceLogs, { limit: 1000 });
    const dispatches = await ctx.runQuery(api.dispatches.listDispatches, { limit: 1000 });

    return new Response(JSON.stringify({
      incidents: incidents.data || incidents, 
      personnel: personnel.data || personnel,
      equipment: equipment.data || equipment,
      maintenance_logs: maintenance_logs.data || maintenance_logs,
      dispatches: dispatches.data || dispatches
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }),
});

export default http;