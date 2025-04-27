import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Home, Users, Calendar, Settings, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  currentPath: string;
};

function NavItem({ href, icon, children, currentPath }: NavItemProps) {
  const isActive = href === currentPath;
  
  return (
    <Link href={href}>
      <a className={cn(
        "block px-4 py-2.5 rounded-md text-base font-medium flex items-center space-x-3 cursor-pointer",
        isActive 
          ? "bg-gray-900 text-white" 
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      )}>
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const mobileClass = isOpen ? "translate-x-0" : "-translate-x-full";
  
  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 bg-gray-800 text-white w-64 space-y-6 py-7 px-2 z-20 transform transition duration-200 ease-in-out md:translate-x-0",
        mobileClass
      )}
    >
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Logo */}
      <div className="flex items-center space-x-3 px-4">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary-500" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-11c0-1.66 1.34-3 3-3s3 1.34 3 3v1h-6v-1zm6 4v4h-6v-4h6z" />
        </svg>
        <span className="text-xl font-bold">Nexaro CRM</span>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1">
        <NavItem href="/" icon={<Home className="h-5 w-5" />} currentPath={location}>
          Dashboard
        </NavItem>
        
        <NavItem href="/clients" icon={<Users className="h-5 w-5" />} currentPath={location}>
          Clients
        </NavItem>
        
        <NavItem href="/bookings" icon={<Calendar className="h-5 w-5" />} currentPath={location}>
          Bookings
        </NavItem>
        
        <NavItem href="/services" icon={<Settings className="h-5 w-5" />} currentPath={location}>
          Services
        </NavItem>
        
        <NavItem href="/organization" icon={<Building className="h-5 w-5" />} currentPath={location}>
          Organization
        </NavItem>
      </nav>
      
      {/* User info at bottom */}
      <div className="px-4 mt-auto pt-6 absolute bottom-0 w-full left-0 p-4">
        <div className="flex items-center space-x-3 py-3 border-t border-gray-700">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="font-medium text-white">{user?.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
