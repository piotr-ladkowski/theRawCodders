import { useConvex, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { columns } from "./ProductList/columns"
import { DataTable } from "./ProductList/data-table"
import { ProductModal } from "./ProductList/product-modal";
import { useState, useEffect } from "react";
import { TProduct } from "./ProductList/columns";
import { ProductsProvider } from "./ProductList/products-context";
import { Spinner } from "../ui/spinner";


export default function Products() {
  const products = useQuery(api.products.listProducts, { offset: 0, limit: 50 });
  const [selectedProduct, setSelectedProduct] = useState<TProduct>();
  const [editProductModalState, setEditProductModalState] = useState<boolean>(false);
  const [productData, setProductData] = useState<TProduct[]>([]);
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
      await convex.query(api.products.listProducts)
      .then((res) => {
        setProductData(res); 
        setTableSize(res.length);
      })

    }
    void getAndSet();
  }, [currentPage, docCount, modalObserver, convex])
  


  if (products === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner className="size-12"/></div>;
  }

  return (
    <div>
        <div className="container mx-auto px-6 py-3">
          <ProductsProvider value={{ selectedProduct, setSelectedProduct, editProductModalState, setEditProductModalState, setModalObserver }}>
            <div className="text-2xl flex gap-4 items-center font-bold mb-3">
                <div>Products</div>
                <ProductModal />
              </div>
            <DataTable columns={columns} data={productData} pageSettings={pageSettings} />
          </ProductsProvider>
        </div>
    </div>
  );
}