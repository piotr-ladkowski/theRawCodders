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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconDotsVertical, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEquipmentContext } from "./equipment-context"
import type { TEquipment } from "./columns"
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
  data: TData[]
  pageSettings: TPageSettings
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSettings
}: DataTableProps<TData, TValue>) {
  const { setSelectedEquipment, setEditEquipmentModalState } = useEquipmentContext()
  const deleteEquipmentMutation = useMutation(api.equipment.deleteEquipment)
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function ActionMenu({obj}: {obj: TEquipment}) {
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
              <DropdownMenuItem onClick={() => { setSelectedEquipment(obj); setEditEquipmentModalState(true);}}>
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
              This action cannot be undone. This will permanently remove this piece of equipment from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() =>{void deleteEquipmentMutation({ equipmentId: obj._id })}}>Continue</AlertDialogAction>
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

  function RenderObject(value: any, accessorKey: string, equipment: TEquipment) {
    if(accessorKey === "action")  {
      return <ActionMenu obj={equipment} />
    }
    if(accessorKey === "status") {
      const statusValue = value as string;
      let variant: "default" | "destructive" | "outline" | "secondary" = "default";
      if (statusValue === "In Use") variant = "secondary";
      if (statusValue === "Maintenance") variant = "destructive";
      if (statusValue === "Retired") variant = "outline";
      
      return <Badge variant={variant}>{statusValue}</Badge>;
    }
    if(accessorKey === "lastInspected") {
      return <span>{String(value).split("T")[0]}</span>;
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
                >
                  {row.getVisibleCells().map((cell) => {
                    const accessorKey = cell.column.id;
                    const value = cell.getValue();

                    return (
                      <TableCell key={cell.id}>
                        {value !== null && (accessorKey === "action" || accessorKey === "status" || accessorKey === "lastInspected")
                          ? RenderObject(value, accessorKey, row.original as TEquipment)
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