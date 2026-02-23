"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TTransaction = Doc<"transactions"> & {
  clientName?: string;
};

export const columns: ColumnDef<TTransaction>[] = [
  {
    accessorKey: "clientName",
    header: "Client"
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return date ? new Date(date).toLocaleDateString() : "—";
    }
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
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]