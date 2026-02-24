import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/personnel/PersonnelList/columns"
import { DataTable } from "@/components/personnel/PersonnelList/data-table"
import { PersonnelModal } from "./PersonnelList/personnel-modal";
import { useState, useEffect } from "react";
import { TPersonnel } from "./PersonnelList/columns";
import { PersonnelProvider } from "./PersonnelList/personnel-context";
import { Spinner } from "../ui/spinner";

export default function Personnel() {
  const personnel = useQuery(api.personnel.listPersonnel, { offset: 0, limit: 200 });
  const [selectedPersonnel, setSelectedPersonnel] = useState<TPersonnel>();
  const [editPersonnelModalState, setEditPersonnelModalState] = useState<boolean>(false);
  const [personnelData, setPersonnelData] = useState<TPersonnel[]>([]);
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
      await convex.query(api.personnel.listPersonnel, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res) => {
        setPersonnelData(res.data); 
        setTableSize(res.count);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])

  if (personnel === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <PersonnelProvider value={{ selectedPersonnel, setSelectedPersonnel, editPersonnelModalState, setEditPersonnelModalState, modalObserver, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Personnel</div>
                <PersonnelModal />
              </div>
            <DataTable columns={columns} data={personnelData} pageSettings={pageSettings} />
          </PersonnelProvider>
        </div>
    </div>
  );
}
