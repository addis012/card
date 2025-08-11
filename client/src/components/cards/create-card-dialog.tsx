import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createCardSchema = z.object({
  name_on_card: z.string().min(1, "Name on card is required"),
  card_type: z.string().default("visa"),
  amount: z.string().min(1, "Initial funding amount is required"),
  customerEmail: z.string().email("Valid email is required"),
  billing_address: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_zip: z.string().optional(),
  billing_country: z.string().default("US"),
});

type CreateCardForm = z.infer<typeof createCardSchema>;

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCardDialog({ open, onOpenChange }: CreateCardDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCardForm>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      name_on_card: "",
      card_type: "visa",
      amount: "100",
      customerEmail: "",
      billing_address: "",
      billing_city: "",
      billing_state: "",
      billing_zip: "",
      billing_country: "US",
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: CreateCardForm) =>
      apiRequest("/api/admin/cards/create-strowallet", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Card created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCardForm) => {
    createCardMutation.mutate(data);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Card via Strowallet</DialogTitle>
          <DialogDescription>
            Create a new card and fund it directly from your wallet balance using the Strowallet API.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name_on_card"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name on Card</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Email</FormLabel>
                  <FormControl>
                    <Input placeholder="customer@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Funding Amount (USD)</FormLabel>
                  <FormControl>
                    <Input placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit ($)</FormLabel>
                    <FormControl>
                      <Input placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="billing_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-trust-blue hover:bg-blue-700"
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? "Creating Card via Strowallet..." : "Create Card & Fund from Wallet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
