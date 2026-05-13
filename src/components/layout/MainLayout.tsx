import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="grid grid-cols-[auto_minmax(0,1fr)]">
        <Sidebar />
        <main className="ml-64 min-w-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
