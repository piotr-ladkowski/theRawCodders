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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUsersContext } from "./users-context";

export function UserModal() {
  const { selectedUser, setSelectedUser, editUserModalState, setEditUserModalState } = useUsersContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);
  const currentUser = useQuery(api.auth.currentUser);
  const [role, setRole] = useState<"admin" | "user" | "manager">("user");

  const updateUser = useMutation(api.users.updateUser);

  function scheduleClearSelectedUser() {
    setRole("user");
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    // Delay to allow the close animation to finish.
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedUser(undefined);
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

    try {
      if (selectedUser?._id) {
        await updateUser({
          userId: selectedUser._id,
          role: role,
        });
      }
      setEditUserModalState(false); // Close the modal on success
      scheduleClearSelectedUser();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  return (
    <Dialog
      open={editUserModalState}
      onOpenChange={(open) => {
        setEditUserModalState(open);
        if (!open) {
          scheduleClearSelectedUser();
        } else {
          setRole(selectedUser?.role ?? currentUser?.role ?? "user");
        }
        
      }}
    >
        <DialogContent className="sm:max-w-sm ">
          <form onSubmit={(event) => { void handleSubmit(event); }}>
            <DialogHeader className="mb-4">
              <DialogTitle>Edit User Role</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label className="text-muted-foreground text-sm">User: {selectedUser?.email}</Label>
              </Field>
              <Field>
                <Label htmlFor="role-1">Role</Label>
                <RadioGroup id="role-1" value={role} onValueChange={(v) => setRole(v as "admin" | "user" | "manager")} className="w-fit">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="user" id="r1" />
                    <Label htmlFor="r1">User</Label>
                  </div>
                
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="manager" id="r2" />
                    <Label htmlFor="r2">Manager</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="admin" id="r3" />
                    <Label htmlFor="r3">Admin</Label>
                  </div>
                </RadioGroup>
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
