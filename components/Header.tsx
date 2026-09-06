import React, { useState, useEffect } from 'react';
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
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onMenuClick, 
  profile, 
  searchTerm, 
  onSearchChange, 
  onLogout, 
  onRefresh, 
  theme = 'light',
  onToggleTheme,
  children 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (currentView) {
      case View.DASHBOARD: return { code: '01', title: 'PAINEL DE CONTROLE DE QUALIDADE', desc: 'Métricas analíticas em tempo real' };
      case View.INSPECTION_FORM: return { code: '02', title: 'REGISTRO DE NOVA INSPEÇÃO', desc: 'Auditoria e conformidade de materiais' };
      case View.MATERIALS: return { code: '03', title: 'CATÁLOGO DE MATERIAIS & LOTES', desc: 'Base de dados e especificações' };
      case View.REPORTS: return { code: '04', title: 'RELATÓRIOS & EXPORTAÇÃO', desc: 'Histórico consolidado e emissão de laudos' };
      case View.ANALYTICS: return { code: '05', title: 'INTELIGÊNCIA & BI OPERACIONAL', desc: 'Análise preditiva de defeitos e fornecedores' };
      case View.USERS: return { code: '06', title: 'GESTÃO & CONTROLE DE ACESSO', desc: 'Permissões e usuários do sistema' };
      case View.SETTINGS: return { code: '07', title: 'CONFIGURAÇÕES DO SISTEMA', desc: 'Parâmetros de integração e alertas' };
      default: return { code: '00', title: 'MC INDUSTRIAL', desc: 'Sistema de Inspeção de Qualidade' };
    }
  };

  const viewInfo = getTitle();

  return (
    <div className="sticky top-0 z-30 flex flex-col shrink-0 bg-[#05060A]/85 backdrop-blur-2xl border-b border-white/[0.06] select-none font-sans">
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4">
        
        {/* Left Side: View Telemetry & Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white"
          >
            <span className="material-symbols-rounded text-xl">menu</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 font-bold">
                [ {viewInfo.code} // {viewInfo.title} ]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
              {viewInfo.desc}
            </p>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-6">
          {children || (
            <div className="flex w-full items-center rounded-xl h-10 px-3.5 gap-2.5 bg-white/[0.03] border border-white/[0.08] focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all">
              <span className="material-symbols-rounded text-slate-500 text-base">search</span>
              <input
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                placeholder="Buscar inspeções, materiais ou fornecedores..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <span className="font-mono text-[9px] text-slate-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Telemetry Actions & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Live UTC Clock */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500">UTC:</span>
            <span className="text-slate-300 font-bold">{currentTime}</span>
          </div>

          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Sincronizar dados"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all group cursor-pointer"
            >
              <span className="material-symbols-rounded text-lg group-hover:rotate-180 transition-transform duration-500">
                sync
              </span>
            </button>
          )}

          {/* Theme Switcher Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Mudar para Modo Claro (Padrão)' : 'Mudar para Modo Escuro'}
              className={`h-9 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer group font-mono text-[10px] uppercase font-bold tracking-wider ${
                theme === 'light'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20'
                  : 'bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400/20'
              }`}
            >
              <span className="material-symbols-rounded text-base sm:text-lg group-hover:rotate-45 transition-transform duration-300">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'CLARO' : 'ESCURO'}
              </span>
            </button>
          )}

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all relative cursor-pointer"
            >
              <span className="material-symbols-rounded text-lg">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[9px] font-black flex items-center justify-center border-2 border-[#05060A]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={(id) => markAsRead(id)}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
                onClose={() => setShowNotifications(false)}
                onViewDetails={(n) => {
                  setSelectedNotification(n);
                  setShowNotifications(false);
                }}
              />
            )}
          </div>

          <div className="w-[1px] h-6 bg-white/[0.08] mx-0.5" />

          {/* User Quick Info */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-bold text-white leading-tight">{profile.name}</span>
              <span className="font-mono text-[9px] uppercase text-blue-400 tracking-wider">{profile.role}</span>
            </div>
            
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-9 h-9 rounded-xl object-cover border border-white/10"
            />

            {/* Logout Action */}
            <button
              onClick={onLogout}
              title="Encerrar sessão"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
            >
              <span className="material-symbols-rounded text-lg">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex w-full items-center rounded-xl h-9 px-3 gap-2 bg-white/[0.03] border border-white/[0.08]">
          <span className="material-symbols-rounded text-slate-500 text-sm">search</span>
          <input
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            placeholder="Buscar dados..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#090B12] border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">
                [ ALERTA_DO_SISTEMA ]
              </span>
              <button
                onClick={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-rounded text-base">close</span>
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {selectedNotification.titulo}
              </h3>
              <p className="font-mono text-[10px] text-slate-500 mt-1">
                {new Date(selectedNotification.created_at).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 max-h-56 overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                {selectedNotification.mensagem}
              </p>
            </div>

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Compreendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
