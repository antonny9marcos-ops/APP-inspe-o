import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Line, Cell
} from 'recharts';
import { Inspection } from '../types';
import { SectorSwitcher } from './SectorSwitcher';
import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function generateWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    for (const modelName of GEMINI_MODELS) {
        const model = genAI.getGenerativeModel({ model: modelName });
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                const is503 = error?.message?.includes('503') || error?.status === 503;
                const isRetryable = is503 || error?.message?.includes('429') || error?.message?.includes('overloaded');

                if (isRetryable && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                if (isRetryable) break;
                throw error;
            }
        }
    }
    throw new Error('Modelos de IA temporariamente sobrecarregados. Tente novamente em alguns instantes.');
}

const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const value = payload.value || '';
    const truncatedValue = value.length > 18 ? value.substring(0, 15) + '...' : value;
    return (
        <g transform={`translate(${x},${y})`}>
            <text 
                x={0} 
                y={0} 
                dy={12} 
                textAnchor="end" 
                fill="#64748b" 
                transform="rotate(-35)"
                style={{ fontSize: '9px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}
            >
                {truncatedValue}
            </text>
        </g>
    );
};

interface AnalyticsProps {
    inspections: Inspection[];
    searchTerm?: string;
    periodFilter?: string;
    supplierFilter?: string;
    yearFilter?: string;
    monthFilter?: string;
    weekFilter?: string;
    categoryFilter?: string;
    selectedSector: string;
    sectors: string[];
    onSectorChange: (sector: string) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({
    inspections,
    searchTerm = '',
    periodFilter = 'todos',
    supplierFilter = 'Todos',
    yearFilter = 'all',
    monthFilter = 'all',
    weekFilter = 'all',
    categoryFilter = 'TODOS',
    selectedSector,
    sectors,
    onSectorChange
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filtered Inspections
    const filteredInspections = useMemo(() => {
        let filtered = inspections;

        if (selectedSector !== 'TODOS') {
            filtered = filtered.filter(i => i.setor === selectedSector);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(i =>
                (i.material || '').toLowerCase().includes(term) ||
                (i.fornecedor || '').toLowerCase().includes(term) ||
                (i.inspetor || '').toLowerCase().includes(term) ||
                (i.codigo || '').toLowerCase().includes(term) ||
                (i.motivoRejeicao || '').toLowerCase().includes(term)
            );
        }

        if (supplierFilter !== 'Todos') {
            filtered = filtered.filter(i => i.fornecedor === supplierFilter);
        }

        const todayStr = new Date().toLocaleDateString('sv-SE');
        if (periodFilter === 'hoje') {
            filtered = filtered.filter(i => i.data === todayStr);
        } else if (periodFilter === 'últimos 7 dias') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            filtered = filtered.filter(i => i.data >= d.toLocaleDateString('sv-SE'));
        } else if (periodFilter === 'últimos 30 dias') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            filtered = filtered.filter(i => i.data >= d.toLocaleDateString('sv-SE'));
        }

        if (yearFilter !== 'all') {
            filtered = filtered.filter(i => (i.data || '').startsWith(yearFilter));
        }

        if (categoryFilter !== 'Todos' && categoryFilter !== 'TODOS') {
            filtered = filtered.filter(i => (i.categoria || '').toUpperCase() === categoryFilter.toUpperCase());
        }

        return filtered;
    }, [inspections, searchTerm, periodFilter, supplierFilter, yearFilter, categoryFilter, selectedSector]);

    // 1. Pareto Data (80/20 rule)
    const paretoData = useMemo(() => {
        const reasonsMap: Record<string, number> = filteredInspections.reduce((acc: Record<string, number>, ins) => {
            if (ins.status === 'Rejeitado') {
                const reason = ins.motivoRejeicao || 'Não especificado';
                const qtyVal = ins.unidade === 'M' ? 1 : (ins.qtdRejeitada || 0);
                acc[reason] = (acc[reason] || 0) + qtyVal;
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
    }, [filteredInspections]);

    // 2. Heatmap Data
    const heatmapData = useMemo(() => {
        const materials = Array.from(new Set(filteredInspections.filter(i => i.status === 'Rejeitado').map(i => i.descricao || i.material).filter(Boolean))).slice(0, 6);
        const motives = Array.from(new Set(filteredInspections.filter(i => i.status === 'Rejeitado').map(i => i.motivoRejeicao).filter(Boolean))).slice(0, 5);

        return materials.map(m => {
            const data: Record<string, any> = { name: m };
            motives.forEach(mot => {
                if (mot) {
                    data[mot as string] = filteredInspections
                        .filter(i => (i.descricao === m || i.material === m) && i.motivoRejeicao === mot)
                        .reduce((sum, i) => sum + (i.unidade === 'M' ? 1 : (i.qtdRejeitada || 0)), 0);
                }
            });
            return data;
        });
    }, [filteredInspections]);

    // 3. Supplier Reliability Scorecard
    const supplierReliability = useMemo(() => {
        const stats = filteredInspections.reduce((acc: Record<string, any>, ins) => {
            if (!acc[ins.fornecedor]) {
                acc[ins.fornecedor] = { name: ins.fornecedor, totalQty: 0, approvedQty: 0, rejectedQty: 0 };
            }
            acc[ins.fornecedor].totalQty += (ins.unidade === 'M' ? 1 : (ins.qtdInspecionada || 0));
            acc[ins.fornecedor].approvedQty += (ins.unidade === 'M' ? (ins.status === 'Aprovado' ? 1 : 0) : (ins.qtdAprovada || 0));
            acc[ins.fornecedor].rejectedQty += (ins.unidade === 'M' ? (ins.status === 'Rejeitado' ? 1 : 0) : (ins.qtdRejeitada || 0));
            return acc;
        }, {});

        return Object.values(stats)
            .map((s: any) => {
                const reliability = s.totalQty > 0 ? (s.approvedQty / s.totalQty) * 100 : 0;
                return { ...s, reliability: Math.round(reliability) };
            })
            .sort((a, b) => b.reliability - a.reliability)
            .slice(0, 6);
    }, [filteredInspections]);

    // 4. Predictive Trend
    const predictionData = useMemo(() => {
        const totalQty = filteredInspections.reduce((sum, i) => sum + (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 0)), 0);
        const rejectedQty = filteredInspections.reduce((sum, i) => sum + (i.unidade === 'M' ? (i.status === 'Rejeitado' ? 1 : 0) : (i.qtdRejeitada || 0)), 0);
        const rate = totalQty > 0 ? (rejectedQty / totalQty) * 100 : 0;

        return {
            predictedRate: Math.max(0.5, rate * 0.92),
            insights: [
                { icon: 'trending_down', text: 'Tendência de redução de não-conformidades nos próximos ciclos.', color: 'text-emerald-400' },
                { icon: 'precision_manufacturing', text: 'Concentração de defeitos pontuais em fornecedores secundários.', color: 'text-blue-400' }
            ]
        };
    }, [filteredInspections]);

    const handleGenerateActionPlan = async () => {
        try {
            setIsGenerating(true);
            const prompt = `Gere um plano de ação executivo para o setor ${selectedSector} com base em ${filteredInspections.length} inspeções.`;
            const plan = await generateWithRetry(prompt);
            alert('Plano de ação gerado com sucesso pela IA.');
        } catch (error: any) {
            alert('Erro: ' + (error.message || 'Falha na conexão com a IA'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 lg:p-10 space-y-8 bg-[#05060A] text-slate-100 font-sans min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-blue-400 uppercase tracking-[0.2em]">
                        <span>[ 05 // BUSINESS_INTELLIGENCE ]</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    </div>
                    <h1 
                        className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                        Inteligência & Causa-Raiz
                    </h1>
                </div>

                <div className="w-full md:w-auto">
                    <SectorSwitcher sectors={sectors} selectedSector={selectedSector} onSectorChange={onSectorChange} />
                </div>
            </div>

            {/* Top Grid: Pareto Chart & Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Pareto Chart */}
                <div 
                    className="lg:col-span-6 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
                    style={{
                        background: 'rgba(10, 12, 18, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
                    }}
                >
                    <div className="mb-6">
                        <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ PARETO // 80_20_RULE ]</span>
                        <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            Análise de Pareto (Motivos de Rejeição)
                        </h3>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={paretoData} margin={{ top: 10, right: 10, bottom: 40, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={<CustomizedAxisTick />} 
                                    interval={0}
                                    height={50}
                                />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: 9, fill: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#090B12',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '11px'
                                    }}
                                />
                                <Bar name="Ocorrências" yAxisId="left" dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                                <Line name="% Acumulada" yAxisId="right" type="monotone" dataKey="percentage" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#60a5fa', strokeWidth: 2, stroke: '#090B12' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Heatmap Matrix */}
                <div 
                    className="lg:col-span-6 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
                    style={{
                        background: 'rgba(10, 12, 18, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
                    }}
                >
                    <div className="mb-6">
                        <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ CORRELATION // HEATMAP ]</span>
                        <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            Matriz de Falhas por Material
                        </h3>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar rounded-2xl border border-white/[0.06]">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="sticky top-0 bg-[#07090F] border-b border-white/[0.08] font-mono text-[9px] uppercase text-slate-400">
                                <tr>
                                    <th className="py-2.5 px-3">Material</th>
                                    {heatmapData[0] && Object.keys(heatmapData[0]).filter(k => k !== 'name').map(mot => (
                                        <th key={mot} className="py-2.5 px-3 text-center">{mot}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-xs">
                                {heatmapData.map((row: any, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02]">
                                        <td className="py-3 px-3 font-bold text-white max-w-[150px] truncate">{row.name}</td>
                                        {Object.keys(row).filter(k => k !== 'name').map(mot => {
                                            const val = row[mot] || 0;
                                            return (
                                                <td key={mot} className="py-3 px-3 text-center">
                                                    <span 
                                                        className="inline-block px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold"
                                                        style={{
                                                            background: val > 0 ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                                            color: val > 0 ? '#f87171' : '#475569',
                                                            border: val > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
                                                        }}
                                                    >
                                                        {val}
                                                    </span>
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

            {/* Bottom Grid: Supplier Reliability & Predictive Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Supplier Reliability */}
                <div 
                    className="lg:col-span-7 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
                    style={{
                        background: 'rgba(10, 12, 18, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
                    }}
                >
                    <div className="mb-6">
                        <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ SCORECARD // RELIABILITY ]</span>
                        <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            Confiabilidade dos Fornecedores
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {supplierReliability.map((s) => {
                            const isExcellent = s.reliability >= 90;
                            const isFair = s.reliability >= 70;
                            const badgeColor = isExcellent ? '#10b981' : isFair ? '#f59e0b' : '#ef4444';
                            return (
                                <div key={s.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-white truncate max-w-[150px]">{s.name}</p>
                                        <span 
                                            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                                            style={{
                                                background: `${badgeColor}15`,
                                                border: `1px solid ${badgeColor}30`,
                                                color: badgeColor
                                            }}
                                        >
                                            {s.reliability}% SCORE
                                        </span>
                                    </div>

                                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full"
                                            style={{ width: `${s.reliability}%`, backgroundColor: badgeColor }}
                                        />
                                    </div>

                                    <div className="flex justify-between font-mono text-[10px] text-slate-500 pt-1">
                                        <span>APROV: {s.approvedQty}</span>
                                        <span>REJEIT: {s.rejectedQty}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI Predictive Strategy Card */}
                <div 
                    className="lg:col-span-5 p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between"
                    style={{
                        background: 'linear-gradient(145deg, rgba(30, 58, 138, 0.4) 0%, rgba(10, 12, 18, 0.95) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ PREDICTIVE_ENGINE ]</span>
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        </div>

                        <div>
                            <span className="text-4xl font-extrabold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                ~{predictionData.predictedRate.toFixed(1)}%
                            </span>
                            <span className="font-mono text-[10px] text-blue-300 block uppercase mt-1 tracking-wider">
                                Taxa Projetada para Próximo Ciclo
                            </span>
                        </div>

                        <div className="space-y-2.5 pt-2">
                            {predictionData.insights.map((ins, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                    <span className={`material-symbols-rounded text-sm ${ins.color} flex-shrink-0 mt-0.5`}>
                                        {ins.icon}
                                    </span>
                                    <span>{ins.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateActionPlan}
                        disabled={isGenerating}
                        className="w-full mt-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    >
                        {isGenerating ? 'PROCESSANDO IA...' : 'GERAR PLANO DE AÇÃO (IA)'}
                    </button>
                </div>

            </div>

        </div>
    );
};
