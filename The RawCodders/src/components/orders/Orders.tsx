import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/orders/OrderList/columns"
import { DataTable } from "@/components/orders/OrderList/data-table"
import { OrderModal } from "./OrderList/order-modal";
import { useState } from "react";
import { TOrder } from "./OrderList/columns";
import { OrdersProvider } from "./OrderList/orders-context";


export default function Orders(){
    const orders = useQuery(api.orders.listOrders);
    const [selectedOrder, setSelectedOrder] = useState<TOrder>();
    const [editOrderModalState, setEditOrderModalState] = useState<boolean>(false);
    
    if (orders === undefined) {
        return <div>Loading...</div>;
        // TODO
    }

    return (
        <div>
            <div className="container mx-auto px-6 py-3">
              <OrdersProvider value={{ selectedOrder, setSelectedOrder, editOrderModalState, setEditOrderModalState }}>
                <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                    <div>Orders</div>
                    <OrderModal />
                  </div>
                <DataTable columns={columns} data={orders} />
              </OrdersProvider>
            </div>
        </div>
      );
}