import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Fixed spelling to match your "maintaince" folders
import { columns } from "@/components/maintaince/MaintainceLogList/columns"
import { DataTable } from "@/components/maintaince/MaintainceLogList/data-table"
import { MaintenanceModal } from "./MaintainceLogList/maintaince-modal";
import { useState, useEffect } from "react";
import { TMaintenanceLog } from "./MaintainceLogList/columns";
import { MaintenanceProvider } from "./MaintainceLogList/maintaince-context";

import { Spinner } from "../ui/spinner";

export default function MaintenanceLogs() {
  const logs = useQuery(api.maintenance_logs.listMaintenanceLogs, { offset: 0, limit: 50 });
  const [selectedLog, setSelectedLog] = useState<TMaintenanceLog>();
  const [editLogModalState, setEditLogModalState] = useState<boolean>(false);
  const [logData, setLogData] = useState<TMaintenanceLog[]>([]);
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
      await convex.query(api.maintenance_logs.listMaintenanceLogs, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res: any) => {
        setLogData(res.data); 
        setTableSize(res.total);
      })
    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])

  if (logs === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <MaintenanceProvider value={{ selectedLog, setSelectedLog, editLogModalState, setEditLogModalState, modalObserver, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Equipment Maintenance Logs</div>
                <MaintenanceModal />
              </div>
            <DataTable columns={columns} data={logData} pageSettings={pageSettings} />
          </MaintenanceProvider>
        </div>
    </div>
  );
}