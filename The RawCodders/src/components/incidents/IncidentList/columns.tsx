"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";

export type TIncident = Doc<"incidents">;

export const columns: ColumnDef<TIncident>[] = [
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "severityLevel",
    header: "Severity"
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  {
    accessorKey: "gpsCoordinates",
    header: "Location (Lat, Lng)",
    cell: ({ row }) => {
      const coords: any = row.getValue("gpsCoordinates");
      return coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : "—";
    }
  },
  {
    accessorKey: "weatherConditions",
    header: "Weather"
  },
  {
    accessorKey: "reportedDate",
    header: "Reported At",
    cell: ({ row }) => {
      const date = row.getValue("reportedDate");
      return date ? new Date(date as string).toLocaleString() : "—";
    }
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]