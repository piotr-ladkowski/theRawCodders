"use Product"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TProduct = {
  _id: Id<"products">
  name: string
  image: string
  price: number
  cost: number
  stock: number
}

export const columns: ColumnDef<TProduct>[] = [
  {
    accessorKey: "_id",
    header: "Id"
  }, // TODO delete ^
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "price",
    header: "Price"
  },
  {
    accessorKey: "cost",
    header: "Cost"
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "image",
    header: "Image"
  },

  {
    accessorKey: "action",
    header: "Actions"
  }
]
