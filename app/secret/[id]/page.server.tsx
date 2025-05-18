import {Metadata} from "next";

export const metadata: Metadata = {
  title: "Secret Message | Whisper",
  description: "View your secret message securely.",
};

export function generateStaticParams() {
  return [];
}

export default function SecretPageStatic() {
  return null;
}