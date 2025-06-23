"use client";

import { useState, useCallback } from "react";
import { Lock, Key, Clock, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { encryptMessage, generateKey } from "@/lib/crypto";
import { storeSecret } from "@/lib/storage";
import { EXPIRATION_OPTIONS, MAX_MESSAGE_LENGTH } from "@/lib/types";

// Form validation schema
const formSchema = z.object({
  messageType: z.enum(["text", "photo", "document"]).default("text"),
  message: z.string().optional(),
  file: z.any().optional(),
  expiration: z.string({
    required_error: "Please select an expiration time",
  }),
  usePassword: z.boolean().default(false),
  password: z.string().optional(),
}).refine(data => {
  if (data.messageType === "text") {
    return data.message && data.message.length > 0 && data.message.length <= MAX_MESSAGE_LENGTH;
  } else {
    return data.file instanceof File && data.file.size > 0;
  }
}, {
  message: "Please provide a valid message or file.",
  path: ["message"],
}).refine(data => !data.usePassword || (data.usePassword && data.password && data.password.length >= 4), {
  message: "Password must be at least 4 characters when protection is enabled",
  path: ["password"],
});

export function CreateSecretForm() {
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageType: "text",
      message: "",
      file: undefined,
      expiration: "86400000", // 1 day default
      usePassword: false,
      password: "",
    },
  });

  const messageType = form.watch("messageType");

  // Drag and drop handler
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      form.setValue("file", file, { shouldValidate: true });
    }
  }, [form]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      form.setValue("file", file, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      let encryptedMessage;
      let encryptionKey = generateKey();
      let passwordToUse = values.usePassword && values.password ? values.password : encryptionKey;
      let messageId;
      if (values.messageType === "text") {
        encryptedMessage = await encryptMessage(values.message!, passwordToUse);
        messageId = storeSecret(
          encryptedMessage,
          Number(values.expiration),
          values.usePassword,
          { messageType: values.messageType }
        );
      } else if (values.file instanceof File) {
        const arrayBuffer = await values.file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const fileBase64 = btoa(binary);
        encryptedMessage = await encryptMessage(fileBase64, passwordToUse);
        messageId = storeSecret(
          encryptedMessage,
          Number(values.expiration),
          values.usePassword,
          {
            fileName: values.file.name,
            fileType: values.file.type,
            messageType: values.messageType,
          }
        );
      } else {
        throw new Error("No valid input");
      }
      
      // Generate URL with the secret key in the hash
      const baseUrl = window.location.origin;
      let url: string;
      
      if (values.usePassword) {
        // For password-protected messages, just use the ID
        url = `${baseUrl}/secret/${messageId}`;
      } else {
        // For non-password-protected messages, include the key in the hash
        url = `${baseUrl}/secret/${messageId}#${encryptionKey}`;
      }
      
      setSecretUrl(url);
      
      toast({
        title: "Secret created successfully",
        description: "Share the link with the intended recipient - it will self-destruct after viewing.",
      });
    } catch (error) {
      console.error("Error creating secret:", error);
      toast({
        variant: "destructive",
        title: "Failed to create secret",
        description: "An error occurred while creating your secret. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSecretUrl(null);
    form.reset();
  };

  const usePasswordValue = form.watch("usePassword");

  if (secretUrl) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <Shield className="mr-2 h-6 w-6 text-green-500" />
            Secret Created Successfully
          </CardTitle>
          <CardDescription className="text-center">
            Share this link with your recipient. Remember, it will self-destruct after being viewed once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md break-all">
              <p className="text-sm font-mono">{secretUrl}</p>
            </div>
            <div className="flex justify-center">
              <CopyButton value={secretUrl} className="w-full" />
            </div>
            
            {usePasswordValue && (
              <div className="mt-6 p-4 border border-amber-500/30 bg-amber-500/10 rounded-md">
                <h3 className="flex items-center text-sm font-semibold text-amber-500 mb-2">
                  <Key className="h-4 w-4 mr-2" />
                  Password Required
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've enabled password protection. Make sure to share the password separately with the recipient.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={resetForm} variant="outline" className="w-full">
            Create Another Secret
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Rest of component remains unchanged
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center">
          <Lock className="mr-2 h-6 w-6 text-primary" />
          Create a Secret Message
        </CardTitle>
        <CardDescription className="text-center">
          Your message will self-destruct after being viewed once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Message Type Selector */}
            <FormField
              control={form.control}
              name="messageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <RadioGroup
                    className="flex flex-row gap-4"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="type-text" />
                      <label htmlFor="type-text" className="text-sm">Text</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="photo" id="type-photo" />
                      <label htmlFor="type-photo" className="text-sm">Photo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="document" id="type-document" />
                      <label htmlFor="type-document" className="text-sm">Document</label>
                    </div>
                  </RadioGroup>
                </FormItem>
              )}
            />
            {/* Conditional Input */}
            {messageType === "text" && (
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Secret Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter sensitive information here..."
                        className="min-h-[120px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be encrypted and deleted after viewing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(messageType === "photo" || messageType === "document") && (
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>{messageType === "photo" ? "Upload Photo" : "Upload Document"}</FormLabel>
                    <FormControl>
                      <div
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer bg-muted hover:bg-muted/70"
                        onDrop={onDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => document.getElementById("file-input")?.click()}
                      >
                        {uploadedFile ? (
                          <span className="text-sm text-primary font-medium">{uploadedFile.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Drag and drop or click to select a file</span>
                        )}
                        <input
                          id="file-input"
                          type="file"
                          accept={messageType === "photo" ? "image/*" : undefined}
                          className="hidden"
                          onChange={onFileChange}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {messageType === "photo"
                        ? "Upload an image file. It will be encrypted and deleted after viewing."
                        : "Upload a document file. It will be encrypted and deleted after viewing."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="expiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Expiration Time
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The message will expire after this time, even if not viewed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="usePassword"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Password Protection
                      </FormLabel>
                      <FormDescription>
                        Require a password to view this secret
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {usePasswordValue && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter a secure password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Share this password with the recipient separately
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating Secret...
                </div>
              ) : (
                "Create Secret Link"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}