"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TOrder = {
  _id: Id<"orders">
  productId: string
  quantity: number
}


export const columns: ColumnDef<TOrder>[] = [
  {
    accessorKey: "productId",
    header: "Product id"
  },
  {
    accessorKey: "quantity",
    header: "Quantity"
  },
   {
    accessorKey: "action",
    header: "Actions"
  }
]