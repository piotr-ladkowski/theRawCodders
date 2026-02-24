import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/clients/ClientList/columns"
import { DataTable } from "@/components/clients/ClientList/data-table"
import { ClientModal } from "./ClientList/client-modal";
import { useState } from "react";
import { TClient } from "./ClientList/columns";
import { ClientsProvider } from "./ClientList/clients-context";
import { Spinner } from "../ui/spinner";

export default function Clients() {
  const clients = useQuery(api.clients.listClients, { offset: 0, limit: 200 });
  const [selectedClient, setSelectedClient] = useState<TClient>();
  const [editClientModalState, setEditClientModalState] = useState<boolean>(false);

  if (clients === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ClientsProvider value={{ selectedClient, setSelectedClient, editClientModalState, setEditClientModalState }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Clients</div>
                <ClientModal />
              </div>
            <DataTable columns={columns} data={clients} />
          </ClientsProvider>
        </div>
    </div>
  );
}