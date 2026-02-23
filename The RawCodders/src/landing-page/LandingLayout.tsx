import { Outlet } from "react-router-dom";
import TopBar from "./components/TopBar";


export default function LandingLayout() {
    return (
    <>
        <TopBar />
        <div className="h-[calc(100vh_-_60px)] bg-radial-[at_50%_25%] from-violet-700 to-cyan-300 flex items-center justify-center">
            <Outlet />
        </div>
    </>
    );
}