export const dynamic = 'force-static'; 

import {Metadata} from "next";
import { ViewSecretWrapper } from "@/components/view-secret-wrapper";

export const metadata: Metadata = {
  title: "Secret Message | Whisper",
  description: "View your secret message securely.",
};

export async function generateStaticParams() {
  const secretIds = await getSecretIds(); 
  return secretIds.map((id: string) => ({
    id: id,
  }));
}


async function getSecretIds(): Promise<string[]> {
  return ['example-id-1', 'example-id-2', 'example-id-3'];
}

export default function SecretPage() {
  return <ViewSecretWrapper />;
}