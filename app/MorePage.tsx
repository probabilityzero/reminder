import React from 'react';
import { Link } from 'react-router-dom';
import { Cell, List, Title } from '@telegram-apps/telegram-ui';

interface Route {
  path: string;
  title?: string;
  icon?: JSX.Element;
}

export const MorePage: React.FC<{ routes: Route[] }> = ({ routes }) => {
  // Filter out the home page and only show routes with titles
  const navigationRoutes = routes.filter(route => route.title && route.path !== '/');
  
  return (
    <div className="page-container">
      <Title level="1" className="mb-4">
        Navigation
      </Title>
      
      <List>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Cell>Home</Cell>
        </Link>
        
        {navigationRoutes.map(route => (
          <Link key={route.path} to={route.path} style={{ textDecoration: 'none' }}>
            <Cell before={route.icon}>
              {route.title}
            </Cell>
          </Link>
        ))}
      </List>
    </div>
  );
};