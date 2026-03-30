import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileDetect } from '@/hooks/useMobileDetect';

interface MobileRedirectProps {
  children: React.ReactNode;
}

export const MobileRedirect = ({ children }: MobileRedirectProps) => {
  const { isMobile } = useMobileDetect();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Define public routes that should be accessible on mobile without redirect
    const publicRoutes = ['/', '/fees'];
    const isPublicRoute = publicRoutes.includes(location.pathname) || 
                          location.pathname.startsWith('/mobile') || 
                          location.pathname.startsWith('/auth');

    // Only redirect on desktop routes if user is on mobile
    if (isMobile && !isPublicRoute) {
      // Map desktop routes to mobile equivalents
      const mobileRouteMap: Record<string, string> = {
        '/dashboard': '/mobile/dashboard',
        '/fee-collection': '/mobile/fee-collection',
        '/enrollment': '/mobile/enrollment',
        '/parents': '/mobile/parents',
        '/accounts/income': '/mobile/income',
        '/accounts/expense': '/mobile/expense',
        '/manage-teachers': '/mobile/manage-teachers',
        '/school-settings': '/school-settings',
        '/billing': '/billing',
      };

      const mobilePath = mobileRouteMap[location.pathname] || '/mobile/dashboard';
      navigate(mobilePath, { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);

  return <>{children}</>;
};
