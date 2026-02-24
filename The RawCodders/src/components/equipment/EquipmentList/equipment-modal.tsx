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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEquipmentContext } from "./equipment-context";

const CATEGORIES = ["Vehicle", "Medical", "Climbing Gear", "Communication", "Shelter", "Navigation"] as const;
const STATUSES = ["Available", "In Use", "Maintenance", "Retired"] as const;

export function EquipmentModal() {
  const { selectedEquipment, setSelectedEquipment, editEquipmentModalState, setEditEquipmentModalState, setModalObserver } = useEquipmentContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const createEquipment = useMutation(api.equipment.insertEquipment);
  const updateEquipment = useMutation(api.equipment.updateEquipment);

  function scheduleClearSelectedEquipment() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedEquipment(undefined);
    }, 200);
  }

  useEffect(() => {
    if (selectedEquipment) {
      setCategory(selectedEquipment.category);
      setStatus(selectedEquipment.status);
    } else {
      setCategory("");
      setStatus("");
    }
  }, [selectedEquipment]);

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
      name: (formData.get("name") as string) || (selectedEquipment?.name ?? ""),
      category: category || (selectedEquipment?.category ?? ""),
      status: status || (selectedEquipment?.status ?? "Available"),
      image: (formData.get("image") as string) || (selectedEquipment?.image ?? ""),
      lastInspected: (formData.get("lastInspected") as string) || (selectedEquipment?.lastInspected ?? new Date().toISOString().split("T")[0]),
    };

    try {
      if (selectedEquipment?._id) {
        await updateEquipment({
          equipmentId: selectedEquipment._id,
          equipment: commonData
        });
      } else {
        await createEquipment({
          equipment: commonData,
        });
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
              <DialogTitle>{selectedEquipment ? "Edit" : "Add"} equipment</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Name</Label>
                <Input id="name-1" name="name" defaultValue={selectedEquipment?.name} />
              </Field>
              <Field>
                <Label htmlFor="category-1">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="status-1">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="image-1">Image URL (optional)</Label>
                <Input id="image-1" name="image" defaultValue={selectedEquipment?.image ?? ""} />
              </Field>
              <Field>
                <Label htmlFor="lastInspected-1">Last Inspected</Label>
                <Input id="lastInspected-1" type="date" name="lastInspected" defaultValue={selectedEquipment?.lastInspected ?? new Date().toISOString().split("T")[0]} />
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
