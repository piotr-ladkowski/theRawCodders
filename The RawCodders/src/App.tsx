import { Authenticated, Unauthenticated } from "convex/react";
import MainLayout from "./MainLayout";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardExample from "./components/dashboard/DashboardExample";
import Insights from "./components/insights/Insights";
import LoginPage from "./components/login-form";
import LandingLayout from "./landing-page/LandingLayout";
import LandingPage from "./landing-page/LandingPage";
import AboutUsPage from "./landing-page/AboutUsPage";
import ProductsPage from "./landing-page/ProductsPage";

// --- NEW COMPONENT IMPORTS ---
// Note: You must rename your existing folders in src/components to match these
import Incidents from "./components/incidents/Incidents";
import Dispatches from "./components/dispatches/Dispatches";
import Equipment from "./components/equipment/Equipment";
import Personnel from "./components/personnel/Personnel";
import MaintenanceLogs from "./components/maintenance/MaintenanceLogs";
import PersonnelDetail from "./components/personnel_detail/PersonnelDetail";

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
          
          {/* NEW MOUNTAIN RESCUE ROUTES */}
          <Route path="incidents" element={<Incidents />} />
          <Route path="dispatches" element={<Dispatches />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="personnel/:personnelId" element={<PersonnelDetail />} />
          <Route path="maintenance" element={<MaintenanceLogs />} />
          
          <Route path="insights" element={<Insights />} />
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