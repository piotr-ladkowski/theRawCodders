import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TEquipment } from "./columns";

type EquipmentContextValue = {
  selectedEquipment?: TEquipment;
  setSelectedEquipment: Dispatch<SetStateAction<TEquipment | undefined>>;
  editEquipmentModalState: boolean
  setEditEquipmentModalState: Dispatch<SetStateAction<boolean>>
  setModalObserver: Dispatch<SetStateAction<number>>
};

const EquipmentContext = createContext<EquipmentContextValue | null>(null);

export function EquipmentProvider({
  value,
  children,
}: {
  value: EquipmentContextValue;
  children: ReactNode;
}) {
  return (
    <EquipmentContext.Provider value={value}>{children}</EquipmentContext.Provider>
  );
}

export function useEquipmentContext() {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error("useEquipmentContext must be used within EquipmentProvider");
  }
  return context;
}