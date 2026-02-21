
import React, { useState } from 'react';
import { View, UserProfile } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  currentView: View;
  onMenuClick: () => void;
  profile: UserProfile;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick, profile, searchTerm, onSearchChange, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getTitle = () => {
    switch (currentView) {
      case View.DASHBOARD: return 'Painel de Controle de Qualidade';
      case View.INSPECTION_FORM: return 'Nova Inspeção Técnica';
      case View.REPORTS: return 'Gestão de Relatórios';
      default: return 'Qualidade Industrial';
    }
  };

  return (
    <header className="flex items-center justify-between sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <span className="material-symbols-rounded">menu</span>
        </button>
        <h2 className="text-slate-900 text-lg font-bold tracking-tight">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden md:flex relative">
          <div className="flex w-64 items-center rounded-xl h-11 bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="text-slate-400 pl-4">
              <span className="material-symbols-rounded !text-xl">search</span>
            </div>
            <input
              className="w-full border-none bg-transparent focus:ring-0 text-sm placeholder:text-slate-400"
              placeholder="Buscar dados..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`flex items-center justify-center rounded-xl h-11 w-11 transition-colors relative ${showNotifications ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-rounded !text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={(id) => markAsRead(id)}
              onMarkAllAsRead={markAllAsRead}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-bold text-slate-900">{profile.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{profile.role}</p>
          </div>
          <img src={profile.avatar} className="h-10 w-10 rounded-full border-2 border-white shadow-sm" alt="User" />
          <button
            onClick={onLogout}
            className="flex items-center justify-center rounded-xl h-10 w-10 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
            title="Sair"
          >
            <span className="material-symbols-rounded !text-xl">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
