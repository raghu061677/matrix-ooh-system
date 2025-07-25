

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { suggestMediaLocations } from '@/ai/flows/suggest-media-locations';
import { Loader2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  message: z.string().optional(),
  clientRequirements: z.string().min(10, {
    message: 'Please provide at least 10 characters for an AI suggestion.',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      clientRequirements: '',
    },
  });

  function onSubmit(values: FormData) {
    startTransition(async () => {
      const { suggestedLocations } = await suggestMediaLocations({ clientRequirements: values.clientRequirements });

      if (!suggestedLocations) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: 'Could not get suggestions',
        });
      } else {
        toast({
          title: 'Enquiry Sent!',
          description: 'We will be in touch shortly. Here are some initial suggestions for you.',
        });
        setSuggestions(suggestedLocations);
        form.reset();
      }
    });
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Targeting tech professionals in downtown areas with high foot traffic during evenings."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other details you'd like to share."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Suggestions...
                  </>
                ) : (
                  'Submit & Get AI Suggestions'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!suggestions} onOpenChange={() => setSuggestions(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI-Powered Location Suggestions</AlertDialogTitle>
            <AlertDialogDescription>
              Based on your requirements, here are a few recommended locations to get you started:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto p-4 bg-secondary/50 rounded-md text-sm">
             {suggestions}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuggestions(null)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
