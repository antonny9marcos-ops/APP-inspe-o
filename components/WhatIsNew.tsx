import React from 'react';

interface WhatIsNewProps {
    onClose: () => void;
}

const updates = [
    {
        title: "Suporte Multi-Setor (Visão Global)",
        description: "Agora você pode visualizar e exportar dados de todas as unidades (Carajás, São Luis, S11D) de uma só vez com o novo filtro 'TODOS'.",
        icon: "public",
        color: "bg-indigo-500"
    },
    {
        title: "Filtros Ultra-Rápidos",
        description: "Otimizamos o carregamento dos dados. Agora, os gráficos e tabelas atualizam instantaneamente ao clicar em qualquer filtro.",
        icon: "bolt",
        color: "bg-amber-500"
    },
    {
        title: "Relatórios Inteligentes",
        description: "A exportação para Excel agora respeita automaticamente os filtros de setor e categoria selecionados na tela.",
        icon: "table_chart",
        color: "bg-emerald-500"
    },
    {
        title: "Interface Compacta e Fluida",
        description: "Melhoramos o visual dos rankings e dashboards para serem mais compactos e fáceis de ler em qualquer dispositivo.",
        icon: "dashboard_customize",
        color: "bg-blue-500"
    },
    {
        title: "Rastreabilidade por Unidade",
        description: "Agora o setor de cada material é exibido diretamente no card de detalhes, facilitando a identificação da origem.",
        icon: "location_home",
        color: "bg-rose-500"
    }
];

export const WhatIsNew: React.FC<WhatIsNewProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                
                {/* Header with Background Pattern */}
                <div className="relative bg-[#137fec] p-10 overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl ring-1 ring-white/30">
                            <span className="material-symbols-rounded !text-4xl text-white fill-1">celebration</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">O que há de novo?</h2>
                        <p className="text-indigo-100/80 text-sm font-medium mt-2 uppercase tracking-widest">Versão 1.2 • Atualizado com Sucesso</p>
                    </div>
                </div>

                {/* Updates List */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 custom-scrollbar">
                    {updates.map((update, index) => (
                        <div key={index} className="flex gap-6 group">
                            <div className={`w-12 h-12 shrink-0 ${update.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-rounded !text-2xl">{update.icon}</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-800 leading-tight">{update.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{update.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-8 sm:p-10 border-t border-slate-50 bg-slate-50/50 flex flex-col items-center gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-[#137fec] text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Vamos lá!
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua produtividade é nossa prioridade</p>
                </div>
            </div>
        </div>
    );
};
