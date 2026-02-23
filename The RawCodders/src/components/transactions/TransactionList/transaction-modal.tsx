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
import { useMutation, useQuery } from "convex/react"; 
import { api } from "../../../../convex/_generated/api";
import { useTransactionsContext } from "./transactions-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function TransactionModal() {
  const { selectedTransaction, setSelectedTransaction, editTransactionModalState, setEditTransactionModalState } = useTransactionsContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const clients = useQuery(api.clients.listClients, { offset: 0, limit: 50 }); 

  const createTransaction = useMutation(api.transactions.insertTransaction);
  const updateTransaction = useMutation(api.transactions.updateTransaction);

  function scheduleClearSelectedTransaction() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
    clearSelectedTimeoutRef.current = window.setTimeout(() => {
      setSelectedTransaction(undefined);
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
      clientId: formData.get("clientId") as Id<"clients">,
      status: formData.get("status") as "pending" | "completed" | "cancelled",
      discount: Number(formData.get("discount"))
    };

    try {
      if (selectedTransaction?._id) {
        await updateTransaction({
          transactionId: selectedTransaction._id,
          ...commonData,
        });
      } else {
        await createTransaction({
          clientId: commonData.clientId,
          status: commonData.status, 
          discount: commonData.discount,       
          orderId: [],       
          date: new Date().toISOString()
        });
      }
      setEditTransactionModalState(false); 
      scheduleClearSelectedTransaction();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }
  
  return (
    <Dialog
      open={editTransactionModalState}
      onOpenChange={(open) => {
        setEditTransactionModalState(open);
        if (!open) {
          scheduleClearSelectedTransaction();
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
              <DialogTitle>{selectedTransaction ? "Edit" : "Add"} Transaction</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              
              <Field>
                <Label htmlFor="clientId">Client</Label>
                <Select 
                  name="clientId" 
                  defaultValue={selectedTransaction?.clientId}
                  disabled={clients === undefined} 
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              

              <Field>
                <Label htmlFor="status">Status</Label>
                {/* Changed to a predefined dropdown mapped to the union types */}
                <Select name="status" defaultValue={selectedTransaction?.status || "pending"}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="discount">Discount</Label>
                <Input id="discount" name="discount" defaultValue={selectedTransaction?.discount}/>
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