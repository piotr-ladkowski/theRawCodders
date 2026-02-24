import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/maintenance_logs/MaintenanceLogList/columns"
import { DataTable } from "@/components/maintenance_logs/MaintenanceLogList/data-table"
import { MaintenanceLogModal } from "./MaintenanceLogList/maintenance-log-modal";
import { useState, useEffect } from "react";
import { TMaintenanceLog } from "./MaintenanceLogList/columns";
import { MaintenanceLogsProvider } from "./MaintenanceLogList/maintenance-logs-context";
import { Spinner } from "../ui/spinner";

export default function MaintenanceLogs() {
  const maintenanceLogs = useQuery(api.maintenance_logs.listMaintenanceLogs, { offset: 0, limit: 50 });
  const [selectedMaintenanceLog, setSelectedMaintenanceLog] = useState<TMaintenanceLog>();
  const [editMaintenanceLogModalState, setEditMaintenanceLogModalState] = useState<boolean>(false);
  const [maintenanceLogData, setMaintenanceLogData] = useState<TMaintenanceLog[]>([]);
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
      .then((res) => {
        setMaintenanceLogData(res.data); 
        setTableSize(res.total);
      })
    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])

  if (maintenanceLogs === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <MaintenanceLogsProvider value={{ selectedMaintenanceLog, setSelectedMaintenanceLog, editMaintenanceLogModalState, setEditMaintenanceLogModalState, modalObserver, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Maintenance Logs</div>
                <MaintenanceLogModal />
              </div>
            <DataTable columns={columns} data={maintenanceLogData} pageSettings={pageSettings} />
          </MaintenanceLogsProvider>
        </div>
    </div>
  );
}
