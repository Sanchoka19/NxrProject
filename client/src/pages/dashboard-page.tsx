import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Plus, Users, Settings, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type DashboardStats = {
  totalClients: number;
  activeServices: number;
  upcomingBookings: number;
  monthlyRevenue: number;
};

type RecentBooking = {
  id: number;
  date: string;
  status: string;
  clientName: string;
  service: string | { name: string; description: string; price: number; duration: number; organizationId: number; createdAt: string; };
};

type RecentClient = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });
  
  // Fetch recent bookings
  const { data: recentBookings, isLoading: isLoadingBookings } = useQuery<RecentBooking[]>({
    queryKey: ["/api/dashboard/recent-bookings"],
    enabled: !!user,
  });
  
  // Fetch recent clients
  const { data: recentClients, isLoading: isLoadingClients } = useQuery<RecentClient[]>({
    queryKey: ["/api/dashboard/recent-clients"],
    enabled: !!user,
  });
  
  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Button size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
          <Button size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Clients stat */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Total Clients</p>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{stats?.totalClients || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-3">
            <Link href="/clients" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardFooter>
        </Card>

        {/* Bookings stat */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-cyan-500">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Upcoming Bookings</p>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{stats?.upcomingBookings || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-3">
            <Link href="/bookings" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardFooter>
        </Card>

        {/* Services stat */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-purple-500">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Active Services</p>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{stats?.activeServices || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-3">
            <Link href="/services" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardFooter>
        </Card>

        {/* Revenue stat */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-green-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</p>
                {isLoadingStats ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-medium text-gray-900">
                    ${(stats?.monthlyRevenue || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-3">
            <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
              View details
            </span>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="px-6 py-5 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Link href="/bookings" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="border-t border-gray-200">
            {isLoadingBookings ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-3 divide-y divide-gray-200">
                {recentBookings && recentBookings.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <li key={booking.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-700">
                              <span className="font-medium">{booking.clientName ? booking.clientName.substring(0, 2).toUpperCase() : 'NA'}</span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{booking.clientName}</p>
                            <p className="text-sm text-gray-500 truncate">{typeof booking.service === 'object' ? booking.service.name : booking.service}</p>
                          </div>
                          <div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500">No recent bookings</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="px-6 py-5 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Recent Clients</CardTitle>
            <Link href="/clients" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <div className="border-t border-gray-200">
            {isLoadingClients ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-3 divide-y divide-gray-200">
                {recentClients && recentClients.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentClients.map((client) => (
                      <li key={client.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-200">
                              <span className="font-medium">{client.name.substring(0, 2).toUpperCase()}</span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                            <p className="text-sm text-gray-500 truncate">{client.email}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            Added {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                          </div>
                          <div>
                            <Button variant="ghost" size="sm" className="text-primary-700 bg-primary-100 hover:bg-primary-200">
                              View
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500">No recent clients</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
