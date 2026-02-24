import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Spinner } from "../ui/spinner";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  ColumnDef, flexRender, getCoreRowModel, useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight, IconPlus } from "@tabler/icons-react"
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation } from "convex/react"

type TMaintenanceLog = Doc<"maintenance_logs"> & { equipmentName?: string };

const columns: ColumnDef<TMaintenanceLog>[] = [
  { accessorKey: "equipmentName", header: "Equipment" },
  { accessorKey: "issueType", header: "Issue Type" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "logDate", header: "Log Date",
    cell: ({ row }) => { const d = row.getValue("logDate"); return d ? new Date(d as string).toLocaleDateString() : "—"; }
  },
];

function MaintenanceModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const createLog = useMutation(api.maintenance_logs.insertMaintenanceLog);
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: -1 });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const equipmentId = fd.get("equipmentId") as Id<"equipment">;
    if (!equipmentId) return;
    try {
      await createLog({
        equipmentId,
        issueType: fd.get("issueType") as string,
        description: fd.get("description") as string,
        logDate: new Date().toISOString(),
      });
      await new Promise(r => setTimeout(r, 500));
      onCreated();
      setOpen(false);
    } catch (err) { console.error(err); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><IconPlus className="text-white" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={(e) => { void handleSubmit(e); }}>
          <DialogHeader className="mb-4"><DialogTitle>Log Maintenance Issue</DialogTitle></DialogHeader>
          <FieldGroup>
            <Field>
              <Label>Equipment</Label>
              <Select name="equipmentId">
                <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                <SelectContent>{equipment?.data.map((eq) => <SelectItem key={eq._id} value={eq._id}>{eq.name} ({eq.category})</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <Label>Issue Type</Label>
              <Select name="issueType" defaultValue="Routine Inspection">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine Inspection">Routine Inspection</SelectItem>
                  <SelectItem value="Damage Repair">Damage Repair</SelectItem>
                  <SelectItem value="Battery/Fuel">Battery/Fuel</SelectItem>
                  <SelectItem value="Calibration">Calibration</SelectItem>
                  <SelectItem value="Wear and Tear">Wear and Tear</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field><Label>Description</Label><Input name="description" placeholder="Describe the issue..." required /></Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Log Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MaintenanceLogs() {
  const logs = useQuery(api.maintenance_logs.listMaintenanceLogs, { offset: 0, limit: 50 });
  const [data, setData] = useState<TMaintenanceLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [docCount, setDocCount] = useState(Number(localStorage.getItem("itemsOnPage") ?? "15"));
  const [tableSize, setTableSize] = useState(0);
  const [observer, setObserver] = useState(0);
  const convex = useConvex();

  useEffect(() => {
    localStorage.setItem("itemsOnPage", String(docCount));
    const getAndSet = async () => {
      const res = await convex.query(api.maintenance_logs.listMaintenanceLogs, { offset: (currentPage - 1) * docCount, limit: docCount });
      setData(res.data as TMaintenanceLog[]);
      setTableSize(res.total);
    };
    void getAndSet();
  }, [currentPage, docCount, observer, convex]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (logs === undefined) return <div className="flex justify-center items-center h-full"><Spinner className="size-12" /></div>;

  return (
    <div className="container mx-auto px-6 py-3">
      <div className="text-2xl flex gap-4 items-center font-bold mb-3">
        <div>Maintenance Logs</div>
        <MaintenanceModal onCreated={() => setObserver(p => (p + 1) % 1000)} />
      </div>
      <div className="flex items-center !justify-between gap-2 my-4">
        <div className="flex flex-row items-center gap-2">
          <Label className="mb-0">Items per page:</Label>
          <Select value={String(docCount)} onValueChange={(v) => { setDocCount(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage < 2}><IconChevronLeft /></Button>
          <div>{`${currentPage} / ${Math.max(Math.ceil(tableSize / docCount), 1)}`}</div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(tableSize / docCount)}><IconChevronRight /></Button>
        </div>
      </div>
      <div className="overflow-hidden text-center rounded-md border">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>{hg.headers.map((h) => (
              <TableHead className="text-center" key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
            ))}</TableRow>
          ))}</TableHeader>
          <TableBody>{table.getRowModel().rows?.length ? table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>{row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}</TableRow>
          )) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>}</TableBody>
        </Table>
      </div>
    </div>
  );
}
