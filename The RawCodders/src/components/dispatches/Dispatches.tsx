import { useConvex, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/dispatches/DispatchList/columns"
import { DataTable } from "@/components/dispatches/DispatchList/data-table"
import { DispatchModal } from "./DispatchList/dispatch-modal";
import { useState, useEffect } from "react";
import { TDispatch } from "./DispatchList/columns";
import { DispatchesProvider } from "./DispatchList/dispatches-context";
import { Spinner } from "../ui/spinner";


export default function Dispatches(){
  const dispatches = useQuery(api.dispatches.listDispatches, {offset: 2, limit: 1});
  const [selectedDispatch, setSelectedDispatch] = useState<TDispatch>();
  const [editDispatchModalState, setEditDispatchModalState] = useState<boolean>(false);
  const [dispatchData, setDispatchData] = useState<TDispatch[]>([]);
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
      await convex.query(api.dispatches.listDispatches, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res) => {
        setDispatchData(res.data); 
        setTableSize(res.total);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])


  if (dispatches === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

    return (
        <div>
            <div className="container mx-auto px-6 py-3">
              <DispatchesProvider value={{ selectedDispatch, setSelectedDispatch, editDispatchModalState, setEditDispatchModalState, modalObserver, setModalObserver }}>
                <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                    <div>Dispatches</div>
                    <DispatchModal />
                  </div>
                <DataTable columns={columns} data={dispatchData} pageSettings={pageSettings}  />
              </DispatchesProvider>
            </div>
        </div>
      );
}
