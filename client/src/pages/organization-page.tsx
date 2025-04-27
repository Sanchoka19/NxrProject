import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building, Mail, Phone, MapPin, Users, ShieldCheck, X, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Organization type
interface Organization {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'founder' | 'admin' | 'staff';
  createdAt: string;
}

interface Subscription {
  id: number;
  planName: string;
  pricePerMonth: number;
  maxUsers: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

// Organization form schema
const organizationFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

// Invite user form schema
const inviteUserFormSchema = z.object({
  inviteeEmail: z.string().email("Invalid email format"),
  role: z.enum(['admin', 'staff']).default('staff'),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;

export default function OrganizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("organization");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Organization form
  const organizationForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  // Invite user form
  const inviteUserForm = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      inviteeEmail: "",
      role: "staff",
    },
  });

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery<Organization>({
    queryKey: ["/api/organization"],
    enabled: !!user,
    onSuccess: (data) => {
      organizationForm.reset({
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        address: data.address || "",
      });
    },
  });

  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery<User[]>({
    queryKey: ["/api/organization/users"],
    enabled: !!user,
  });

  // Fetch subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationFormValues) => {
      const res = await apiRequest("PUT", "/api/organization", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      toast({
        title: "Success",
        description: "Organization information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite user mutation (mock - actual invite would be sent via email)
  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserFormValues) => {
      // In a real app, this would send an email invitation
      const res = await apiRequest("POST", "/api/organization/invite", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users"] });
      toast({
        title: "Invitation Sent",
        description: "User invitation has been sent successfully",
      });
      setIsInviteDialogOpen(false);
      inviteUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle organization form submission
  const onOrganizationSubmit = (data: OrganizationFormValues) => {
    updateOrganizationMutation.mutate(data);
  };

  // Handle invite user form submission
  const onInviteUserSubmit = (data: InviteUserFormValues) => {
    inviteUserMutation.mutate(data);
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'founder':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Founder</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>;
      case 'staff':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Staff</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Check if user has permission to edit
  const canEdit = user?.role === 'founder' || user?.role === 'admin';

  return (
    <DashboardLayout title="Organization">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Organization</h1>
        {canEdit && user?.role === 'founder' && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Update your organization's profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrg ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <Form {...organizationForm}>
                  <form onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)} className="space-y-6">
                    <FormField
                      control={organizationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input placeholder="Acme Inc." {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={organizationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input placeholder="contact@example.com" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            This email will be used for system notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Textarea placeholder="123 Main St, City, State, ZIP" {...field} value={field.value || ""} className="min-h-[100px] pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {canEdit && (
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={updateOrganizationMutation.isPending}
                      >
                        {updateOrganizationMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their roles
                </CardDescription>
              </div>
              {canEdit && user?.role === 'founder' && (
                <Button variant="outline" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingTeam ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers && teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="font-medium">{member.name.charAt(0)}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">{member.email}</div>
                            </TableCell>
                            <TableCell>
                              {getRoleBadge(member.role)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                            No team members found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{subscription.planName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {subscription.isActive ? "Active" : "Inactive"} subscription
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${(subscription.pricePerMonth / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-500">Start Date</span>
                        <span className="text-gray-900">{new Date(subscription.startDate).toLocaleDateString()}</span>
                      </div>
                      {subscription.endDate && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="font-medium text-gray-500">End Date</span>
                          <span className="text-gray-900">{new Date(subscription.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {subscription.maxUsers && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="font-medium text-gray-500">User Limit</span>
                          <span className="text-gray-900">{subscription.maxUsers} users</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Billing History
                    </Button>
                    {canEdit && user?.role === 'founder' && (
                      <Button className="w-full sm:w-auto">
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">No Active Subscription</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Your organization doesn't have an active subscription plan. 
                    Choose a plan to continue using all features.
                  </p>
                  {canEdit && user?.role === 'founder' && (
                    <Button>
                      Choose a Plan
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>
          
          <Form {...inviteUserForm}>
            <form onSubmit={inviteUserForm.handleSubmit(onInviteUserSubmit)} className="space-y-4">
              <FormField
                control={inviteUserForm.control}
                name="inviteeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="colleague@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      An invitation will be sent to this email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inviteUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="role-admin" />
                          <Label htmlFor="role-admin">Admin</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="staff" id="role-staff" />
                          <Label htmlFor="role-staff">Staff</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Admins can manage organization settings. Staff can only manage clients, services, and bookings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
