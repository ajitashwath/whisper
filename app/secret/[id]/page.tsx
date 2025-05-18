export const dynamic = 'force-static';

import {Metadata} from "next";
import { ViewSecretWrapper } from "@/components/view-secret-wrapper";

export const metadata: Metadata = {
  title: "Secret Message | Whisper",
  description: "View your secret message securely.",
};

export function generateStaticParams() {
  return [
    // Placeholder for static generation
    { id: 'placeholder' }
    // You can add more string IDs here as needed
  ];
}

export default function SecretPage() {
  return <ViewSecretWrapper />;
}