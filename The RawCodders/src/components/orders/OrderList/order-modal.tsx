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
import { useOrdersContext } from "./orders-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function OrderModal() {
  const { selectedOrder, setSelectedOrder, editOrderModalState, setEditOrderModalState } = useOrdersContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createOrder = useMutation(api.orders.insertOrder);
  const updateOrder = useMutation(api.orders.updateOrder);
  const createTransaction = useMutation(api.transactions.insertTransaction);

  function scheduleClearSelectedOrder() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    // Delay to allow the close animation to finish.
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedOrder(undefined);
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
      if (selectedOrder?._id) {
        await updateOrder({
          orderId: selectedOrder._id,
          ...commonData,
        });
      } else {

        const newTransactionId = await createTransaction({
          clientId: "jx7547q51txvpssfavt9bvtwvn81kh59" as Id<"clients">, //TODO
          status: "ordered", // Default status
          discount: 0,       // Default discount
          orderId: [],       // Empty array to start
        });

        await createOrder({
          ...commonData,
          transactionId: newTransactionId 
        });
      }
      setEditOrderModalState(false); // Close the modal on success
      scheduleClearSelectedOrder();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editOrderModalState}
      onOpenChange={(open) => {
        setEditOrderModalState(open);
        if (!open) {
          scheduleClearSelectedOrder();
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
              <DialogTitle>{selectedOrder ? "Edit" : "Add"} Order</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="productId-1">Product Id</Label>
                <Input id="productId-1" name="productId" defaultValue={selectedOrder?.productId} />
              </Field>
              <Field>
                <Label htmlFor="quantity-1">Quantity</Label>
                <Input id="quantity-1" name="quantity" defaultValue={selectedOrder?.quantity}/>
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
