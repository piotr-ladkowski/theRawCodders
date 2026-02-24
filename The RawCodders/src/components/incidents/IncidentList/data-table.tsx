"use client"

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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconDotsVertical, IconChevronRight, IconChevronLeft } from "@tabler/icons-react"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIncidentsContext } from "./incidents-context"
import type { TIncident } from "./columns"
import { api } from "../../../../convex/_generated/api"
import { useMutation } from "convex/react"
import { useState, Dispatch, SetStateAction } from "react"

type TPageSettings = {
  currentPage: number,
  docCount: number,
  setCurrentPage: Dispatch<SetStateAction<number>>,
  setDocCount: Dispatch<SetStateAction<number>>,
  tableSize: number
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  pageSettings: TPageSettings 
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSettings
}: DataTableProps<TData, TValue>) {
  const { setSelectedIncident, setEditIncidentModalState } = useIncidentsContext()
  const deleteIncidentMutation = useMutation(api.incidents.deleteIncident)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function ActionMenu({obj}: {obj: TIncident}) {
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
              <DropdownMenuItem onClick={() => { setSelectedIncident(obj); setEditIncidentModalState(true);}}>
                  Update Status
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:!bg-red-400"
                onSelect={(event) => {
                  event.preventDefault()
                  setIsDeleteDialogOpen(true)
                }}
              >
                Delete Log
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this incident record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() =>{void deleteIncidentMutation({ incidentId: obj._id })}}>Continue</AlertDialogAction>
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

  function RenderObject(value: any, accessorKey: string, incident: TIncident) {
    if(accessorKey === "action")  {
      return <ActionMenu obj={incident} />
    }
    if (accessorKey === "status") {
      const st = value as string;
      return (
        <Badge variant={st === "active" ? "destructive" : st === "standby" ? "secondary" : "default"}>
          {st.toUpperCase()}
        </Badge>
      )
    }
    if (accessorKey === "severityLevel") {
      const num = value as number;
      // High severity stands out
      return <span className={`font-bold ${num >= 4 ? "text-red-500" : ""}`}>{num}</span>;
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
                <SelectGroup>
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
                        {cell.getValue() !== null && (accessorKey === "action" || accessorKey === "status" || accessorKey === "severityLevel")
                          ?  RenderObject(cell.getValue(), accessorKey, row.original as TIncident)
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