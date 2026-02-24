import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// IMPORT THE NEW COMPONENT
import { GlobalEmergencyAlert } from "@/components/GlobalEmergencyAlert"

export default function MainLayout() {
  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      {/* RENDER THE ALERT COMPONENT HERE SO IT LIVES EVERYWHERE */}
      <GlobalEmergencyAlert />

      <SidebarProvider className="flex flex-col sm:flex-row">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
             <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}