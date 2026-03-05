
import React, { useState } from 'react';
import { View, UserProfile, AppNotification } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  currentView: View;
  onMenuClick: () => void;
  profile: UserProfile;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick, profile, searchTerm, onSearchChange, onLogout, onRefresh }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getTitle = () => {
    switch (currentView) {
      case View.DASHBOARD: return 'Painel de Controle de Qualidade';
      case View.INSPECTION_FORM: return 'Nova Inspeção Técnica';
      case View.REPORTS: return 'Gestão de Relatórios';
      case View.ANALYTICS: return 'BI & Central de Inteligência'; // Added case for Analytics
      default: return 'Qualidade Industrial';
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'rejeicao': return { name: 'cancel', color: 'text-red-500', bg: 'bg-red-50' };
      case 'update': return { name: 'sync', color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'aviso': return { name: 'warning', color: 'text-amber-500', bg: 'bg-amber-50' };
      default: return { name: 'info', color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  return (
    <header className="flex items-center justify-between sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0">
      {/* ... existing code ... */}
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
              onViewDetails={(n) => {
                setSelectedNotification(n);
                setShowNotifications(false);
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <button
            onClick={() => onRefresh?.()}
            className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-all active:rotate-180 duration-500"
            title="Sincronizar Dados"
          >
            <span className="material-symbols-rounded !text-xl">sync</span>
          </button>
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

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className={`p-4 rounded-2xl ${getNotificationIcon(selectedNotification.tipo).bg} ${getNotificationIcon(selectedNotification.tipo).color}`}>
                <span className="material-symbols-rounded !text-3xl fill-1">
                  {getNotificationIcon(selectedNotification.tipo).name}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="p-8 pt-6 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {selectedNotification.titulo}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">
                  Enviado em {new Date(selectedNotification.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mt-6 overflow-y-auto max-h-[300px] custom-scrollbar">
                <p className="text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap">
                  {selectedNotification.mensagem}
                </p>
              </div>

              {selectedNotification.tipo === 'aviso' && (
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                  <span className="material-symbols-rounded text-indigo-500 mt-1">lightbulb</span>
                  <div>
                    <p className="text-sm font-black text-indigo-900 mb-1">Diretriz da IA</p>
                    <p className="text-xs text-indigo-600 font-medium font-bold">Consulte o painel de Análises Avançadas para ver os dados detalhados e iniciar o protocolo de correção.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedNotification(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/20 mt-4"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
