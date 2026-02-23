import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TUser } from "./columns";

type UsersContextValue = {
  selectedUser?: TUser;
  setSelectedUser: Dispatch<SetStateAction<TUser | undefined>>;
  editUserModalState: boolean;
  setEditUserModalState: Dispatch<SetStateAction<boolean>>;
  canEdit: boolean;
};

export const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({
  value,
  children,
}: {
  value: UsersContextValue;
  children: ReactNode;
}) {
  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsersContext() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsersContext must be used within UsersProvider");
  }
  return context;
}
