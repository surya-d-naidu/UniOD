import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/ui/user-nav";
import { Link, useLocation } from "wouter";

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, children, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
          isActive
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
        )}
      >
        {children}
      </a>
    </Link>
  );
}

export function AdminNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo className="flex-shrink-0" />
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <NavItem href="/admin" isActive={location === "/admin"}>
                Dashboard
              </NavItem>
              <NavItem 
                href="/admin/students" 
                isActive={location.startsWith("/admin/students")}
              >
                Student Management
              </NavItem>
              <NavItem 
                href="/admin/od-approval" 
                isActive={location.startsWith("/admin/od-approval")}
              >
                OD Approval
              </NavItem>
              <NavItem 
                href="/admin/reports" 
                isActive={location.startsWith("/admin/reports")}
              >
                Reports
              </NavItem>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground">Admin</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                  Administrator
                </span>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <button className="bg-muted p-2 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              <div className="ml-3 relative">
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
