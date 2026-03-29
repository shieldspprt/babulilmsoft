import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const { user } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Global Pathways", path: "/global-pathways" },
    { name: "Leadership", path: "/leadership" },
    { name: "Activities", path: "/activities" },
    { name: "Uniforms", path: "/uniforms" },
    { name: "Fee Concessions", path: "/fees" },
  ];

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm z-50 border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3" aria-label="BAB UL ILM K12 International School - Home">
            <img 
              src={logo} 
              alt="BAB UL ILM K12 International School Logo - Islamic education with modern learning in Mananwala, Punjab" 
              className="h-16 md:h-20 w-auto" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
            {user ? (
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard">Admin Dashboard</Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">Staff Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.path}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
                {user ? (
                  <Button variant="default" asChild className="w-full">
                    <Link to="/dashboard">Admin Dashboard</Link>
                  </Button>
                ) : (
                  <Button variant="default" asChild className="w-full">
                    <Link to="/auth">Staff Login</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
