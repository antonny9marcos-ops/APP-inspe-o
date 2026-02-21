import React from 'react';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
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
            case 'rejeicao': return { name: 'cancel', color: 'text-red-500', bg: 'bg-red-50' };
            case 'update': return { name: 'sync', color: 'text-blue-500', bg: 'bg-blue-50' };
            case 'aviso': return { name: 'warning', color: 'text-amber-500', bg: 'bg-amber-50' };
            default: return { name: 'info', color: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    return (
        <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notificações</h3>
                <button
                    onClick={onMarkAllAsRead}
                    className="text-[10px] font-black text-primary uppercase tracking-tighter hover:underline"
                >
                    Marcar todas como lidas
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    notifications.map((n) => {
                        const icon = getIcon(n.tipo);
                        return (
                            <div
                                key={n.id}
                                onClick={() => onMarkAsRead(n.id)}
                                className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 relative ${!n.lida ? 'bg-blue-50/20' : ''}`}
                            >
                                {!n.lida && <div className="absolute top-6 right-5 w-2 h-2 bg-primary rounded-full"></div>}
                                <div className={`p-2.5 h-10 w-10 rounded-xl ${icon.bg} ${icon.color} flex-shrink-0 flex items-center justify-center`}>
                                    <span className="material-symbols-rounded !text-xl fill-1">{icon.name}</span>
                                </div>
                                <div className="space-y-1 pr-4">
                                    <p className={`text-sm tracking-tight leading-tight ${!n.lida ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                        {n.titulo}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium line-clamp-2">
                                        {n.mensagem}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                        {getTimeAgo(n.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-10 text-center">
                        <div className="bg-slate-50 p-4 rounded-2xl inline-block mb-4">
                            <span className="material-symbols-rounded text-slate-300 !text-3xl">notifications_off</span>
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Nenhuma notificação por aqui.</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50/50 text-center border-t border-slate-50">
                <button
                    onClick={onClose}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};
