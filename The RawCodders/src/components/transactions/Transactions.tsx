import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/transactions/TransactionList/columns"
import { DataTable } from "@/components/transactions/TransactionList/data-table"
import { TransactionModal } from "./TransactionList/transaction-modal";
import { useState, useEffect } from "react";
import { TTransaction } from "./TransactionList/columns";
import { TransactionsProvider } from "./TransactionList/transactions-context";
import { Spinner } from "../ui/spinner";

export default function Orders(){
    const transactions = useQuery(api.transactions.listTransactions, { offset: 0, limit: 50 });
    const [selectedTransaction, setSelectedTransaction] = useState<TTransaction>();
    const [editTransactionModalState, setEditTransactionModalState] = useState<boolean>(false);
    const [transactionData, setTransactionData] = useState<TTransaction[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [docCount, setDocCount] = useState(Number(localStorage.getItem("itemsOnPage") ?? "15"));
    const [tableSize, setTableSize] = useState(0);
    const [modalObserver, setModalObserver] = useState(0);
  
    const pageSettings = {
      currentPage,
      setCurrentPage,
      docCount,
      setDocCount,
      tableSize
    }
  
    const convex = useConvex();

    useEffect(() => {
      localStorage.setItem("itemsOnPage", String(docCount))
      const getAndSet = async () => { 
        await convex.query(api.transactions.listTransactions, {offset: ((currentPage-1)*docCount), limit: docCount})
        .then((res) => {
          setTransactionData(res.transactions); 
          setTableSize(res.count);
        })
  
      }
      void getAndSet();
    }, [currentPage, docCount, modalObserver, convex])
    
  if (transactions === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

    return (
        <div>
            <div className="container mx-auto px-6 py-3">
              <TransactionsProvider value={{ selectedTransaction, setSelectedTransaction, editTransactionModalState, setEditTransactionModalState, modalObserver, setModalObserver }}>
                <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                    <div>Transactions</div>
                    <TransactionModal />
                  </div>
                <DataTable columns={columns} data={transactionData} pageSettings={pageSettings} />
              </TransactionsProvider>
            </div>
        </div>
      );
}