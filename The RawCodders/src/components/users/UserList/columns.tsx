"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Id } from "../../../../convex/_generated/dataModel"

export type TUser = {
  _id: Id<"users">
  name?: string
  email?: string
  phone?: string
  role?: "admin" | "user" | "manager"
  emailVerificationTime?: number
  phoneVerificationTime?: number
  isAnonymous?: boolean
}

export const columns: ColumnDef<TUser>[] = [
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => row.original.email || "-"
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role || "user";
      const colors = {
        admin: "text-red-400",
        manager: "text-blue-400",
        user: "text-gray-400"
      };
      return <span className={colors[role]}>{role}</span>;
    }
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]
