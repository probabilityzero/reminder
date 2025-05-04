import { Link, useLocation } from 'react-router-dom';
import { Button, FixedLayout } from '@telegram-apps/telegram-ui';
import { ComponentType, JSX } from 'react';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

interface NavigationProps {
  routes: Route[];
}

export const Navigation = ({ routes }: NavigationProps) => {
  const location = useLocation();

  // Only show main routes with titles in navigation
  const mainRoutes = routes.filter(route => route.title && route.path !== '/');

  return (
    <FixedLayout vertical="bottom">
      <div className="navigation-buttons">
        <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
          {/* Home button is always visible */}
          <Link to="/" style={{ textDecoration: 'none', flexGrow: 1 }}>
            <Button
              size="m"
              mode={location.pathname === '/' ? 'filled' : 'outline'}
              stretched
            >
              Home
            </Button>
          </Link>

          {/* Show only 1-2 additional important routes as buttons */}
          {mainRoutes.slice(0, 2).map((route) => (
            <Link 
              key={route.path} 
              to={route.path} 
              style={{ textDecoration: 'none', flexGrow: 1 }}
            >
              <Button
                size="m"
                mode={location.pathname === route.path ? 'filled' : 'outline'}
                stretched
              >
                {route.title}
              </Button>
            </Link>
          ))}

          {/* If we have more than 3 routes, add a "More" button */}
          {mainRoutes.length > 2 && (
            <Link 
              to="/more" 
              style={{ textDecoration: 'none', flexGrow: 1 }}
            >
              <Button
                size="m"
                mode={location.pathname === '/more' ? 'filled' : 'outline'}
                stretched
              >
                More
              </Button>
            </Link>
          )}
        </div>
      </div>
    </FixedLayout>
  );
};