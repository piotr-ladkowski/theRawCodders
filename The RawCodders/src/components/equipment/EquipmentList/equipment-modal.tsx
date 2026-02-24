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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEquipmentContext } from "./equipment-context";

export function EquipmentModal() {
  const { selectedEquipment, setSelectedEquipment, editEquipmentModalState, setEditEquipmentModalState, setModalObserver } = useEquipmentContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  
  const [status, setStatus] = useState<string>("Available");

  const createEquipment = useMutation(api.equipment.insertEquipment);
  const updateEquipment = useMutation(api.equipment.updateEquipment);

  useEffect(() => {
    if (selectedEquipment) {
      setStatus(selectedEquipment.status);
    } else {
      setStatus("Available");
    }
  }, [selectedEquipment]);

  function scheduleClearSelectedEquipment() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedEquipment(undefined);
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

    const commonData = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      status: status as any,
      lastInspected: (formData.get("lastInspected") as string) || new Date().toISOString().split("T")[0],
    };

    try {
      if (selectedEquipment?._id) {
        await updateEquipment({
          equipmentId: selectedEquipment._id,
          ...commonData,
        });
      } else {
        await createEquipment(commonData);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditEquipmentModalState(false);
      scheduleClearSelectedEquipment();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editEquipmentModalState}
      onOpenChange={(open) => {
        setEditEquipmentModalState(open);
        if (!open) {
          scheduleClearSelectedEquipment();
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
              <DialogTitle>{selectedEquipment ? "Edit" : "Add"} Equipment</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selectedEquipment?.name} required />
              </Field>
              <Field>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Vehicle, Medical, Climbing" defaultValue={selectedEquipment?.category} required />
              </Field>
              <Field>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="In Use">In Use</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="lastInspected">Last Inspected Date</Label>
                <Input 
                  id="lastInspected" 
                  name="lastInspected" 
                  type="date" 
                  defaultValue={selectedEquipment?.lastInspected ? selectedEquipment.lastInspected.split("T")[0] : new Date().toISOString().split("T")[0]} 
                  required 
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>
  )
}