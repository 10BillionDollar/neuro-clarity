import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Chatbot } from "@/components/ui/chatbot";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="grid ">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} />
        <main className={sidebarOpen ? "ml-64 min-w-0 p-6 transition-all duration-300" : "ml-16 min-w-0 p-6 transition-all duration-300"}>
          {children}
        </main>
      </div>
      <Chatbot />
    </div>
  );
}
