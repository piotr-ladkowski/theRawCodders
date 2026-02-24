import { useQuery, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/clients/ClientList/columns"
import { DataTable } from "@/components/clients/ClientList/data-table"
import { ClientModal } from "./ClientList/client-modal";
import { useState, useEffect } from "react";
import { TClient } from "./ClientList/columns";
import { ClientsProvider } from "./ClientList/clients-context";
import { Spinner } from "../ui/spinner";

export default function Clients() {
  const clients = useQuery(api.clients.listClients, { offset: 0, limit: 200 });
  const [selectedClient, setSelectedClient] = useState<TClient>();
  const [editClientModalState, setEditClientModalState] = useState<boolean>(false);
  const [clientData, setClientData] = useState<TClient[]>([]);
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
      await convex.query(api.clients.listClients, {offset: ((currentPage-1)*docCount), limit: docCount})
      .then((res) => {
        setClientData(res.data); 
        setTableSize(res.count);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])

  if (clients === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ClientsProvider value={{ selectedClient, setSelectedClient, editClientModalState, setEditClientModalState, modalObserver, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Clients</div>
                <ClientModal />
              </div>
            <DataTable columns={columns} data={clientData} pageSettings={pageSettings} />
          </ClientsProvider>
        </div>
    </div>
  );
}