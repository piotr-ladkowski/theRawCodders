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
import { useReturnsContext } from "./returns-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function ReturnModal() {
  const { selectedReturn, setSelectedReturn, editReturnModalState, setEditReturnModalState, setModalObserver } = useReturnsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createReturn = useMutation(api.returns.insertReturn);
  const updateReturn = useMutation(api.returns.updateReturn);

  function scheduleClearSelectedReturn() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    // Delay to allow the close animation to finish.
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedReturn(undefined);
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

    // Rzutowanie na poprawny typ unii
    const reason = formData.get("reason") as "Product not received" | "Discrepancy with the description" | "Faulty product" | "Other";
    const description = formData.get("description") as string;

    try {
      if (selectedReturn?._id) {
        await updateReturn({
          returnId: selectedReturn._id,
          reason: reason,
          description: description
        });
      } else {
        const orderId = formData.get("orderId") as Id<"orders">;
        
        await createReturn({
          orderId,
          reason,
          description
        });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setModalObserver((prev) => (prev + 1) % 1000);
      setEditReturnModalState(false); // Close the modal on success
      scheduleClearSelectedReturn();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editReturnModalState}
      onOpenChange={(open) => {
        setEditReturnModalState(open);
        if (!open) {
          scheduleClearSelectedReturn();
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
              <DialogTitle>{selectedReturn ? "Edit" : "Add"} Return</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              {!selectedReturn && (
                 <Field>
                   <Label htmlFor="orderId">Order ID</Label>
                   <Input id="orderId" name="orderId" placeholder="Insert Order ID..." required />
                 </Field>
              )}
              
              <Field>
                <Label htmlFor="reason">Reason</Label>
                <Select name="reason" defaultValue={selectedReturn?.reason || "Other"} required>
                  <SelectTrigger id="reason" className="w-full">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product not received">Product not received</SelectItem>
                    <SelectItem value="Discrepancy with the description">Discrepancy with the description</SelectItem>
                    <SelectItem value="Faulty product">Faulty product</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={selectedReturn?.description} required />
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