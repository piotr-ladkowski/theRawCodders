"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

export type TEquipment = {
  _id: Id<"equipment">
  name: string
  category: string
  status: string
  image?: string
  lastInspected: string
}

export const columns: ColumnDef<TEquipment>[] = [
  {
    accessorKey: "_id",
    header: "Id"
  },
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "category",
    header: "Category"
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  {
    accessorKey: "lastInspected",
    header: "Last Inspected"
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
