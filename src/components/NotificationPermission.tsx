
import React from 'react';
import NotificationToggle from "@/components/dashboard/NotificationToggle";
import { useLocation } from 'react-router-dom';

const NotificationPermission: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sellerId = searchParams.get('seller_id') || localStorage.getItem('hermesAuth') ? 
    JSON.parse(localStorage.getItem('hermesAuth') || '{}').sellerId : null;

  return <NotificationToggle sellerId={sellerId} />;
};

export default NotificationPermission;
