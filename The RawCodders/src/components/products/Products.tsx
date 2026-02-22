import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "./ProductList/columns"
import { DataTable } from "./ProductList/data-table"
import { ProductModal } from "./ProductList/product-modal";
import { useState } from "react";
import { TProduct } from "./ProductList/columns";
import { ProductsProvider } from "./ProductList/products-context";
import { Spinner } from "../ui/spinner";


export default function Products() {
  const products = useQuery(api.products.listProducts);
  const [selectedProduct, setSelectedProduct] = useState<TProduct>();
  const [editProductModalState, setEditProductModalState] = useState<boolean>(false);

  if (products === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ProductsProvider value={{ selectedProduct, setSelectedProduct, editProductModalState, setEditProductModalState }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Products</div>
                <ProductModal />
              </div>
            <DataTable columns={columns} data={products} />
          </ProductsProvider>
        </div>
    </div>
  );
}