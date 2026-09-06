import React from 'react';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
    onClose: () => void;
    onViewDetails: (notification: AppNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearAll,
    onClose,
    onViewDetails,
}) => {
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Agora mesmo';
        if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'rejeicao': return { name: 'cancel', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
            case 'update': return { name: 'sync', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
            case 'aviso': return { name: 'warning', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
            default: return { name: 'info', color: '#94a3b8', bg: 'rgba(100, 116, 139, 0.15)', border: 'rgba(100, 116, 139, 0.3)' };
        }
    };

    return (
        <div 
            className="absolute top-full right-0 mt-3 w-80 md:w-96 rounded-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl"
            style={{
                background: 'rgba(13, 20, 33, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.1)'
            }}
        >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Notificações
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors"
                    >
                        Lidas
                    </button>
                    <div className="w-[1px] h-3 bg-white/10" />
                    <button
                        onClick={onClearAll}
                        className="text-[10px] font-bold text-red-400 uppercase tracking-wider hover:text-red-300 transition-colors"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {notifications.length > 0 ? (
                    notifications.map((n) => {
                        const icon = getIcon(n.tipo);
                        return (
                            <div
                                key={n.id}
                                onClick={() => {
                                    onViewDetails(n);
                                    if (!n.lida) onMarkAsRead(n.id);
                                }}
                                className={`p-4 flex gap-3.5 hover:bg-white/[0.04] transition-all cursor-pointer relative ${!n.lida ? 'bg-blue-500/[0.06]' : ''}`}
                            >
                                {!n.lida && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" />}
                                <div 
                                    className="p-2 h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                                    style={{
                                        background: icon.bg,
                                        border: `1px solid ${icon.border}`,
                                        color: icon.color
                                    }}
                                >
                                    <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {icon.name}
                                    </span>
                                </div>
                                <div className="space-y-1 pr-3 flex-1 min-w-0">
                                    <p className={`text-xs tracking-tight leading-snug truncate ${!n.lida ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                        {n.titulo}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-normal line-clamp-2 leading-relaxed">
                                        {n.mensagem}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">
                                        {getTimeAgo(n.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
                            <span className="material-symbols-rounded text-2xl">notifications_off</span>
                        </div>
                        <p className="text-slate-400 font-medium text-xs">Nenhuma notificação recente.</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-white/[0.02] text-center border-t border-white/10">
                <button
                    onClick={onClose}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Fechar painel
                </button>
            </div>
        </div>
    );
};
