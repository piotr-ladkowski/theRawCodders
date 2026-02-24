"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

export type TPersonnel = {
  _id: Id<"personnel">
  name: string
  email: string
  phone: string
  role: string
  certifications: string[]
  baseStation: string
  isAvailable: boolean
}

export const columns: ColumnDef<TPersonnel>[] = [
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "role",
    header: "Role"
  },
  {
    accessorKey: "baseStation",
    header: "Base Station"
  },
  {
    accessorKey: "phone",
    header: "Phone"
  },
  {
    accessorKey: "certifications",
    header: "Certifications"
  },
  {
    accessorKey: "isAvailable",
    header: "Status"
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]