import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Check } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SUBSCRIPTION_PLANS = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for small businesses just getting started",
    features: [
      "Up to 5 users",
      "Basic booking management",
      "Client management",
      "Service management",
      "Email support"
    ]
  },
  {
    name: "Professional",
    price: 49,
    description: "Ideal for growing businesses",
    features: [
      "Up to 10 users",
      "Advanced booking management",
      "Client management",
      "Service management",
      "Priority email support",
      "Basic analytics"
    ]
  },
  {
    name: "Enterprise",
    price: 99,
    description: "For established businesses with advanced needs",
    features: [
      "Unlimited users",
      "Advanced booking management",
      "Client management",
      "Service management",
      "24/7 priority support",
      "Advanced analytics",
      "Custom integrations"
    ]
  }
];

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (planName: string, pricePerMonth: number) => {
    if (!user?.organizationId) {
      toast({
        title: "Error",
        description: "You must be part of an organization to subscribe",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          organizationId: user.organizationId,
          planName,
          pricePerMonth: pricePerMonth * 100, // Convert to cents
          maxUsers: planName === "Starter" ? 5 : planName === "Professional" ? 10 : null,
          startDate: new Date(),
          isActive: true
        })
      });

      toast({
        title: "Success",
        description: `Successfully subscribed to the ${planName} plan`,
      });

      setLocation("/organization");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe to the plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Subscription Plans">
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include core features
            with different levels of access and support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.name, plan.price)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 