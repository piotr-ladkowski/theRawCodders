import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TPersonnel } from "./columns";

type PersonnelContextValue = {
  selectedPersonnel?: TPersonnel;
  setSelectedPersonnel: Dispatch<SetStateAction<TPersonnel | undefined>>;
  editPersonnelModalState: boolean
  setEditPersonnelModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number
  setModalObserver: Dispatch<SetStateAction<number>>
};

const PersonnelContext = createContext<PersonnelContextValue | null>(null);

export function PersonnelProvider({
  value,
  children,
}: {
  value: PersonnelContextValue;
  children: ReactNode;
}) {
  return (
    <PersonnelContext.Provider value={value}>{children}</PersonnelContext.Provider>
  );
}

export function usePersonnelContext() {
  const context = useContext(PersonnelContext);
  if (!context) {
    throw new Error("usePersonnelContext must be used within PersonnelProvider");
  }
  return context;
}
