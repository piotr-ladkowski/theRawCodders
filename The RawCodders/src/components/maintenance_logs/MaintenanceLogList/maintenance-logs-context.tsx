import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TMaintenanceLog } from "./columns";

type MaintenanceLogsContextValue = {
  selectedMaintenanceLog?: TMaintenanceLog;
  setSelectedMaintenanceLog: Dispatch<SetStateAction<TMaintenanceLog | undefined>>;
  editMaintenanceLogModalState: boolean;
  setEditMaintenanceLogModalState: Dispatch<SetStateAction<boolean>>;
  modalObserver: number;
  setModalObserver: Dispatch<SetStateAction<number>>;
};

const MaintenanceLogsContext = createContext<MaintenanceLogsContextValue | null>(null);

export function MaintenanceLogsProvider({
  value,
  children,
}: {
  value: MaintenanceLogsContextValue;
  children: ReactNode;
}) {
  return (
    <MaintenanceLogsContext.Provider value={value}>{children}</MaintenanceLogsContext.Provider>
  );
}

export function useMaintenanceLogsContext() {
  const context = useContext(MaintenanceLogsContext);
  if (!context) {
    throw new Error("useMaintenanceLogsContext must be used within MaintenanceLogsProvider");
  }
  return context;
}
