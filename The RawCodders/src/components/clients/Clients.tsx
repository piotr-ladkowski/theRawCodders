import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/clients/ClientList/columns"
import { DataTable } from "@/components/clients/ClientList/data-table"
import { ClientModal } from "./ClientList/client-modal";
export default function Clients() {
  const clients = useQuery(api.clients.listClients);
  if (clients === undefined) {
    return <div>Loading...</div>;
  }


  return (
    <div>

        <div className="container mx-auto px-6 py-3">
          <div className="text-2xl flex gap-4 items-center font-bold mb-3">
              <div>Clients</div>
              <ClientModal />
            </div>
          <DataTable columns={columns} data={clients} />
        </div>
    </div>
  );
}