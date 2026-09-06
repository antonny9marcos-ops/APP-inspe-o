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
    const unread = notifications.filter(n => !n.lida).length;

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diffInMinutes < 1) return 'Agora mesmo';
        if (diffInMinutes < 60) return `${diffInMinutes}m atras`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atras`;
        return date.toLocaleDateString('pt-BR');
    };

    const getTypeConfig = (tipo: string) => {
        switch (tipo) {
            case 'rejeicao': return { icon: 'cancel', label: 'REJEICAO', color: '#f87171', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', glow: 'rgba(239,68,68,0.15)' };
            case 'update':   return { icon: 'sync', label: 'ATUALIZACAO', color: '#60a5fa', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', glow: 'rgba(59,130,246,0.15)' };
            case 'aviso':    return { icon: 'warning_amber', label: 'AVISO', color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.15)' };
            default:         return { icon: 'info', label: 'INFO', color: '#94a3b8', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', glow: 'rgba(100,116,139,0.10)' };
        }
    };

    return (
        <div
            className="absolute top-full right-0 mt-3 z-50 overflow-hidden"
            style={{
                width: '26rem',
                background: 'rgba(8,12,20,0.97)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: 'notifSlideDown 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
        >
            <style>{`
                @keyframes notifSlideDown {
                    from { opacity:0; transform:translateY(-8px) scale(0.97); }
                    to   { opacity:1; transform:translateY(0)    scale(1);    }
                }
                .notif-scroll::-webkit-scrollbar { width:4px; }
                .notif-scroll::-webkit-scrollbar-track { background:transparent; }
                .notif-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:10px; }
                .notif-item:hover { background:rgba(255,255,255,0.03) !important; }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', boxShadow:'0 0 16px rgba(59,130,246,0.15)' }}>
                        <span className="material-symbols-rounded text-blue-400" style={{ fontSize:'16px', fontVariationSettings:"'FILL' 1" }}>notifications</span>
                    </div>
                    <div>
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold">[ CENTRAL_DE_ALERTAS ]</span>
                        <p className="font-mono text-[9px] text-slate-600 mt-0.5">
                            {unread > 0 ? `${unread} nao lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onMarkAllAsRead}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
                        <span className="material-symbols-rounded" style={{ fontSize:'14px' }}>done_all</span>
                        Lidas
                    </button>
                    <div style={{ width:'1px', height:'16px', background:'rgba(255,255,255,0.08)', margin:'0 2px' }} />
                    <button onClick={onClearAll}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/[0.06] transition-all cursor-pointer"
                        style={{ color:'rgba(248,113,113,0.7)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize:'14px' }}>delete_sweep</span>
                        Limpar
                    </button>
                </div>
            </div>

            {/* Counter bar */}
            {notifications.length > 0 && (
                <div className="px-5 py-2 flex items-center justify-between"
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)' }}>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">TOTAL · {notifications.length}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="font-mono text-[9px] text-blue-400/80 uppercase tracking-wider">{unread} PENDENTE{unread !== 1 ? 'S' : ''}</span>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="notif-scroll overflow-y-auto" style={{ maxHeight:'380px' }}>
                {notifications.length > 0 ? (
                    <div style={{ padding:'6px' }}>
                        {notifications.map((n, idx) => {
                            const cfg = getTypeConfig(n.tipo);
                            return (
                                <div key={n.id} className="notif-item cursor-pointer relative"
                                    style={{
                                        borderRadius:'12px', padding:'12px',
                                        marginBottom: idx < notifications.length - 1 ? '2px' : 0,
                                        background: !n.lida ? 'rgba(59,130,246,0.05)' : 'transparent',
                                        border: !n.lida ? '1px solid rgba(59,130,246,0.12)' : '1px solid transparent',
                                        transition:'background 0.15s ease',
                                    }}
                                    onClick={() => { onViewDetails(n); if (!n.lida) onMarkAsRead(n.id); }}
                                >
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                                            style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, boxShadow:`0 0 12px ${cfg.glow}` }}>
                                            <span className="material-symbols-rounded"
                                                style={{ fontSize:'18px', color:cfg.color, fontVariationSettings:"'FILL' 1" }}>
                                                {cfg.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                                                    style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                                                    {cfg.label}
                                                </span>
                                                <span className="font-mono text-[9px] text-slate-600">{getTimeAgo(n.created_at)}</span>
                                            </div>
                                            <p className="text-xs leading-snug truncate"
                                                style={{ fontFamily:"'Inter',sans-serif", fontWeight:!n.lida ? 700 : 500, color:!n.lida ? '#f1f5f9' : '#94a3b8' }}>
                                                {n.titulo}
                                            </p>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed mt-0.5"
                                                style={{ fontFamily:"'Inter',sans-serif" }}>
                                                {n.mensagem}
                                            </p>
                                        </div>
                                    </div>
                                    {!n.lida && (
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-400"
                                            style={{ boxShadow:'0 0 8px #60a5fa' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                            <span className="material-symbols-rounded text-slate-600" style={{ fontSize:'26px' }}>notifications_off</span>
                        </div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-1">NENHUM_ALERTA</p>
                        <p className="text-xs text-slate-500" style={{ fontFamily:"'Inter',sans-serif" }}>Sem notificacoes recentes no sistema.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3"
                style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)' }}>
                <span className="font-mono text-[9px] text-slate-700 uppercase tracking-widest">MC_QC · ALERTAS</span>
                <button onClick={onClose}
                    className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-rounded" style={{ fontSize:'14px' }}>close</span>
                    Fechar
                </button>
            </div>
        </div>
    );
};
