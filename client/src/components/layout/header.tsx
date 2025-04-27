import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Search, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeaderProps = {
  title: string;
  onToggleSidebar: () => void;
};

export default function Header({ title, onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex justify-between h-16 px-4 md:px-6 items-center">
        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-600"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Page title - visible only on mobile */}
        <div className="md:hidden font-medium text-lg">{title}</div>
        
        {/* Search */}
        <div className="hidden md:flex flex-1 justify-start px-2 lg:ml-6">
          <div className="max-w-lg w-full md:max-w-xs relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-transparent focus:bg-white focus:border-primary-500"
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-600"
          >
            <Bell className="h-6 w-6" />
          </Button>
          
          {/* User info - visible only on desktop */}
          <div className="hidden md:flex items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="font-medium">{user?.name.charAt(0)}</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
