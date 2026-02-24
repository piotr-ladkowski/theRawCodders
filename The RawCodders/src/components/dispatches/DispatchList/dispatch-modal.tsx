import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useDispatchesContext } from "./dispatches-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function DispatchModal() {
  const { selectedDispatch, setSelectedDispatch, editDispatchModalState, setEditDispatchModalState, setModalObserver  } = useDispatchesContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createDispatch = useMutation(api.dispatches.insertDispatch);
  
  // Fetch data to populate the dropdowns
  const incidents = useQuery(api.incidents.listIncidents, { offset: 0, limit: -1 });
  const personnel = useQuery(api.personnel.listPersonnel, { offset: 0, limit: -1 });
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: -1 });

  // State
  const [selectedIncident, setSelectedIncident] = useState<string | undefined>(selectedDispatch?.incidentId);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string | undefined>(selectedDispatch?.personnelId);
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>(selectedDispatch?.equipmentId);

  useEffect(() => {
    if (selectedDispatch) {
      setSelectedIncident(selectedDispatch.incidentId);
      setSelectedPersonnel(selectedDispatch.personnelId);
      setSelectedEquipment(selectedDispatch.equipmentId);
    } else {
      setSelectedIncident(undefined);
      setSelectedPersonnel(undefined);
      setSelectedEquipment(undefined);
    }
  }, [selectedDispatch]);

  function scheduleClearSelectedDispatch() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedDispatch(undefined);
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

    if (!selectedIncident) return;

    try {
      await createDispatch({
        incidentId: selectedIncident as Id<"incidents">,
        personnelId: selectedPersonnel ? (selectedPersonnel as Id<"personnel">) : undefined,
        equipmentId: selectedEquipment ? (selectedEquipment as Id<"equipment">) : undefined,
        dispatchTime: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditDispatchModalState(false); 
      scheduleClearSelectedDispatch();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editDispatchModalState}
      onOpenChange={(open) => {
        setEditDispatchModalState(open);
        if (!open) {
          scheduleClearSelectedDispatch();
        }
      }}
    >
        <DialogContent className="sm:max-w-sm ">
          <form onSubmit={(event) => { void handleSubmit(event); }}>
            <DialogHeader className="mb-4">
              <DialogTitle>New Dispatch</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="incidentId">Active Incident</Label>
                <Select value={selectedIncident} onValueChange={setSelectedIncident} disabled={!!selectedDispatch}>
                  <SelectTrigger id="incidentId">
                    <SelectValue placeholder="Select Incident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {incidents?.data?.filter((inc: any) => inc.status !== "resolved").map((inc: any) => (
                      <SelectItem key={inc._id} value={inc._id}>
                        {inc.type} (Severity: {inc.severityLevel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="personnelId">Assign Personnel</Label>
                <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                  <SelectTrigger id="personnelId">
                    <SelectValue placeholder="Select Available Personnel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel?.data?.filter((p: any) => p.isAvailable).map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} - {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="equipmentId">Assign Equipment</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger id="equipmentId">
                    <SelectValue placeholder="Select Available Equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment?.data?.filter((eq: any) => eq.status === "Available").map((eq: any) => (
                      <SelectItem key={eq._id} value={eq._id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!selectedIncident || (!selectedPersonnel && !selectedEquipment)}>Dispatch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}