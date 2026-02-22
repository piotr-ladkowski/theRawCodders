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
import { useEffect, useRef } from "react"
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useReturnsContext } from "./returns-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function ReturnModal() {
  const { selectedReturn, setSelectedReturn, editReturnModalState, setEditReturnModalState } = useReturnsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createReturn = useMutation(api.returns.insertReturn);
  const updateReturn = useMutation(api.returns.updateReturn);
  const createTransaction = useMutation(api.transactions.insertTransaction);

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


    const commonData = {
      productId: formData.get("productId") as Id<"products">,
      quantity: Number(formData.get("quantity"))
    };

    try {
      if (selectedReturn?._id) {
        await updateReturn({
          ReturnId: selectedReturn._id,
          ...commonData,
        });
      } else {

        const newTransactionId = await createTransaction({
          clientId: "jx7547q51txvpssfavt9bvtwvn81kh59" as Id<"clients">, //TODO
          status: "Returned", // Default status
          discount: 0,       // Default discount
          ReturnId: [],       // Empty array to start
        });

        await createReturn({
          ...commonData,
          transactionId: newTransactionId 
        });
      }
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
              <Field>
                <Label htmlFor="productId-1">Product Id</Label>
                <Input id="productId-1" name="productId" defaultValue={selectedReturn?.productId} />
              </Field>
              <Field>
                <Label htmlFor="quantity-1">Quantity</Label>
                <Input id="quantity-1" name="quantity" defaultValue={selectedReturn?.quantity}/>
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
