"use client"

import { useState, Dispatch, SetStateAction } from "react"
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
import { Badge } from "@/components/ui/badge"
import { IconDotsVertical, IconChevronLeft, IconChevronRight, IconCertificate } from "@tabler/icons-react"

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePersonnelContext } from "./personnel-context"
import type { TPersonnel } from "./columns"

import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { api } from "../../../../convex/_generated/api"
import { useMutation } from "convex/react"
import { useNavigate } from "react-router-dom"

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
  const { setSelectedPersonnel, setEditPersonnelModalState } = usePersonnelContext()
  const deletePersonnelMutation = useMutation(api.personnel.deletePersonnel)
  const navigate = useNavigate()
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function ActionMenu({obj}: {obj: TPersonnel}) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
              <DropdownMenuItem onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedPersonnel(obj); 
                setEditPersonnelModalState(true);
              }}>
                  Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:!bg-red-400"
                onSelect={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsDeleteDialogOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this personnel member from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() =>{void deletePersonnelMutation({ personnelId: obj._id })}}>Continue</AlertDialogAction>
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

  function RenderObject(value: any, accessorKey: string, personnel: TPersonnel) {
    if (accessorKey === "action")  {
      return <ActionMenu obj={personnel} />
    }
    if (accessorKey === "certifications") {
      const certs = value as string[];
      if (!certs || certs.length === 0) return <span className="text-muted-foreground text-sm">None</span>;
      return (
        <HoverCard openDelay={10} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button variant="ghost"><IconCertificate className="mr-2 h-4 w-4"/> {certs.length}</Button>
          </HoverCardTrigger>
          <HoverCardContent side="left" className="w-48">
            <div className="text-sm space-y-1">
              {certs.map((c, i) => <div key={i}>• {c}</div>)}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
    if (accessorKey === "isAvailable") {
      const isAvailable = value as boolean;
      return (
        <Badge variant={isAvailable ? "default" : "destructive"}>
          {isAvailable ? "Available" : "Unavailable"}
        </Badge>
      );
    }
    return null;
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
                  className="cursor-pointer"
                  onClick={() => {
                    const personnel = row.original as TPersonnel
                    void navigate(`/dashboard/personnel/${personnel._id}`)
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const accessorKey = cell.column.id
                    const value = cell.getValue()

                    return (
                      <TableCell key={cell.id}>
                        {(accessorKey === "action" || accessorKey === "certifications" || accessorKey === "isAvailable")
                          ? RenderObject(value, accessorKey, row.original as TPersonnel)
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
      <PaginationControl />
    </>
  )
}