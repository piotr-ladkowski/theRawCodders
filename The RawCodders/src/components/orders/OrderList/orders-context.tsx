import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TOrder } from "./columns";

type OrdersContextValue = {
  selectedOrder?: TOrder;
  setSelectedOrder: Dispatch<SetStateAction<TOrder | undefined>>;
  editOrderModalState: boolean
  setEditOrderModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number,
  setModalObserver: Dispatch<SetStateAction<number>>
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({
  value,
  children,
}: {
  value: OrdersContextValue;
  children: ReactNode;
}) {
  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrdersContext() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrdersContext must be used within OrdersProvider");
  }
  return context;
}
