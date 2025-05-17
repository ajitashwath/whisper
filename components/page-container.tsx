import {ThemeToggle} from "@/components/ui/theme-toggle";
import {Lock} from "lucide-react";

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({children}: PageContainerProps) {
  return (
    <div className = "min-h-screen bg-gradient-to-b from-background to-background/80 flex flex-col">
      <header className = "container mx-auto py-4 px-4 flex justify-between items-center">
        <div className = "flex items-center">
          <Lock className = "h-6 w-6 text-primary mr-2" />
          <h1 className = "text-xl font-bold">Whisper</h1>
        </div>
        <ThemeToggle />
      </header>
      
      <main className = "flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {children}
      </main>
      
      <footer className = "container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>Whisper &copy; {new Date().getFullYear()} — Securely share sensitive information</p>
        <p className = "text-xs mt-1">All messages are encrypted and self-destruct after viewing</p>
      </footer>
    </div>
  );
}