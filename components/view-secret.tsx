"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, ShieldAlert, ShieldCheck, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { decryptMessage } from "@/lib/crypto";
import { retrieveAndDestroySecret, checkMessageExists } from "@/lib/storage";

interface ViewSecretProps {
  id: string;
  hash?: string;
}

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export function ViewSecret({ id, hash }: ViewSecretProps) {
  const [state, setState] = useState<"loading" | "password" | "notFound" | "decrypted" | "error">("loading");
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [encryptedContent, setEncryptedContent] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string; url: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    // Check if the message exists
    const messageExists = checkMessageExists(id);
    
    if (!messageExists) {
      setState("notFound");
      return;
    }
    
    // Get the message
    const message = retrieveAndDestroySecret(id);
    
    if (!message) {
      setState("notFound");
      return;
    }
    
    // Store encrypted content for password-protected messages
    setEncryptedContent(message.encryptedContent);
    
    if (message.passwordProtected) {
      setIsPasswordProtected(true);
      setState("password");
      return;
    }
    
    // If not password protected, try to decrypt using the hash
    if (hash) {
      decryptWithKey(message.encryptedContent, hash, message);
    } else {
      // No hash and no password protection is an error
      setState("error");
      toast({
        variant: "destructive",
        title: "Decryption key missing",
        description: "The link appears to be incomplete. The decryption key is missing.",
      });
    }
  }, [id, hash]);

  const decryptWithKey = async (encryptedContent: string, key: string, messageMeta?: any) => {
    try {
      const message = await decryptMessage(encryptedContent, key);
      // If file secret, reconstruct file
      if (messageMeta && (messageMeta.messageType === "photo" || messageMeta.messageType === "document")) {
        // message is base64 string
        const byteString = atob(message);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: messageMeta.fileType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        setFileInfo({ name: messageMeta.fileName || 'file', type: messageMeta.fileType || '', url });
        setDecryptedMessage('');
      } else {
        setDecryptedMessage(message);
      }
      setState("decrypted");
    } catch (error) {
      console.error("Decryption failed:", error);
      setState("error");
      toast({
        variant: "destructive",
        title: "Decryption failed",
        description: "The message couldn't be decrypted. The key may be invalid or the message has been tampered with.",
      });
    }
  };

  const onSubmitPassword = async (values: z.infer<typeof passwordSchema>) => {
    try {
      // Need to retrieve message meta again
      const messageMeta = retrieveAndDestroySecret(id);
      await decryptWithKey(encryptedContent, values.password, messageMeta);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "The password you entered is incorrect.",
      });
    }
  };

  const goHome = () => {
    router.push("/");
  };

  if (state === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Loading Secret...</CardTitle>
          <CardDescription>Please wait while we retrieve the secret...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (state === "notFound") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-destructive">
            <ShieldAlert className="mr-2 h-6 w-6" />
            Secret Not Found
          </CardTitle>
          <CardDescription>
            This secret may have already been viewed or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Secret Unavailable</AlertTitle>
            <AlertDescription>
              Each secret can only be viewed once. This link is no longer valid.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={goHome} className="w-full">
            Create a New Secret
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center text-destructive">
            <ShieldAlert className="mr-2 h-6 w-6" />
            Unable to Access Secret
          </CardTitle>
          <CardDescription>
            We couldn't decrypt this message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Decryption Failed</AlertTitle>
            <AlertDescription>
              The decryption key may be invalid or the message has been tampered with.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={goHome} className="w-full">
            Create a New Secret
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (state === "password") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <Lock className="mr-2 h-6 w-6 text-amber-500" />
            Password Protected
          </CardTitle>
          <CardDescription className="text-center">
            This secret requires a password to view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Enter Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter the secure password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Decrypt Secret
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={goHome}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (state === "decrypted") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <ShieldCheck className="mr-2 h-6 w-6 text-green-500" />
            Secret Revealed
          </CardTitle>
          <CardDescription className="text-center">
            This message has been decrypted and will not be accessible again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fileInfo ? (
            fileInfo.type.startsWith('image/') ? (
              <div className="flex flex-col items-center">
                <img src={fileInfo.url} alt={fileInfo.name} className="max-w-full max-h-64 rounded border" />
                <a href={fileInfo.url} download={fileInfo.name} className="mt-2 underline text-primary text-sm">Download Image</a>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <a href={fileInfo.url} download={fileInfo.name} className="underline text-primary text-sm">Download {fileInfo.name}</a>
              </div>
            )
          ) : (
            <div className="p-4 bg-muted rounded-md">
              <div className="whitespace-pre-wrap break-words">
                {decryptedMessage}
              </div>
            </div>
          )}
          {fileInfo ? null : (
            <div className="flex justify-center">
              <CopyButton value={decryptedMessage} className="w-full" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={goHome} className="w-full">
            Create a New Secret
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}