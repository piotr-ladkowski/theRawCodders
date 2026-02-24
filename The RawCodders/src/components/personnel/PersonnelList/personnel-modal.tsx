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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { usePersonnelContext } from "./personnel-context";

export function PersonnelModal() {
  const { selectedPersonnel, setSelectedPersonnel, editPersonnelModalState, setEditPersonnelModalState, setModalObserver } = usePersonnelContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const [role, setRole] = useState<string>("Rescuer");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const createPersonnel = useMutation(api.personnel.insertPersonnel);
  const updatePersonnel = useMutation(api.personnel.updatePersonnel);

  function scheduleClearSelectedPersonnel() {
    setRole("Rescuer");
    setIsAvailable(true);
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedPersonnel(undefined);
    }, 200);
  }

  useEffect(() => {
    if (selectedPersonnel) {
      setRole(selectedPersonnel.role);
      setIsAvailable(selectedPersonnel.isAvailable);
    }
  }, [selectedPersonnel]);

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

    const certificationsRaw = (formData.get("certifications") as string) || "";
    const certifications = certificationsRaw
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const commonData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role,
      certifications,
      baseStation: formData.get("baseStation") as string,
      isAvailable,
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
              <DialogTitle>{selectedPersonnel ? "Edit" : "Add"} personnel</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="personnel-name">Name</Label>
                <Input id="personnel-name" name="name" defaultValue={selectedPersonnel?.name} />
              </Field>
              <Field>
                <Label htmlFor="personnel-email">E-mail</Label>
                <Input id="personnel-email" name="email" defaultValue={selectedPersonnel?.email} />
              </Field>
              <Field>
                <Label htmlFor="personnel-phone">Phone</Label>
                <Input id="personnel-phone" name="phone" defaultValue={selectedPersonnel?.phone} />
              </Field>
              <Field>
                <Label htmlFor="personnel-role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="personnel-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Rescuer">Rescuer</SelectItem>
                      <SelectItem value="Medic">Medic</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                      <SelectItem value="K9 Handler">K9 Handler</SelectItem>
                      <SelectItem value="Technical Specialist">Technical Specialist</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="personnel-certs">Certifications (comma-separated)</Label>
                <Input id="personnel-certs" name="certifications" defaultValue={selectedPersonnel?.certifications?.join(", ")} />
              </Field>
              <Field>
                <Label htmlFor="personnel-base">Base Station</Label>
                <Input id="personnel-base" name="baseStation" defaultValue={selectedPersonnel?.baseStation} />
              </Field>
              <Field>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="personnel-available"
                    checked={isAvailable}
                    onCheckedChange={(checked) => setIsAvailable(checked === true)}
                  />
                  <Label htmlFor="personnel-available">Available</Label>
                </div>
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
