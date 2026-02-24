import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TClient } from "./columns";

type ClientsContextValue = {
  selectedClient?: TClient;
  setSelectedClient: Dispatch<SetStateAction<TClient | undefined>>;
  editClientModalState: boolean
  setEditClientModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number,
  setModalObserver: Dispatch<SetStateAction<number>>
};

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({
  value,
  children,
}: {
  value: ClientsContextValue;
  children: ReactNode;
}) {
  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}

export function useClientsContext() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error("useClientsContext must be used within ClientsProvider");
  }
  return context;
}
