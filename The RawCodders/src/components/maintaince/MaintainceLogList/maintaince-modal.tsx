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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useMaintenanceContext } from "./maintaince-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function MaintenanceModal() {
  const { selectedLog, setSelectedLog, editLogModalState, setEditLogModalState, setModalObserver } = useMaintenanceContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  // Fetch available equipment
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: -1 });

  const createLog = useMutation(api.maintenance_logs.insertMaintenanceLog);
  // Optional: Add update logic if your backend has updateMaintenanceLog
  // const updateLog = useMutation(api.maintenance_logs.updateMaintenanceLog);

  function scheduleClearSelectedLog() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedLog(undefined);
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

    const issueType = formData.get("issueType") as string;
    const description = formData.get("description") as string;

    try {
      if (selectedLog?._id) {
        // If you implemented update, call it here
        // await updateLog({ logId: selectedLog._id, issueType, description });
      } else {
        const equipmentId = formData.get("equipmentId") as Id<"equipment">;
        
        await createLog({
          equipmentId,
          issueType,
          description,
          logDate: new Date().toISOString()
        });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditLogModalState(false);
      scheduleClearSelectedLog();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editLogModalState}
      onOpenChange={(open) => {
        setEditLogModalState(open);
        if (!open) {
          scheduleClearSelectedLog();
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
              <DialogTitle>{selectedLog ? "Edit" : "New"} Maintenance Log</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              {!selectedLog && (
                 <Field>
                   <Label htmlFor="equipmentId">Equipment</Label>
                   <Select name="equipmentId" required disabled={equipment === undefined}>
                    <SelectTrigger id="equipmentId" className="w-full">
                      <SelectValue placeholder="Select Equipment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment?.data?.map((eq: any) => (
                        <SelectItem key={eq._id} value={eq._id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 </Field>
              )}
              
              <Field>
                <Label htmlFor="issueType">Issue Type</Label>
                <Select name="issueType" defaultValue={selectedLog?.issueType || "Damage"} required>
                  <SelectTrigger id="issueType" className="w-full">
                    <SelectValue placeholder="Select an issue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damage">Damage / Broken</SelectItem>
                    <SelectItem value="Routine Inspection">Routine Inspection</SelectItem>
                    <SelectItem value="Missing Part">Missing Part</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={selectedLog?.description} required />
              </Field>

            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}