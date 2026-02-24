import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TReturn } from "./columns";

type ReturnsContextValue = {
  selectedReturn?: TReturn;
  setSelectedReturn: Dispatch<SetStateAction<TReturn | undefined>>;
  editReturnModalState: boolean
  setEditReturnModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number,
  setModalObserver: Dispatch<SetStateAction<number>>
};

const ReturnsContext = createContext<ReturnsContextValue | null>(null);

export function ReturnsProvider({
  value,
  children,
}: {
  value: ReturnsContextValue;
  children: ReactNode;
}) {
  return (
    <ReturnsContext.Provider value={value}>{children}</ReturnsContext.Provider>
  );
}

export function useReturnsContext() {
  const context = useContext(ReturnsContext);
  if (!context) {
    throw new Error("useReturnsContext must be used within ReturnsProvider");
  }
  return context;
}
