import { Home, DollarSign, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const staffNavItems: NavItem[] = [
  { path: '/mobile/dashboard', label: 'Home', icon: Home },
  { path: '/mobile/fee-collection', label: 'Fees', icon: DollarSign },
  { path: '/mobile/enrollment', label: 'Enroll', icon: UserPlus },
  { path: '/mobile/income', label: 'Income', icon: TrendingUp },
  { path: '/mobile/expense', label: 'Expense', icon: TrendingDown },
];

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole = 'staff' }: MobileNavProps) {
  const navItems = staffNavItems;

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-card/95 backdrop-blur-md border-t-2 border-accent/30',
      'pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.08)]'
    )}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex flex-col items-center justify-center',
                'touch-target flex-1',
                'transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'p-1.5 rounded-full transition-colors',
                    isActive && 'bg-primary/10'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isActive && 'stroke-[2.5]'
                    )} />
                  </div>
                  <span className={cn(
                    'text-xs mt-0.5',
                    isActive && 'font-semibold'
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}