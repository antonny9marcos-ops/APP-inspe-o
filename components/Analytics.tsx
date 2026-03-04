import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, Cell, AreaChart, Area
} from 'recharts';
import { Inspection } from '../types';

import { supabase } from '../lib/supabase';

interface AnalyticsProps {
    inspections: Inspection[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ inspections }) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    // 1. Dados da Análise de Pareto (Motivos de Rejeição)
    const paretoData = useMemo(() => {
        const reasonsMap: Record<string, number> = inspections.reduce((acc: Record<string, number>, ins) => {
            if (ins.status === 'Rejeitado') {
                const reason = ins.motivoRejeicao || 'Não especificado';
                acc[reason] = (acc[reason] || 0) + (ins.qtdRejeitada || 0);
            }
            return acc;
        }, {});

        const sortedReasons = Object.entries(reasonsMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const totalRejections = sortedReasons.reduce((sum, r) => sum + r.count, 0);
        let cumulativeCount = 0;

        return sortedReasons.map(r => {
            cumulativeCount += r.count;
            return {
                ...r,
                percentage: totalRejections > 0 ? Math.round((cumulativeCount / totalRejections) * 100) : 0
            };
        });
    }, [inspections]);

    // 2. Dados do Mapa de Calor (Material vs Defeito)
    const heatmapData = useMemo(() => {
        const materials = Array.from(new Set(inspections.filter(i => i.status === 'Rejeitado').map(i => i.descricao || i.material).filter(Boolean))).slice(0, 8);
        const motives = Array.from(new Set(inspections.filter(i => i.status === 'Rejeitado').map(i => i.motivoRejeicao).filter(Boolean))).slice(0, 6);

        return materials.map(m => {
            const data: Record<string, any> = { name: m };
            motives.forEach(mot => {
                if (mot) {
                    data[mot as string] = inspections
                        .filter(i => (i.descricao === m || i.material === m) && i.motivoRejeicao === mot)
                        .reduce((sum, i) => sum + (i.qtdRejeitada || 0), 0);
                }
            });
            return data;
        });
    }, [inspections]);

    // 3. Scorecard de Confiabilidade do Fornecedor
    const supplierReliability = useMemo(() => {
        const stats = inspections.reduce((acc: Record<string, any>, ins) => {
            if (!acc[ins.fornecedor]) {
                acc[ins.fornecedor] = { name: ins.fornecedor, totalQty: 0, approvedQty: 0, rejectedQty: 0 };
            }
            acc[ins.fornecedor].totalQty += (ins.qtdInspecionada || 0);
            acc[ins.fornecedor].approvedQty += (ins.qtdAprovada || 0);
            acc[ins.fornecedor].rejectedQty += (ins.qtdRejeitada || 0);
            return acc;
        }, {});

        return Object.values(stats)
            .map((s: any) => {
                const reliability = s.totalQty > 0 ? (s.approvedQty / s.totalQty) * 100 : 0;
                return { ...s, reliability: Math.round(reliability) };
            })
            .sort((a, b) => b.reliability - a.reliability)
            .slice(0, 6);
    }, [inspections]);

    // 4. Lógica de Previsão (Análise de Tendência Simples)
    const predictionData = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        const currentInspections = inspections.filter(i => new Date(i.data + 'T00:00:00').getTime() >= thirtyDaysAgo.getTime());
        const previousInspections = inspections.filter(i => {
            const date = new Date(i.data + 'T00:00:00').getTime();
            return date >= sixtyDaysAgo.getTime() && date < thirtyDaysAgo.getTime();
        });

        const currentTotalQty = currentInspections.reduce((sum, i) => sum + (i.qtdInspecionada || 0), 0);
        const currentRejectedQty = currentInspections.reduce((sum, i) => sum + (i.qtdRejeitada || 0), 0);
        const currentRate = currentTotalQty > 0 ? (currentRejectedQty / currentTotalQty) * 100 : 0;

        const previousTotalQty = previousInspections.reduce((sum, i) => sum + (i.qtdInspecionada || 0), 0);
        const previousRejectedQty = previousInspections.reduce((sum, i) => sum + (i.qtdRejeitada || 0), 0);
        const previousRate = previousTotalQty > 0 ? (previousRejectedQty / previousTotalQty) * 100 : 0;

        // --- SPC Logic (Statistical Process Control) ---
        const dailyRates = Array.from({ length: 60 }).map((_, i) => {
            const start = new Date(now.getTime() - ((i + 1) * 24 * 60 * 60 * 1000));
            const end = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayInspections = inspections.filter(ins => {
                const d = new Date(ins.data + 'T00:00:00').getTime();
                return d >= start.getTime() && d < end.getTime();
            });
            const total = dayInspections.reduce((sum, ins) => sum + (ins.qtdInspecionada || 0), 0);
            const rejected = dayInspections.reduce((sum, ins) => sum + (ins.qtdRejeitada || 0), 0);
            return total > 0 ? (rejected / total) * 100 : null;
        }).filter(r => r !== null) as number[];

        const meanRate = dailyRates.length > 0 ? dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length : 0;
        const variance = dailyRates.length > 0 ? dailyRates.reduce((a, b) => a + Math.pow(b - meanRate, 2), 0) / dailyRates.length : 0;
        const stdDev = Math.sqrt(variance);

        const trend = currentRate - previousRate;

        // Highest rejected material insight
        const materialStats: Record<string, number> = currentInspections.reduce((acc: any, i) => {
            const name = i.descricao || i.material;
            acc[name] = (acc[name] || 0) + (i.qtdRejeitada || 0);
            return acc;
        }, {});

        const topDefectMaterial = Object.entries(materialStats).sort((a, b) => b[1] - a[1])[0];

        // Insight de fornecedor em risco
        const supplierStats: Record<string, { total: number, rejected: number }> = currentInspections.reduce((acc: any, i) => {
            if (!acc[i.fornecedor]) acc[i.fornecedor] = { total: 0, rejected: 0 };
            acc[i.fornecedor].total += (i.qtdInspecionada || 0);
            acc[i.fornecedor].rejected += (i.qtdRejeitada || 0);
            return acc;
        }, {});

        const topRiskSupplier = Object.entries(supplierStats)
            .map(([name, stats]) => ({ name, rate: (stats.rejected / stats.total) * 100 }))
            .sort((a, b) => b.rate - a.rate)[0];

        // Anomaly detected if currentRate is > mean + 2*stdDev (95% confidence)
        const isAnomaly = currentRate > (meanRate + 2 * stdDev) && currentTotalQty > 0;

        // Forecast with Risk Buffer: Prevent dropping to 0% if there are active rejections
        let rawProjection = currentRate + (trend * 0.5);
        const riskBuffer = currentRejectedQty > 0 ? (currentRate * 0.3) : 0; // 30% of current rate as floor
        const predictedRate = Math.max(riskBuffer, rawProjection);

        return {
            predictedRate,
            insights: [
                isAnomaly
                    ? { icon: 'error', color: 'text-rose-400', text: `Anomalia Detectada: A taxa atual de ${currentRate.toFixed(1)}% está estatisticamente fora de controle (SPC).` }
                    : topDefectMaterial && topDefectMaterial[1] > 0
                        ? { icon: 'warning', color: 'text-amber-400', text: `Atenção: ${topDefectMaterial[0]} representa o maior volume de peças rejeitadas recentemente.` }
                        : { icon: 'check_circle', color: 'text-emerald-400', text: 'Fluxo produtivo dentro dos limites estatísticos de controle.' },
                topRiskSupplier && topRiskSupplier.rate > 0
                    ? { icon: 'trending_up', color: 'text-rose-400', text: `Risco: ${topRiskSupplier.name} está com taxa de rejeição de ${topRiskSupplier.rate.toFixed(1)}%.` }
                    : { icon: 'info', color: 'text-blue-400', text: 'Estabilidade detectada no fluxo de fornecimento atual.' }
            ]
        };
    }, [inspections]);

    const handleGenerateActionPlan = async () => {
        setIsGenerating(true);
        try {
            // 1. Get all users with roles ADMIN, CLIENTE, INSPETOR
            const { data: users, error: userError } = await supabase
                .from('perfis')
                .select('id')
                .in('role', ['Admin', 'Cliente', 'Inspetor']);

            if (userError) throw userError;
            if (!users || users.length === 0) return;

            // 2. Generate a structured Action Plan based on insights
            const primaryInsight = predictionData.insights[0];
            const secondaryInsight = predictionData.insights[1];

            const detailedPlan = `
PLANOS DE AÇÃO RECOMENDADOS:

1. CONTROLE DE MATERIAL: ${primaryInsight.text}
   - Ação: Iniciar inspeção 100% no próximo lote recebido.
   - Responsável: Equipe de Recebimento.

2. GESTÃO DE FORNECEDORES: ${secondaryInsight.text}
   - Ação: Agendar auditoria extraordinária de processo ou solicitar RNC (Relatório de Não Conformidade).
   - Prazo: Imediato.

3. MONITORAMENTO:
   - Ação: Revisar tolerâncias de medição e calibragem de equipamentos envolvidos.
            `.trim();

            // 3. Prepare notifications for all these users
            const notifications = users.map(user => ({
                user_id: user.id,
                titulo: '📋 Plano de Ação Estratégico',
                mensagem: detailedPlan,
                tipo: 'aviso',
                lida: false
            }));

            // 3. Bulk Insert
            const { error: notifyError } = await supabase
                .from('notificacoes')
                .insert(notifications);

            if (notifyError) throw notifyError;

            alert(`Plano de ação detalhado enviado com sucesso para ${users.length} usuários.`);
        } catch (error: any) {
            console.error('Erro ao gerar plano de ação:', error);
            alert('Falha ao gerar o plano de ação: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-10 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200">
                        <span className="material-symbols-rounded !text-3xl fill-1">monitoring</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inteligência de Qualidade</h1>
                        <p className="text-slate-500 mt-1 font-medium">Insights avançados e análise de causa raiz (Pareto & Correlação)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pareto Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Análise de Pareto (Regra 80/20)</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Motivos de Rejeição vs Eficiência Acumulada</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={paretoData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    allowDecimals={false}
                                    label={{ value: 'Quantidade de Peças', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10, fontWeight: 800 } }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6366f1', fontSize: 10, fontWeight: 700 }}
                                    unit="%"
                                    domain={[0, 100]}
                                    label={{ value: '% Acumulada', angle: 90, position: 'insideRight', style: { fill: '#6366f1', fontSize: 10, fontWeight: 800 } }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: any, name: string) => {
                                        if (name === 'count' || name === 'Ocorrências') return [value, 'Qtd Rejeitada'];
                                        if (name === 'percentage' || name === '% Acumulada') return [`${value}%`, '% Acumulada'];
                                        return [value, name];
                                    }}
                                />
                                <Bar name="Ocorrências" yAxisId="left" dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                                <Line name="% Acumulada" yAxisId="right" type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Heatmap/Matrix View */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Matriz de Defeitos por Material</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Correlação entre componentes e principais falhas</p>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr>
                                    <th className="w-[35%] p-4 bg-slate-50 sticky left-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Material</th>
                                    {heatmapData[0] && Object.keys(heatmapData[0]).filter(k => k !== 'name').map(mot => (
                                        <th key={mot} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center leading-[1.1] break-words whitespace-normal align-middle">{mot}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(heatmapData as Record<string, any>[]).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 bg-white sticky left-0 z-10 text-xs font-black text-slate-900 border-b border-slate-50 truncate">{row.name}</td>
                                        {Object.keys(row).filter(k => k !== 'name').map(mot => {
                                            const value = (row as Record<string, any>)[mot];
                                            const opacity = value > 0 ? Math.min(0.1 + (value * 0.2), 0.9) : 0.02;
                                            return (
                                                <td key={mot} className="p-1 border-b border-slate-50">
                                                    <div
                                                        className={`h-12 w-full rounded-xl flex items-center justify-center text-xs font-black transition-all shadow-sm ${value > 0 ? 'text-white shadow-indigo-100' : 'text-slate-300'}`}
                                                        style={{
                                                            backgroundColor: value > 0 ? `rgba(79, 70, 229, ${opacity + 0.1})` : 'transparent',
                                                            boxShadow: value > 0 ? `0 4px 12px rgba(79, 70, 229, ${opacity * 0.4})` : 'none'
                                                        }}
                                                    >
                                                        {value}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Supplier Reliability Scorecard */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Índice de Confiabilidade do Fornecedor</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Performance baseada em conformidade e volume histórico</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {supplierReliability.map((s) => (
                            <div key={s.name} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-black text-slate-900 line-clamp-1">{s.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inspecionadas: {s.totalQty.toLocaleString()}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tighter shadow-sm ${s.reliability >= 90 ? 'bg-emerald-500 text-white' : s.reliability >= 70 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        PONTUAÇÃO {s.reliability}
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${s.reliability >= 90 ? 'bg-emerald-500' : s.reliability >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${s.reliability}%` }}
                                    ></div>
                                </div>
                                <div className="mt-4 flex gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Qtd Aprovada</p>
                                        <p className="text-xs font-black text-emerald-600">{s.approvedQty.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Qtd Rejeitada</p>
                                        <p className="text-xs font-black text-rose-600">{s.rejectedQty.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prediction / Trend Area */}
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black tracking-tight mb-2">Previsão Próximo Ciclo</h3>
                        <p className="text-indigo-100 text-xs font-medium opacity-80 mb-8 uppercase tracking-widest">Estimativa baseada em tendências mensais</p>

                        <div className="space-y-8">
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black tracking-tighter">~{predictionData.predictedRate.toFixed(1)}%</span>
                                <span className="text-indigo-200 font-bold mb-2 uppercase text-[10px] tracking-widest">Taxa de Rejeição</span>
                            </div>

                            <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <p className="text-xs font-bold text-indigo-100 mb-4 uppercase tracking-widest">Insights da IA</p>
                                <ul className="space-y-4">
                                    {predictionData.insights.map((insight, idx) => (
                                        <li key={idx} className="flex gap-3">
                                            <span className={`material-symbols-rounded !text-lg ${insight.color}`}>{insight.icon}</span>
                                            <p className="text-xs font-medium leading-relaxed">{insight.text}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={handleGenerateActionPlan}
                                disabled={isGenerating}
                                className={`w-full py-4 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95 mt-4 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? 'Enviando Plano...' : 'Gerar Plano de Ação'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
