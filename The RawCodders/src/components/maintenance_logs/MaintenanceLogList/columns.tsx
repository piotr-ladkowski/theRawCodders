"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";

export type TMaintenanceLog = Doc<"maintenance_logs"> & {
  equipmentName?: string;
};

export const columns: ColumnDef<TMaintenanceLog>[] = [
  {
    accessorKey: "equipmentName",
    header: "Equipment"
  },
  {
    accessorKey: "issueType",
    header: "Issue Type"
  },
  {
    accessorKey: "description",
    header: "Description"
  },
  {
    accessorKey: "logDate",
    header: "Log Date"
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]
