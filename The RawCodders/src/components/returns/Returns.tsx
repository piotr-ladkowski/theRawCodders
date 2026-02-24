import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/returns/ReturnList/columns"
import { DataTable } from "@/components/returns/ReturnList/data-table"
import { ReturnModal } from "./ReturnList/return-modal";
import { useState, useEffect } from "react";
import { TReturn } from "./ReturnList/columns";
import { ReturnsProvider } from "./ReturnList/returns-context";
import { Spinner } from "../ui/spinner";

export default function Returns() {
  const returns = useQuery(api.returns.listReturns, { offset: 0, limit: 50 });
  const [selectedReturn, setSelectedReturn] = useState<TReturn>();
  const [editReturnModalState, setEditReturnModalState] = useState<boolean>(false);
  const [returnData, setReturnData] = useState<TReturn[]>([]);
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
      await convex.query(api.returns.listReturns, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res) => {
        setReturnData(res.data); 
        setTableSize(res.total);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])

  if (returns === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ReturnsProvider value={{ selectedReturn, setSelectedReturn, editReturnModalState, setEditReturnModalState, modalObserver, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Returns</div>
                <ReturnModal />
              </div>
            <DataTable columns={columns} data={returnData} pageSettings={pageSettings} />
          </ReturnsProvider>
        </div>
    </div>
  );
}