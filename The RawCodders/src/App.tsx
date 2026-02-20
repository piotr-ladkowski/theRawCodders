"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import MainLayout from "./MainLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardExample from "./components/dashboard/DashboardExample";

const inputClass =
  "bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800";
const btnClass =
  "bg-dark dark:bg-light text-light dark:text-dark rounded-md px-4 py-2";

export default function App() {
  return (
    <>
      <main className="flex flex-col gap-16">
        <Authenticated>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout /> }>
                <Route path="dashboard">
                  <Route index element={<DashboardExample />} />
                  <Route path="data" element={<DashboardExample />} />
                  
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}



function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the dashboard</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <input className={inputClass} type="email" name="email" placeholder="Email" />
        <input className={inputClass} type="password" name="password" placeholder="Password" />
        <button className={btnClass} type="submit">
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <span
            className="text-dark dark:text-light underline hover:no-underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">
              Error signing in: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

