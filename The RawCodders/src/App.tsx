
import { Authenticated, Unauthenticated } from "convex/react";
import MainLayout from "./MainLayout";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardExample from "./components/dashboard/DashboardExample";
import Orders from "./components/orders/Orders";
import Transactions from "./components/transactions/Transactions";
import Products from "./components/products/Products";
import Clients from "./components/clients/Clients";
import Returns from "./components/returns/Returns";
import LoginPage from "./components/login-form";
import LandingLayout from "./landing-page/LandingLayout";
import LandingPage from "./landing-page/LandingPage";
import AboutUsPage from "./landing-page/AboutUsPage";
import ProductsPage from "./landing-page/ProductsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard routes - requires authentication */}
        <Route
          path="/dashboard/*"
          element={
            <>
              <Authenticated>
                <MainLayout />
              </Authenticated>
              <Unauthenticated>
                <LoginPage />
              </Unauthenticated>
            </>
          }
        >
          <Route index element={<Navigate to="/dashboard/main" replace />} />
          <Route path="main" element={<DashboardExample />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          <Route path="returns" element={<Returns />} />
        </Route>

        {/* Landing routes - root and everything except /dashboard */}
        <Route path="/*" element={<LandingLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about-us" element={<AboutUsPage />} />
          <Route path="products" element={<ProductsPage />}/>
          <Route path="*" element={<LandingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
