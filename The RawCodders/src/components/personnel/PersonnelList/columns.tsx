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
    accessorKey: "email",
    header: "E-mail"
  },
  {
    accessorKey: "phone",
    header: "Phone"
  },
  {
    accessorKey: "role",
    header: "Role"
  },
  {
    accessorKey: "certifications",
    header: "Certifications"
  },
  {
    accessorKey: "baseStation",
    header: "Base Station"
  },
  {
    accessorKey: "isAvailable",
    header: "Availability"
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]
