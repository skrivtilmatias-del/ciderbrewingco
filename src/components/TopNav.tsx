import { NavLink } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { Package, Activity, Wine, Warehouse, Truck, Award } from 'lucide-react';

interface TopNavProps {
  userRole: string | null;
  isMobile?: boolean;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  show: boolean;
}

export const TopNav = ({ userRole, isMobile = false }: TopNavProps) => {
  const isProduction = userRole === 'production';

  const navItems: NavItem[] = [
    {
      to: paths.batches(),
      icon: Package,
      label: 'Batches',
      show: isProduction,
    },
    {
      to: paths.production(),
      icon: Activity,
      label: 'Production',
      show: isProduction,
    },
    {
      to: paths.blending(),
      icon: Wine,
      label: 'Blending',
      show: isProduction,
    },
    {
      to: paths.cellar(),
      icon: Warehouse,
      label: 'Cellar',
      show: isProduction,
    },
    {
      to: paths.suppliers(),
      icon: Truck,
      label: 'Suppliers',
      show: isProduction,
    },
    {
      to: paths.tasting(),
      icon: Award,
      label: 'Tasting',
      show: true,
    },
  ];

  const visibleItems = navItems.filter(item => item.show);

  const getNavClassName = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
    const activeClasses = 'bg-primary text-primary-foreground shadow-sm';
    const inactiveClasses = 'text-muted-foreground hover:text-foreground hover:bg-muted';
    
    if (isMobile) {
      return `${baseClasses} whitespace-nowrap ${isActive ? activeClasses : inactiveClasses}`;
    }
    
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <>
      {visibleItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={getNavClassName}>
          {({ isActive }) => (
            <>
              <item.icon className={`h-4 w-4 ${isMobile ? '' : 'inline-block mr-2'}`} />
              {!isMobile && item.label}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
};
