"use Order"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { Button } from "@/components/ui/button"

import { IconAddressBook, IconDotsVertical } from "@tabler/icons-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOrdersContext } from "./orders-context"
import type { TOrder } from "./columns"

import { api } from "../../../../convex/_generated/api"
import { useMutation } from "convex/react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { setSelectedOrder, setEditOrderModalState } = useOrdersContext()
  const deleteOrderMutation = useMutation(api.orders.deleteOrder)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function ActionMenu({obj}: {obj: TOrder}) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <IconDotsVertical className="text-white"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => { setSelectedOrder(obj); setEditOrderModalState(true);}}>
                Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>{void deleteOrderMutation({ orderId: obj._id })}}
              className="hover:!bg-red-400"
            >
                Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )

  }


  function RenderObject(object: object, accessorKey: string, Order: TOrder) {
    const obj = object as Record<string, any>;

    
    // Check if this is an address object
    if (accessorKey === "address") {
      return (
        <HoverCard openDelay={10} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button variant="ghost"><IconAddressBook /></Button>
          </HoverCardTrigger>
          <HoverCardContent side="left" className="w-48">
            <div className="text-sm space-y-1">
              <div>{obj.line1}</div>
              <div>{obj.line2}</div>
              <div>{obj.postCode}, {obj.city}</div>
              <div>{obj.country}</div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
    else if(accessorKey === "action")  {
      return (
       <ActionMenu obj={Order} />
      )
    }
    
  }





  return (
    <div className="overflow-hidden text-center rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead className="text-center" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  const accessorKey = cell.column.id

                  return (
                    <TableCell key={cell.id}>
                      {cell.getValue() !== null && (accessorKey === "action" || accessorKey === "address")
                        ?  RenderObject(cell.getValue() as object, accessorKey, row.original as TOrder)
                        : flexRender(cell.column.columnDef.cell, cell.getContext()) 
                       }
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}