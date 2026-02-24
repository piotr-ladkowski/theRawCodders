"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc, Id } from "../../../../convex/_generated/dataModel";

export type TIncident = Doc<"incidents"> & {
  _id: Id<"incidents">;
};

export const columns: ColumnDef<TIncident>[] = [
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "severityLevel",
    header: "Severity",
  },
  {
    accessorKey: "gpsCoordinates",
    header: "GPS Coordinates",
    cell: ({ row }) => {
      const coords = row.original.gpsCoordinates;
      if (!coords) return "—";
      return `${coords.latitude}, ${coords.longitude}`;
    },
  },
  {
    accessorKey: "weatherConditions",
    header: "Weather",
    cell: ({ row }) => {
      return row.original.weatherConditions ?? "—";
    },
  },
  {
    accessorKey: "reportedDate",
    header: "Reported Date",
    cell: ({ row }) => {
      const date = row.getValue("reportedDate");
      return date ? new Date(date as string).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "action",
    header: "Actions",
  },
]
