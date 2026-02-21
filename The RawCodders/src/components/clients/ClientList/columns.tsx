"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

type TAddress = {
    city: string
    country: string
    line1: string
    line2: string
    postCode: string
}

export type TClient = {
  _id: Id<"clients">
  address: TAddress
  birthDate: string
  name: string
  phone: string
  email: string
  sex: string
}

export const columns: ColumnDef<TClient>[] = [
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "email",
    header: "E-mail"
  },
  {
    accessorKey: "sex",
    header: "Gender",
  },
  {
    accessorKey: "phone",
    header: "Phone"
  },
  {
    accessorKey: "address",
    header: "Address"
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]