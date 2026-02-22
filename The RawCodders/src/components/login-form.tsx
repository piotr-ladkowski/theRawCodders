import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuthActions } from "@convex-dev/auth/react"
import { useState } from "react"

function getUserFriendlyError(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message;
  
  if (message.includes("InvalidSecret")) {
    return "Invalid email or password. Please try again.";
  }
  if(message.includes("validateDefaultPasswordRequirements")) {
    return "Your password does not match the requirements."
  }
  if (message.includes("User not found") || message.includes("Account not found")) {
    return "No account found with this email. Please sign up first.";
  }
  if (message.includes("already exists")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (message.includes("invalid") || message.includes("Invalid")) {
    return "Invalid email or password. Please try again.";
  }
  
  
  // Fallback for unexpected errors
  return "Something went wrong. Please try again.";
}

export function LoginForm({
  className,
}: React.ComponentProps<"form">) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");

  return (
    <form className={cn("flex flex-col gap-6", className)} 
      onSubmit={(e) => {
          e.preventDefault();
          setError(""); // Clear previous errors
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(getUserFriendlyError(error));
          });
        }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{flow !== "signIn" ? "Register" : "Login to"} your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to {flow !== "signIn" ? "register" : "login to"} to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" name="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input id="password" name="password" type="password" required />
        </Field>

        <Field>
          <Button type="submit">{flow !== "signIn" ? "Register" : "Login"}</Button>
        </Field>
        <Field>
          
          <FieldDescription className="text-center">
            {flow === "signIn" ? "Don't have an account? " : "Already registered? "}
            <span onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError("") }} className="underline underline-offset-4 hover:cursor-pointer">
              {flow === "signIn" ? "Sign Up" : "Login"}
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
      {error  && (
        <Field className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-md">
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
        </Field>
      )}
    </form>
  )
}
