import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip"
import "./index.css";
import App from "./App.tsx";

const convexUrl = "http://majkrafty.ddns.net:3210"//import.meta.env.VITE_CONVEX_URL || "http://127.0.0.1:3210";

if (!convexUrl.startsWith("http://") && !convexUrl.startsWith("https://")) {
  throw new Error(
    `VITE_CONVEX_URL must be an absolute URL (e.g., http://localhost:3210). Got: ${convexUrl}`
  );
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ConvexAuthProvider>
  </StrictMode>,
);
