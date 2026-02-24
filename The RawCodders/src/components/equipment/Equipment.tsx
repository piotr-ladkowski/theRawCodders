import { useConvex, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "./EquipmentList/columns"
import { DataTable } from "./EquipmentList/data-table"
import { EquipmentModal } from "./EquipmentList/equipment-modal";
import { useState, useEffect } from "react";
import { TEquipment } from "./EquipmentList/columns";
import { EquipmentProvider } from "./EquipmentList/equipment-context";
import { Spinner } from "../ui/spinner";


export default function Equipment() {
  const equipment = useQuery(api.equipment.listEquipment, { offset: 0, limit: 50 });
  const [selectedEquipment, setSelectedEquipment] = useState<TEquipment>();
  const [editEquipmentModalState, setEditEquipmentModalState] = useState<boolean>(false);
  const [equipmentData, setEquipmentData] = useState<TEquipment[]>([]);
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
      await convex.query(api.equipment.listEquipment, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res) => {
        setEquipmentData(res.data); 
        setTableSize(res.total);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])
  


  if (equipment === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <EquipmentProvider value={{ selectedEquipment, setSelectedEquipment, editEquipmentModalState, setEditEquipmentModalState, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Equipment</div>
                <EquipmentModal />
              </div>
            <DataTable columns={columns} data={equipmentData} pageSettings={pageSettings} />
          </EquipmentProvider>
        </div>
    </div>
  );
}
