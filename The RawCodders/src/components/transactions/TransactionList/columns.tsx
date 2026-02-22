"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TTransaction = Doc<"transactions">;

export const columns: ColumnDef<TTransaction>[] = [
  {
    accessorKey: "clientId",
    header: "Client id"
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price"
  },
  {
    accessorKey: "discount",
    header: "Discount"
  },
  {
    accessorKey: "orderId",
    header: "Order Id"
  }
]