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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconPlus, IconChevronDown, IconCheck } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrdersContext } from "./orders-context";
import { Id } from "../../../../convex/_generated/dataModel";

export function OrderModal() {
  const { selectedOrder, setSelectedOrder, editOrderModalState, setEditOrderModalState, modalObserver, setModalObserver  } = useOrdersContext();
  const clearSelectedTimeoutRef = useRef<number | null>(null);

  const createOrder = useMutation(api.orders.insertOrder);
  const updateOrder = useMutation(api.orders.updateOrder);
  const createTransaction = useMutation(api.transactions.insertTransaction);
  
  // Fetch products to populate the dropdown
  const products = useQuery(api.products.listProducts);

  // Combobox State
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedProductId = selectedOrder?.productId as Id<"products"> | undefined;

  // Filter products based on search input
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function scheduleClearSelectedOrder() {
    if (clearSelectedTimeoutRef.current !== null) {
      window.clearTimeout(clearSelectedTimeoutRef.current);
    }
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

    if (!selectedProductId) {
      //console.error("Please select a product");
      return;
    }

    const commonData = {
      productId: selectedProductId, // Grab directly from state instead of formData
      quantity: Number(formData.get("quantity"))
    };

    
    if (selectedOrder?._id) {
      await updateOrder({
        orderId: selectedOrder._id,
        ...commonData,
      });
    } else {
      const newTransactionId = await createTransaction({
        clientId: "jx7547q51txvpssfavt9bvtwvn81kh59" as Id<"clients">, //TODO
        status: "pending", // Default status
        discount: 0,       // Default discount
        orderId: [],       // Empty array to start,
        date: new Date().toISOString()
      });

      await createOrder({
        ...commonData,
        transactionId: newTransactionId 
      });
    }
    // Wait for backend to process before refetching
    await new Promise(resolve => setTimeout(resolve, 500));
    setModalObserver((prev) => (prev + 1) % 1000);
    setEditOrderModalState(false); 
    scheduleClearSelectedOrder();
    
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
                <Label htmlFor="productId-1">Product</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="productId-1"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between font-normal"
                    >
                      {selectedProductId && products
                        ? products.find((p) => p._id === selectedProductId)?.name
                        : "Select a product..."}
                      <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  {/* Matches the width of the trigger button */}
                  <PopoverContent 
                    className="p-0" 
                    style={{ width: "var(--radix-popover-trigger-width)" }} 
                    align="start"
                  >
                    <div className="p-2 border-b">
                      <Input 
                        placeholder="Search product..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 border-none focus-visible:ring-0 shadow-none outline-none"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {products === undefined ? (
                        <p className="p-2 text-sm text-center text-muted-foreground">Loading products...</p>
                      ) : filteredProducts?.length === 0 ? (
                        <p className="p-2 text-sm text-center text-muted-foreground">No products found.</p>
                      ) : (
                        filteredProducts?.map((product) => (
                          <div
                            key={product._id}
                            className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                              selectedProductId === product._id ? "bg-accent text-accent-foreground" : ""
                            }`}
                            onClick={() => {
                              setSelectedOrder({ ...selectedOrder!, productId: product._id });
                              setOpen(false); // Close dropdown after selection
                            }}
                          >
                            <span>{product.name}</span>
                            {selectedProductId === product._id && <IconCheck className="h-4 w-4" />}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <Label htmlFor="quantity-1">Quantity</Label>
                <Input id="quantity-1" name="quantity" type="number" defaultValue={selectedOrder?.quantity} required/>
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