"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {PageContainer} from "@/components/page-container";
import {ViewSecret} from "@/components/view-secret";
import {cleanupExpiredMessages} from "@/lib/storage";

export default function SecretPage() {
  const params = useParams();
  const [id, setId] = useState<string>("");
  const [hash, setHash] = useState<string | undefined>(undefined);

  useEffect(() => {
    cleanupExpiredMessages();
    const urlId = params?.id as string;
    
    if (urlId) {
      setId(urlId);
      if (typeof window !== "undefined") {
        const hashFragment = window.location.hash.substring(1);
        if (hashFragment) {
          setHash(hashFragment);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [params]);

  return (
    <PageContainer>
      <div className = "max-w-3xl w-full text-center mb-8">
        <h1 className = "text-3xl font-bold tracking-tight mb-3">
          Secret Message
        </h1>
        <p className = "text-muted-foreground max-w-2xl mx-auto">
          This message will self-destruct after you view it.
        </p>
      </div>
      {id && <ViewSecret id = {id} hash = {hash}/>}
    </PageContainer>
  );
}