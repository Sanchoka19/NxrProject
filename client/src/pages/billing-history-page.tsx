import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock billing history data
const MOCK_BILLING_HISTORY = [
  {
    id: "INV-001",
    date: "2024-04-01",
    amount: 4900,
    status: "paid",
    description: "Professional Plan - April 2024"
  },
  {
    id: "INV-002",
    date: "2024-03-01",
    amount: 4900,
    status: "paid",
    description: "Professional Plan - March 2024"
  },
  {
    id: "INV-003",
    date: "2024-02-01",
    amount: 4900,
    status: "paid",
    description: "Professional Plan - February 2024"
  },
  {
    id: "INV-004",
    date: "2024-01-01",
    amount: 4900,
    status: "paid",
    description: "Professional Plan - January 2024"
  }
];

export default function BillingHistoryPage() {
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  return (
    <DashboardLayout title="Billing History">
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_BILLING_HISTORY.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>{formatAmount(invoice.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 