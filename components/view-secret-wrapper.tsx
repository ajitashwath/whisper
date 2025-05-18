"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { ViewSecret } from "@/components/view-secret";
import { cleanupExpiredMessages } from "@/lib/storage";

export function ViewSecretWrapper() {
  const params = useParams();
  const [id, setId] = useState<string>("");
  const [hash, setHash] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Clean up expired messages on page load
    cleanupExpiredMessages();
    
    // Extract ID from URL parameters
    const urlId = params?.id as string;
    
    if (urlId) {
      setId(urlId);
      
      // Check for hash fragment in URL
      if (typeof window !== "undefined") {
        const hashFragment = window.location.hash.substring(1);
        if (hashFragment) {
          setHash(hashFragment);
          
          // Clear the hash from the URL for security
          // (so it's not shared if someone copies the URL after viewing)
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [params]);

  return (
    <PageContainer>
      <div className="max-w-3xl w-full text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Secret Message
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This message will self-destruct after you view it.
        </p>
      </div>
      
      {id && <ViewSecret id={id} hash={hash} />}
    </PageContainer>
  );
}