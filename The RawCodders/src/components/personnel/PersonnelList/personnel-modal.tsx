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
import { IconPlus } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { usePersonnelContext } from "./personnel-context";

export function PersonnelModal() {
  const { selectedPersonnel, setSelectedPersonnel, editPersonnelModalState, setEditPersonnelModalState, setModalObserver } = usePersonnelContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const createPersonnel = useMutation(api.personnel.insertPersonnel);
  const updatePersonnel = useMutation(api.personnel.updatePersonnel);

  useEffect(() => {
    if (selectedPersonnel) {
      setIsAvailable(selectedPersonnel.isAvailable);
    } else {
      setIsAvailable(true);
    }
  }, [selectedPersonnel]);

  function scheduleClearSelectedPersonnel() {
    setIsAvailable(true);
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedPersonnel(undefined);
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

    const certString = formData.get("certifications") as string;
    const certifications = certString.split(",").map(c => c.trim()).filter(c => c.length > 0);

    const commonData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      baseStation: formData.get("baseStation") as string,
      certifications: certifications,
      isAvailable: isAvailable,
    };

    try {
      if (selectedPersonnel?._id) {
        await updatePersonnel({
          personnelId: selectedPersonnel._id,
          ...commonData,
        });
      } else {
        await createPersonnel(commonData);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditPersonnelModalState(false);
      scheduleClearSelectedPersonnel();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editPersonnelModalState}
      onOpenChange={(open) => {
        setEditPersonnelModalState(open);
        if (!open) {
          scheduleClearSelectedPersonnel();
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
              <DialogTitle>{selectedPersonnel ? "Edit" : "Add"} Personnel</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selectedPersonnel?.name} required />
              </Field>
              <Field>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={selectedPersonnel?.email} required/>
              </Field>
              <Field>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={selectedPersonnel?.phone} required />
              </Field>
              <Field>
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" placeholder="e.g. Rescuer, Medic, Pilot" defaultValue={selectedPersonnel?.role} required />
              </Field>
              <Field>
                <Label htmlFor="baseStation">Base Station</Label>
                <Input id="baseStation" name="baseStation" placeholder="e.g. Morskie Oko Station" defaultValue={selectedPersonnel?.baseStation} required />
              </Field>
              <Field>
                <Label htmlFor="certifications">Certifications (comma separated)</Label>
                <Input id="certifications" name="certifications" placeholder="CPR, Avalanche L2" defaultValue={selectedPersonnel?.certifications?.join(", ")} />
              </Field>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="isAvailable" 
                  checked={isAvailable} 
                  onCheckedChange={(checked) => setIsAvailable(checked === true)}
                />
                <Label htmlFor="isAvailable">Currently Available for Dispatch</Label>
              </div>
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