import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "@/components/returns/ReturnList/columns"
import { DataTable } from "@/components/returns/ReturnList/data-table"
import { ReturnModal } from "./ReturnList/return-modal";
import { useState } from "react";
import { TReturn } from "./ReturnList/columns";
import { ReturnsProvider } from "./ReturnList/returns-context";
import { Spinner } from "../ui/spinner";

export default function Returns() {
  const returns = useQuery(api.returns.listReturns);
  const [selectedReturn, setSelectedReturn] = useState<TReturn>();
  const [editReturnModalState, setEditReturnModalState] = useState<boolean>(false);

  if (returns === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ReturnsProvider value={{ selectedReturn, setSelectedReturn, editReturnModalState, setEditReturnModalState }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Returns</div>
                <ReturnModal />
              </div>
            <DataTable columns={columns} data={returns} />
          </ReturnsProvider>
        </div>
    </div>
  );
}