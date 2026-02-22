"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import MainLayout from "./MainLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import DashboardExample from "./components/dashboard/DashboardExample";
import Orders from "./components/orders/Orders";
import Transactions from "./components/transactions/Transactions";
import Products from "./components/products/Products";
import Clients from "./components/clients/Clients";
import Returns from "./components/returns/Returns";
import { LoginForm } from "@/components/login-form"
import { IconCookie } from "@tabler/icons-react";


function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex justify-center tracking-tighter !font-bold items-center text-4xl gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
              <IconCookie className="size-7" />
            </div>
            Wittiga 4
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/login-bg.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.8]"
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page - accessible to everyone */}
        <Route path="/" element={<LandingPage />} />

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
          <Route path="main" element={<DashboardExample />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          <Route path="returns" element={<Returns />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
