import { PageContainer } from "@/components/page-container";
import { CreateSecretForm } from "@/components/create-secret-form";

export default function Home() {
  return (
    <PageContainer>
      <div className="max-w-3xl w-full text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Share Secrets Securely
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Send sensitive information via encrypted links that self-destruct after being viewed once.
        </p>
      </div>
      
      <CreateSecretForm />
      
      <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3 w-full max-w-3xl">
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-medium mb-2">🔐 End-to-End Encrypted</h3>
          <p className="text-sm text-muted-foreground">All messages are encrypted in your browser. We can't read your data.</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-medium mb-2">⚡ One-Time Access</h3>
          <p className="text-sm text-muted-foreground">Links automatically self-destruct after being viewed once.</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="font-medium mb-2">🛡️ No Persistence</h3>
          <p className="text-sm text-muted-foreground">All data is stored locally and expires automatically.</p>
        </div>
      </div>
    </PageContainer>
  );
}