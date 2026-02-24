import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useMaintenanceLogsContext } from "./maintenance-logs-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function MaintenanceLogModal() {
  const { selectedMaintenanceLog, setSelectedMaintenanceLog, editMaintenanceLogModalState, setEditMaintenanceLogModalState, setModalObserver } = useMaintenanceLogsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createMaintenanceLog = useMutation(api.maintenance_logs.insertMaintenanceLog);
  const updateMaintenanceLog = useMutation(api.maintenance_logs.updateMaintenanceLog);

  function scheduleClearSelectedMaintenanceLog() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedMaintenanceLog(undefined);
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (clearSelectedTimeoutRef.current !== null) {
        window.clearTimeout(clearSelectedTimeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const equipmentId = formData.get("equipmentId") as Id<"equipment">;
    const issueType = formData.get("issueType") as string;
    const description = formData.get("description") as string;
    const logDate = formData.get("logDate") as string;

    try {
      if (selectedMaintenanceLog?._id) {
        await updateMaintenanceLog({
          logId: selectedMaintenanceLog._id,
          issueType,
          description,
          logDate,
        });
      } else {
        await createMaintenanceLog({
          equipmentId,
          issueType,
          description,
          logDate,
        });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditMaintenanceLogModalState(false);
      scheduleClearSelectedMaintenanceLog();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editMaintenanceLogModalState}
      onOpenChange={(open) => {
        setEditMaintenanceLogModalState(open);
        if (!open) {
          scheduleClearSelectedMaintenanceLog();
        }
      }}
    >
        <DialogTrigger asChild>
          <Button>
            <IconPlus className="text-white"/>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm ">
          <form onSubmit={(event) => { void handleSubmit(event); }}>
            <DialogHeader className="mb-4">
              <DialogTitle>{selectedMaintenanceLog ? "Edit" : "Add"} Maintenance Log</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="equipmentId">Equipment ID</Label>
                <Input id="equipmentId" name="equipmentId" defaultValue={selectedMaintenanceLog?.equipmentId} placeholder="Insert Equipment ID..." required />
              </Field>

              <Field>
                <Label htmlFor="issueType">Issue Type</Label>
                <Select name="issueType" defaultValue={selectedMaintenanceLog?.issueType || "Wear and Tear"} required>
                  <SelectTrigger id="issueType" className="w-full">
                    <SelectValue placeholder="Select an issue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wear and Tear">Wear and Tear</SelectItem>
                    <SelectItem value="Malfunction">Malfunction</SelectItem>
                    <SelectItem value="Calibration Needed">Calibration Needed</SelectItem>
                    <SelectItem value="Battery Replacement">Battery Replacement</SelectItem>
                    <SelectItem value="Structural Damage">Structural Damage</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={selectedMaintenanceLog?.description} placeholder="Enter description..." required />
              </Field>

              <Field>
                <Label htmlFor="logDate">Log Date</Label>
                <Input id="logDate" name="logDate" type="date" defaultValue={selectedMaintenanceLog?.logDate} required />
              </Field>

            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}
