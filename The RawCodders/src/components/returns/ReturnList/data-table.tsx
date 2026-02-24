"use Return"

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

import { IconAddressBook, IconDotsVertical, IconChevronRight, IconChevronLeft } from "@tabler/icons-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useReturnsContext } from "./returns-context"
import type { TReturn } from "./columns"

import { api } from "../../../../convex/_generated/api"
import { useMutation } from "convex/react"
import { useState, Dispatch, SetStateAction } from "react"

import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TPageSettings = {
  currentPage: number,
  docCount: number,
  setCurrentPage: Dispatch<SetStateAction<number>>,
  setDocCount: Dispatch<SetStateAction<number>>,
  tableSize: number
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSettings: TPageSettings
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSettings
}: DataTableProps<TData, TValue>) {
  const { setSelectedReturn, setEditReturnModalState } = useReturnsContext()
  const deleteReturnMutation = useMutation(api.returns.deleteReturn)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  function ActionMenu({obj}: {obj: TReturn}) {
    return (
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <IconDotsVertical className="text-white"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => { setSelectedReturn(obj); setEditReturnModalState(true);}}>
                  Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:!bg-red-400"
                onSelect={(event) => {
                  event.preventDefault()
                  setIsDeleteDialogOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this return from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() =>{void deleteReturnMutation({ returnId: obj._id })}}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

  }

  function PaginationControl({className}: {className?: string}) {
    return (
      <div className={"flex items-center justify-end space-x-2 py-4 " + className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => pageSettings.setCurrentPage(pageSettings.currentPage - 1)}
          disabled={pageSettings.currentPage < 2}
        >
          <IconChevronLeft />
        </Button>
        <div>
          {`${pageSettings.currentPage} / ${Math.max(Math.floor(pageSettings.tableSize/pageSettings.docCount) + Number(!!(pageSettings.tableSize%pageSettings.docCount)), 1)}`}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => pageSettings.setCurrentPage(pageSettings.currentPage + 1)}
          disabled={ pageSettings.currentPage >= Math.floor(pageSettings.tableSize/pageSettings.docCount) + Number(!!(pageSettings.tableSize%pageSettings.docCount)) }
        >
          <IconChevronRight />
        </Button>
      </div>
    )
  }


  function RenderObject(object: object, accessorKey: string, Return: TReturn) {
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
       <ActionMenu obj={Return} />
      )
    }
    
  }

  return (
    <>
      <div className="flex items-center !justify-between gap-2 my-4">
        <div className="flex flex-row items-center gap-2">
          <Label className="mb-0">Items per page:</Label>
          <Select
            value={String(pageSettings.docCount)}
            onValueChange={(value) => {pageSettings.setDocCount(Number(value)); pageSettings.setCurrentPage(1)}}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup >
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="70">70</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <PaginationControl className="flex flex-row justify-end" />
      </div>
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
                          ?  RenderObject(cell.getValue() as object, accessorKey, row.original as TReturn)
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
      <PaginationControl/>
    </>
  )
}