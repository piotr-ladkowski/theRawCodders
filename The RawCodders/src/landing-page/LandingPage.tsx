import { Button } from "@/components/ui/button";

export default function LandingPage() {
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          Welcome to The Raw Codders
        </h1>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl">
          Manage your business operations with ease. Orders, products, clients, transactions, and returns—all in one place.
        </p>
        <Button
          onClick={() => {}}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
        >
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}
