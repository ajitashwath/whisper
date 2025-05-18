import {ViewSecretWrapper} from "@/components/view-secret-wrapper";

// Add generateStaticParams for static export
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function SecretPage() {
  return <ViewSecretWrapper />;
}