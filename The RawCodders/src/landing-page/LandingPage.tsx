import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function LandingPage() {
  

  return (
    <div>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }
        
        .animate-fade-in-up-delay {
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }
      `}</style>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in-down">
          Welcome to The Raw Codders
        </h1>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
          Manage your business operations with ease. Orders, products, clients, transactions, and returns—all in one place.
        </p>
        <Link to="/products">
          <Button className="!bg-cyan-600 h-max px-4 py-3 text-3xl hover:!bg-violet-600 font-semibold rounded-none hover:cursor-pointer">
            View products
          </Button>
        </Link>
      </div>
    </div>
  );
}
