import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TMaintenanceLog } from "./columns";

type MaintenanceContextValue = {
  selectedLog?: TMaintenanceLog;
  setSelectedLog: Dispatch<SetStateAction<TMaintenanceLog | undefined>>;
  editLogModalState: boolean;
  setEditLogModalState: Dispatch<SetStateAction<boolean>>;
  modalObserver: number;
  setModalObserver: Dispatch<SetStateAction<number>>;
};

const MaintenanceContext = createContext<MaintenanceContextValue | null>(null);

export function MaintenanceProvider({
  value,
  children,
}: {
  value: MaintenanceContextValue;
  children: ReactNode;
}) {
  return (
    <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>
  );
}

export function useMaintenanceContext() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenanceContext must be used within MaintenanceProvider");
  }
  return context;
}