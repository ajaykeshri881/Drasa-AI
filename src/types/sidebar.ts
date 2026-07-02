import React from 'react';

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  collapsed?: boolean;
}

export interface RecentItemProps {
  chat: any; // We'll update this later in Phase 3
  isActive?: boolean;
  collapsed?: boolean;
  onPin?: (e: any) => void;
  onDelete?: (e: any) => void;
}
