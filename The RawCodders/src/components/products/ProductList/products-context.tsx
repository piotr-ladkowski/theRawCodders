import { createContext, useContext } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import type { TProduct } from "./columns";

type ProductsContextValue = {
  selectedProduct?: TProduct;
  setSelectedProduct: Dispatch<SetStateAction<TProduct | undefined>>;
  editProductModalState: boolean
  setEditProductModalState: Dispatch<SetStateAction<boolean>>
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  value,
  children,
}: {
  value: ProductsContextValue;
  children: ReactNode;
}) {
  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProductsContext() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProductsContext must be used within ProductsProvider");
  }
  return context;
}
