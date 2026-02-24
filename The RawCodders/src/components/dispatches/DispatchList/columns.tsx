"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

export type TDispatch = {
  _id: Id<"dispatches">
  incidentId: Id<"incidents">
  personnelId?: Id<"personnel">
  equipmentId?: Id<"equipment">
  dispatchTime: string
}


export const columns: ColumnDef<TDispatch>[] = [
  {
    accessorKey: "incidentId",
    header: "Incident"
  },
  {
    accessorKey: "personnelId",
    header: "Personnel"
  },
  {
    accessorKey: "equipmentId",
    header: "Equipment"
  },
  {
    accessorKey: "dispatchTime",
    header: "Dispatch Time"
  },
   {
    accessorKey: "action",
    header: "Actions"
  }
]
