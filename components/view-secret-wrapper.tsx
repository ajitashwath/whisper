"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { ViewSecret } from "@/components/view-secret";
import { cleanupExpiredMessages } from "@/lib/storage";

export function ViewSecretWrapper() {
  const params = useParams();
  const [id, setId] = useState<string>("");
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clean up expired messages on page load
    cleanupExpiredMessages();

    // Extract ID from URL parameters
    const urlId = params?.id as string;

    if (urlId) {
      // Handle the case where ID might contain hash fragment
      let cleanId = urlId;
      let hashFragment = "";

      // Check if the ID contains a hash fragment
      if (urlId.includes('#')) {
        const parts = urlId.split('#');
        cleanId = parts[0];
        hashFragment = parts[1];
      }

      // Remove trailing slash if present
      cleanId = cleanId.endsWith('/') ? cleanId.slice(0, -1) : cleanId;

      setId(cleanId);

      // Set hash from URL fragment or window location
      if (hashFragment) {
        setHash(hashFragment);
      } else if (typeof window !== "undefined") {
        const windowHash = window.location.hash.substring(1);
        if (windowHash) {
          setHash(windowHash);
          // Clear the hash from the URL for security
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }

    setIsLoading(false);
  }, [params]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-3xl w-full text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Loading Secret...
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please wait while we retrieve your secret message.
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

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