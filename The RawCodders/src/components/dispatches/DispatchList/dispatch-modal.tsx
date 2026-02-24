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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useRef } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useDispatchesContext } from "./dispatches-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function DispatchModal() {
  const { selectedDispatch, setSelectedDispatch, editDispatchModalState, setEditDispatchModalState, setModalObserver  } = useDispatchesContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createDispatch = useMutation(api.dispatches.insertDispatch);
  const updateDispatch = useMutation(api.dispatches.updateDispatch);

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
    const formData = new FormData(event.currentTarget);

    const incidentIdVal = formData.get("incidentId") as string;
    if (!incidentIdVal) {
      return;
    }

    const personnelIdVal = formData.get("personnelId") as string;
    const equipmentIdVal = formData.get("equipmentId") as string;

    const commonData = {
      incidentId: incidentIdVal as Id<"incidents">,
      personnelId: personnelIdVal ? (personnelIdVal as Id<"personnel">) : undefined,
      equipmentId: equipmentIdVal ? (equipmentIdVal as Id<"equipment">) : undefined,
      dispatchTime: formData.get("dispatchTime") as string,
    };

    if (selectedDispatch?._id) {
      await updateDispatch({
        dispatchId: selectedDispatch._id,
        ...commonData,
      });
    } else {
      await createDispatch(commonData);
    }
    // Wait for backend to process before refetching
    await new Promise(resolve => setTimeout(resolve, 500));
    setModalObserver((prev) => (prev + 1) % 1000);
    setEditDispatchModalState(false); 
    scheduleClearSelectedDispatch();
    
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
              <DialogTitle>{selectedDispatch ? "Edit" : "Add"} Dispatch</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="incidentId-1">Incident ID</Label>
                <Input id="incidentId-1" name="incidentId" type="text" defaultValue={selectedDispatch?.incidentId} required/>
              </Field>
              <Field>
                <Label htmlFor="personnelId-1">Personnel ID</Label>
                <Input id="personnelId-1" name="personnelId" type="text" defaultValue={selectedDispatch?.personnelId ?? ""}/>
              </Field>
              <Field>
                <Label htmlFor="equipmentId-1">Equipment ID</Label>
                <Input id="equipmentId-1" name="equipmentId" type="text" defaultValue={selectedDispatch?.equipmentId ?? ""}/>
              </Field>
              <Field>
                <Label htmlFor="dispatchTime-1">Dispatch Time</Label>
                <Input id="dispatchTime-1" name="dispatchTime" type="text" defaultValue={selectedDispatch?.dispatchTime} required/>
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
