import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { View, UserProfile, AppNotification } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown, getNotificationTypeConfig } from './NotificationDropdown';

// Formatador leve de markdown pro texto de notificações geradas pela IA
// (negrito, títulos # ## ###, listas com - / * / números). Sem dependência
// externa — cobre só a sintaxe que os prompts do app realmente produzem.
const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );
};

const renderMiniMarkdown = (text: string): React.ReactNode[] => {
    const blocks: React.ReactNode[] = [];
    let list: { type: 'ul' | 'ol'; items: string[] } | null = null;

    const flushList = (key: string) => {
        if (!list) return;
        const items = list.items;
        blocks.push(
            list.type === 'ul' ? (
                <ul key={key} className="list-disc pl-5 space-y-1.5 my-3">
                    {items.map((item, i) => <li key={i} className="text-[13px] text-slate-300 leading-relaxed">{renderInlineMarkdown(item)}</li>)}
                </ul>
            ) : (
                <ol key={key} className="list-decimal pl-5 space-y-1.5 my-3">
                    {items.map((item, i) => <li key={i} className="text-[13px] text-slate-300 leading-relaxed">{renderInlineMarkdown(item)}</li>)}
                </ol>
            )
        );
        list = null;
    };

    text.split('\n').forEach((raw, idx) => {
        const line = raw.trim();
        const key = `l-${idx}`;

        if (line === '') { flushList(key); return; }

        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
            flushList(key);
            const size = heading[1].length === 1 ? 'text-base' : heading[1].length === 2 ? 'text-sm' : 'text-[13px]';
            blocks.push(
                <h4 key={key} className={`${size} font-bold text-white mt-4 mb-1.5 first:mt-0`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {renderInlineMarkdown(heading[2])}
                </h4>
            );
            return;
        }

        const bullet = line.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
            if (!list || list.type !== 'ul') { flushList(key); list = { type: 'ul', items: [] }; }
            list.items.push(bullet[1]);
            return;
        }

        const numbered = line.match(/^\d+[.)]\s+(.*)$/);
        if (numbered) {
            if (!list || list.type !== 'ol') { flushList(key); list = { type: 'ol', items: [] }; }
            list.items.push(numbered[1]);
            return;
        }

        flushList(key);
        blocks.push(<p key={key} className="text-[13px] text-slate-300 leading-relaxed my-2 first:mt-0">{renderInlineMarkdown(line)}</p>);
    });
    flushList('final');

    return blocks;
};

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

      {/* Notification Detail Modal — via portal: o wrapper .sticky deste
          Header usa backdrop-blur, o que vira "containing block" de
          qualquer descendente position:fixed e prendia o modal dentro da
          barra de topo (uns 80px) em vez da tela inteira. Portal pro
          document.body escapa desse problema. */}
      {selectedNotification && createPortal((() => {
        const cfg = getNotificationTypeConfig(selectedNotification.tipo);
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-10 overflow-y-auto bg-black/80 backdrop-blur-md">
            <div
              className="w-full max-w-xl rounded-3xl p-6 sm:p-8"
              style={{
                background: 'rgba(10, 12, 18, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 30px 70px -20px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 20px ${cfg.glow}` }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '20px', color: cfg.color, fontVariationSettings: "'FILL' 1" }}>
                      {cfg.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: cfg.color }}>
                      [ {cfg.label} ]
                    </span>
                    <h3
                      className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug truncate"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      title={selectedNotification.titulo}
                    >
                      {selectedNotification.titulo}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
                >
                  <span className="material-symbols-rounded text-lg">close</span>
                </button>
              </div>

              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-4">
                {new Date(selectedNotification.created_at).toLocaleString('pt-BR')}
              </p>

              <div
                className="notif-detail-scroll rounded-2xl p-5 max-h-[45vh] overflow-y-auto"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {renderMiniMarkdown(selectedNotification.mensagem)}
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)' }}
              >
                Compreendido
              </button>
            </div>
          </div>
        );
      })(), document.body)}
    </div>
  );
};
