"use client";

import { useState } from "react";
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

import { encryptMessage, generateKey } from "@/lib/crypto";
import { storeSecret } from "@/lib/storage";
import { EXPIRATION_OPTIONS, MAX_MESSAGE_LENGTH } from "@/lib/types";

// Form validation schema
const formSchema = z.object({
  message: z.string()
    .min(1, "Message is required")
    .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters`),
  expiration: z.string({
    required_error: "Please select an expiration time",
  }),
  usePassword: z.boolean().default(false),
  password: z.string().optional(),
}).refine(data => !data.usePassword || (data.usePassword && data.password && data.password.length >= 4), {
  message: "Password must be at least 4 characters when protection is enabled",
  path: ["password"],
});

export function CreateSecretForm() {
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      expiration: "86400000", // 1 day default
      usePassword: false,
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Generate encryption key and encrypt message
      const encryptionKey = generateKey();
      const passwordToUse = values.usePassword && values.password ? values.password : encryptionKey;
      const encryptedMessage = await encryptMessage(values.message, passwordToUse);
      
      // Store the encrypted message
      const messageId = storeSecret(
        encryptedMessage,
        Number(values.expiration),
        values.usePassword
      );
      
      // Generate URL with the secret key in the hash
      const baseUrl = window.location.origin;
      const urlKey = values.usePassword ? messageId : `${messageId}#${encryptionKey}`;
      
      // Ensure proper URL format with trailing slash for static exports
      const url = `${baseUrl}/secret/${urlKey}/`;
      
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