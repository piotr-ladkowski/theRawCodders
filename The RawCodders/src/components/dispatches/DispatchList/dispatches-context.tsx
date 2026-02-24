import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TDispatch } from "./columns";

type DispatchesContextValue = {
  selectedDispatch?: TDispatch;
  setSelectedDispatch: Dispatch<SetStateAction<TDispatch | undefined>>;
  editDispatchModalState: boolean
  setEditDispatchModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number
  setModalObserver: Dispatch<SetStateAction<number>>
};

const DispatchesContext = createContext<DispatchesContextValue | null>(null);

export function DispatchesProvider({
  value,
  children,
}: {
  value: DispatchesContextValue;
  children: ReactNode;
}) {
  return (
    <DispatchesContext.Provider value={value}>{children}</DispatchesContext.Provider>
  );
}

export function useDispatchesContext() {
  const context = useContext(DispatchesContext);
  if (!context) {
    throw new Error("useDispatchesContext must be used within DispatchesProvider");
  }
  return context;
}
