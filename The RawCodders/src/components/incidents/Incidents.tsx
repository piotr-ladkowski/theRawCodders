import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/incidents/IncidentList/columns"
import { DataTable } from "@/components/incidents/IncidentList/data-table"
import { IncidentModal } from "./IncidentList/incident-modal";
import { useState, useEffect } from "react";
import { TIncident } from "./IncidentList/columns";
import { IncidentsProvider } from "./IncidentList/incidents-context";
import { Spinner } from "../ui/spinner";

export default function Incidents(){
    const incidents = useQuery(api.incidents.listIncidents, { offset: 0, limit: 50 });
    const [selectedIncident, setSelectedIncident] = useState<TIncident>();
    const [editIncidentModalState, setEditIncidentModalState] = useState<boolean>(false);
    const [incidentData, setIncidentData] = useState<TIncident[]>([]);
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
        await convex.query(api.incidents.listIncidents, {offset: ((currentPage-1)*docCount), limit: docCount})
        .then((res) => {
          setIncidentData(res.incidents); 
          setTableSize(res.count);
        })
  
      }
      void getAndSet();
    }, [currentPage, docCount, modalObserver, convex])
    
  if (incidents === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

    return (
        <div>
            <div className="container mx-auto px-6 py-3">
              <IncidentsProvider value={{ selectedIncident, setSelectedIncident, editIncidentModalState, setEditIncidentModalState, modalObserver, setModalObserver }}>
                <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                    <div>Incidents</div>
                    <IncidentModal />
                  </div>
                <DataTable columns={columns} data={incidentData} pageSettings={pageSettings} />
              </IncidentsProvider>
            </div>
        </div>
      );
}
