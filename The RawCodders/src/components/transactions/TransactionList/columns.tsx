"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Doc } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type TTransaction = Doc<"transactions"> & {
  clientName?: string;
};

// Sub-component to fetch and display orders for a specific transaction
const TransactionOrdersCell = ({ transaction }: { transaction: TTransaction }) => {
  // Fetch orders associated with this transaction
  const ordersResponse = useQuery(api.orders.getOrdersByTransaction, { 
    transactionId: transaction._id 
  });
  const orders = ordersResponse?.data || [];

  // Fetch products to map the productId to a readable product name
  const products = useQuery(api.products.listProducts, { offset: 0, limit: -1 });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Orders {orders.length > 0 && `(${orders.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orders for Transaction</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {ordersResponse === undefined ? (
            <p className="text-sm text-muted-foreground text-center p-4">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">No orders found for this transaction.</p>
          ) : (
            orders.map((order) => {
              const product = products?.data?.find((p) => p._id === order.productId);
              return (
                <div key={order._id} className="border p-3 rounded-md flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Order ID: {order._id}</span>
                  <span className="font-medium">Product: {product ? product.name : "Loading..."}</span>
                  <span>Quantity: {order.quantity}</span>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<TTransaction>[] = [
  {
    accessorKey: "clientName",
    header: "Client"
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date");
      return date ? new Date(date as string).toLocaleDateString() : "—";
    }
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price"
  },
  {
    accessorKey: "discount",
    header: "Discount"
  },
  {
    accessorKey: "orderId",
    header: "Orders",
    // Replace the default accessor display with our custom dialog cell
    cell: ({ row }) => {
      return <TransactionOrdersCell transaction={row.original} />;
    }
  },
  {
    accessorKey: "action",
    header: "Actions"
  }
]