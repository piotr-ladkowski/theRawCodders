import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/users/UserList/columns"
import { DataTable } from "@/components/users/UserList/data-table"
import { UserModal } from "./UserList/user-modal";
import { useState } from "react";
import { TUser } from "./UserList/columns";
import { UsersProvider } from "./UserList/users-context";
import { Spinner } from "../ui/spinner";

export default function Users() {
  const users = useQuery(api.users.listUsers);
  const currentUser = useQuery(api.auth.currentUser);
  const [selectedUser, setSelectedUser] = useState<TUser>();
  const [editUserModalState, setEditUserModalState] = useState<boolean>(false);

  if (users === undefined || currentUser === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  const canEdit = currentUser?.role === "admin" || currentUser?.role === "manager";

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <UsersProvider value={{ selectedUser, setSelectedUser, editUserModalState, setEditUserModalState, canEdit }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Users</div>
              </div>
            <DataTable columns={columns} data={users} />
            <UserModal />
          </UsersProvider>
        </div>
    </div>
  );
}
