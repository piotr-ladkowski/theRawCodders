import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TIncident } from "./columns";

type IncidentsContextValue = {
  selectedIncident?: TIncident;
  setSelectedIncident: Dispatch<SetStateAction<TIncident | undefined>>;
  editIncidentModalState: boolean
  setEditIncidentModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number,
  setModalObserver: Dispatch<SetStateAction<number>>
};

const IncidentsContext = createContext<IncidentsContextValue | null>(null);

export function IncidentsProvider({
  value,
  children,
}: {
  value: IncidentsContextValue;
  children: ReactNode;
}) {
  return (
    <IncidentsContext.Provider value={value}>{children}</IncidentsContext.Provider>
  );
}

export function useIncidentsContext() {
  const context = useContext(IncidentsContext);
  if (!context) {
    throw new Error("useIncidentsContext must be used within IncidentsProvider");
  }
  return context;
}