import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Apple, LogOut, Settings2, FlaskConical, QrCode, Layout, DollarSign, Webhook, Download, TrendingUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TopNav } from '@/components/TopNav';
import { paths } from '@/routes/paths';

interface AppLayoutProps {
  children: ReactNode;
  userRole: string | null;
  userProfile: any;
}

export const AppLayout = ({ children, userRole, userProfile }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate(paths.auth());
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Apple className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-semibold">CiderTrack</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <TopNav userRole={userRole} />
              {userRole === "production" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${location.pathname.startsWith('/tools') || location.pathname.startsWith('/planning') || location.pathname.startsWith('/webhooks') || location.pathname.startsWith('/install') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                      <Settings2 className="h-4 w-4 inline-block mr-2" />
                      Tools
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(paths.tools.analytics())}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.calculators())}>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Calculators
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.printLabels())}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Print Labels
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.floorPlan())}>
                      <Layout className="h-4 w-4 mr-2" />
                      Floor Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.costCalculation())}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Cost Calculation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.planning())}>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Planning Tool
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.webhooks())}>
                      <Webhook className="h-4 w-4 mr-2" />
                      Webhooks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(paths.tools.install())}>
                      <Download className="h-4 w-4 mr-2" />
                      Install
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userProfile?.full_name || 'User'}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleSignOut} variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 bg-muted/50 rounded-lg p-1">
            <TopNav userRole={userRole} isMobile />
            {userRole === "production" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname.startsWith('/tools') || location.pathname.startsWith('/planning') || location.pathname.startsWith('/webhooks') || location.pathname.startsWith('/install') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                    <Settings2 className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(paths.tools.analytics())}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.calculators())}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Calculators
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.printLabels())}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Print Labels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.floorPlan())}>
                    <Layout className="h-4 w-4 mr-2" />
                    Floor Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.costCalculation())}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Cost Calculation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.planning())}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Planning Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.webhooks())}>
                    <Webhook className="h-4 w-4 mr-2" />
                    Webhooks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(paths.tools.install())}>
                    <Download className="h-4 w-4 mr-2" />
                    Install
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};
