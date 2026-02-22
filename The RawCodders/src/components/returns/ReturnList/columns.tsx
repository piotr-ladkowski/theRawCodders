"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TReturn = Doc<"returns">;


export const columns: ColumnDef<TReturn>[] = [
  {
    accessorKey: "orderId",
    header: "Order Id"
  },
  {
    accessorKey: "reason",
    header: "Reason"
  },
  {
    accessorKey: "description",
    header: "Description"
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]