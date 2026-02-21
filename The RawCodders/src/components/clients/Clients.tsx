import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Clients() {
  const clients = useQuery(api.clients.listClients);

  if (clients === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Clients De Mierda</h2>
      <ul>
        {clients.map((client) => (
          <li key={client._id}>
            {client.name} — {client.email}
          </li>
        ))}
      </ul>
    </div>
  );
}