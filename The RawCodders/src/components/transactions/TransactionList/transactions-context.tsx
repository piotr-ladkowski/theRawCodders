import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TTransaction } from "./columns";

type TransactionsContextValue = {
  selectedTransaction?: TTransaction;
  setSelectedTransaction: Dispatch<SetStateAction<TTransaction | undefined>>;
  editTransactionModalState: boolean
  setEditTransactionModalState: Dispatch<SetStateAction<boolean>>
  modalObserver: number,
  setModalObserver: Dispatch<SetStateAction<number>>
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({
  value,
  children,
}: {
  value: TransactionsContextValue;
  children: ReactNode;
}) {
  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactionsContext() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactionsContext must be used within TransactionsProvider");
  }
  return context;
}
