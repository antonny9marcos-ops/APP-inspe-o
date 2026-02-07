
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Bar, BarChart, Legend } from 'recharts';
import { Inspection } from '../types';

interface DashboardProps {
  inspections: Inspection[];
  onAddClick: () => void;
  searchTerm: string;
  periodFilter: string;
  supplierFilter: string;
  onPeriodChange: (period: string) => void;
  onSupplierChange: (supplier: string) => void;
}

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const parts = payload.value.split(' ');
  const firstLine = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
  const secondLine = parts.slice(Math.ceil(parts.length / 2)).join(' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={0}
        dy={-6}
        textAnchor="end"
        fill="#64748b"
        style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}
      >
        {firstLine}
      </text>
      <text
        x={-10}
        y={0}
        dy={8}
        textAnchor="end"
        fill="#64748b"
        style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}
      >
        {secondLine}
      </text>
    </g>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  inspections,
  onAddClick,
  searchTerm,
  periodFilter,
  supplierFilter,
  onPeriodChange,
  onSupplierChange
}) => {
  // Get unique suppliers for the filter
  const suppliers = useMemo(() => {
    const list = Array.from(new Set(inspections.map(i => i.fornecedor).filter(Boolean)));
    return ['Todos', ...list.sort()];
  }, [inspections]);

  const metricsAndData = useMemo(() => {
    // 1. Apply Filters
    let filtered = [...inspections];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        (i.material?.toLowerCase() || '').includes(term) ||
        (i.fornecedor?.toLowerCase() || '').includes(term) ||
        (i.id?.toLowerCase() || '').includes(term)
      );
    }

    // Supplier filter
    if (supplierFilter !== 'Todos') {
      filtered = filtered.filter(i => i.fornecedor === supplierFilter);
    }

    // Period filter
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (periodFilter === 'hoje') {
      filtered = filtered.filter(i => i.data === today);
    } else if (periodFilter === 'últimos 7 dias') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(i => new Date(i.data) >= sevenDaysAgo);
    } else if (periodFilter === 'últimos 30 dias') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = filtered.filter(i => new Date(i.data) >= thirtyDaysAgo);
    } else if (periodFilter === 'este mês') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(i => new Date(i.data) >= startOfMonth);
    } else if (periodFilter === 'todos') {
      // No additional filter needed, 'filtered' already contains all inspections
    }

    const total = filtered.length || 0;
    const approved = filtered.filter(i => i.status === 'Aprovado').length;
    const rejected = total - approved;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

    // Sum of qtdInspecionada
    const totalQty = filtered.reduce((acc, i) => acc + (i.qtdInspecionada || 0), 0);

    const reasonsMap = filtered.reduce((acc: any, i) => {
      if (i.status === 'Rejeitado' && i.motivoRejeicao) {
        acc[i.motivoRejeicao] = (acc[i.motivoRejeicao] || 0) + 1;
      }
      return acc;
    }, {});

    const rejectionReasons = Object.entries(reasonsMap).map(([name, value]: [string, any]) => ({
      name,
      value,
      percentage: rejected > 0 ? (value / rejected) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Trend Data (last 7 days - unaffected by period filter for visualization consistency)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const trendData = last7Days.map(date => {
      // For trend, we only apply search and supplier filters
      let dayFiltered = inspections.filter(i => i.data === date);
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        dayFiltered = dayFiltered.filter(i =>
          (i.material?.toLowerCase() || '').includes(term) || (i.fornecedor?.toLowerCase() || '').includes(term)
        );
      }
      if (supplierFilter !== 'Todos') {
        dayFiltered = dayFiltered.filter(i => i.fornecedor === supplierFilter);
      }

      const dayTotal = dayFiltered.length;
      const dayApproved = dayFiltered.filter(i => i.status === 'Aprovado').length;
      return {
        name: date.split('-')[2], // Day number
        volume: dayTotal,
        rate: dayTotal > 0 ? (dayApproved / dayTotal) * 100 : 100
      };
    });

    return {
      metrics: [
        { label: 'Total de Inspeções', value: total.toLocaleString(), trend: '', isPositive: true, icon: 'fact_check', color: 'text-primary', bg: 'bg-blue-50' },
        { label: '% Aprovados', value: approvalRate.toFixed(1) + '%', trend: '', isPositive: true, icon: 'check_circle', color: 'text-success', bg: 'bg-green-50' },
        { label: '% Rejeitados', value: rejectionRate.toFixed(1) + '%', trend: '', isPositive: false, icon: 'cancel', color: 'text-danger', bg: 'bg-red-50' },
        { label: 'Qtd Total Inspecionada', value: totalQty.toLocaleString(), unit: 'unid.', trend: '', isPositive: true, icon: 'folder_open', color: 'text-warning', bg: 'bg-amber-50' },
      ],
      pieData: [
        { name: 'Aprovados', value: approved, color: '#22c55e' },
        { name: 'Rejeitados', value: rejected, color: '#ef4444' },
      ],
      approvalPercentage: Math.round(approvalRate),
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : [{ name: 'Nenhuma rejeição registrada', value: 0, percentage: 0 }],
      trendData,
      supplierPerformance: Object.entries(
        filtered.reduce((acc: any, i) => {
          if (!acc[i.fornecedor]) acc[i.fornecedor] = { name: i.fornecedor, aprovados: 0, rejeitados: 0 };
          if (i.status === 'Aprovado') acc[i.fornecedor].aprovados += 1;
          else if (i.status === 'Rejeitado') acc[i.fornecedor].rejeitados += 1;
          return acc;
        }, {})
      ).map(([_, val]: [any, any]) => val).sort((a, b) => (b.aprovados + b.rejeitados) - (a.aprovados + a.rejeitados)).slice(0, 5)
    };
  }, [inspections, searchTerm, periodFilter, supplierFilter]);

  const { metrics, pieData, approvalPercentage, rejectionReasons, trendData, supplierPerformance } = metricsAndData;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral Operacional</h1>
          <p className="text-slate-500 mt-1 font-medium">Métricas de inspeção e dados de desempenho em tempo real</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periodFilter}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-sm font-bold h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="últimos 30 dias">Últimos 30 Dias</option>
            <option value="últimos 7 dias">Últimos 7 Dias</option>
            <option value="hoje">Hoje</option>
            <option value="este mês">Este Mês</option>
            <option value="todos">Todo o Período</option>
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-sm font-bold h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            {suppliers.map(s => (
              <option key={s} value={s}>{s === 'Todos' ? 'Fornecedor: Todos' : s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 text-sm font-bold">{metric.label}</p>
              <div className={`${metric.bg} p-2.5 rounded-xl`}>
                <span className={`material-symbols-rounded ${metric.color} !text-2xl fill-1`}>{metric.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-slate-900 text-3xl font-black tracking-tight">{metric.value}</p>
              {metric.unit && <span className="text-slate-400 text-sm font-bold">{metric.unit}</span>}
            </div>
            {metric.trend && (
              <div className={`flex items-center gap-1 mt-3 font-bold text-sm ${metric.isPositive ? 'text-success' : 'text-danger'}`}>
                <span className="material-symbols-rounded !text-lg">
                  {metric.isPositive ? 'trending_up' : 'trending_down'}
                </span>
                <span>{metric.trend}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10">Aprovados x Rejeitados</h3>
          <div className="h-72 relative flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900">{approvalPercentage}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Taxa de Aprovação</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius="70%" outerRadius="90%" paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-10 space-y-4">
            {pieData.map((segment, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: segment.color, boxShadow: `0 0 8px ${segment.color}66` }}></div>
                  <span className="text-sm font-bold text-slate-600">{segment.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Rejeições por Motivo</h3>
            <span className="text-[10px] font-black text-primary px-4 py-1.5 bg-blue-50 rounded-full uppercase tracking-tighter shadow-sm border border-blue-100/50">Por Frequência</span>
          </div>

          <div className="space-y-8 grow">
            {rejectionReasons.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-500">{item.value} Casos</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-red-400/80 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12"></div> {/* Spacing at bottom */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Desempenho por Fornecedor</h3>
            <p className="text-sm font-medium text-slate-400 mt-1">Aprovações x Rejeições</p>
          </div>

          <div className="h-[28rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={supplierPerformance}
                margin={{ top: 5, right: 30, left: 120, bottom: 20 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.1} />
                <XAxis
                  type="number"
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 13, fontWeight: 600, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomYAxisTick />}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="rect"
                  iconSize={18}
                  wrapperStyle={{ paddingTop: '40px' }}
                  formatter={(value) => <span className="text-sm font-bold text-slate-700 ml-2 mr-6">{value}</span>}
                />
                <Bar
                  dataKey="aprovados"
                  name="Aprovados"
                  fill="#22c55e"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="rejeitados"
                  name="Rejeitados"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tendência de Inspeções</h3>
            <p className="text-xs text-slate-400 mt-1 font-bold">Volume e desempenho nos últimos 7 dias</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-primary rounded-full"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-success rounded-full"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Aprovação</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.03} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Bar yAxisId="left" dataKey="volume" fill="#137fec" radius={[6, 6, 0, 0]} barSize={44} fillOpacity={0.08} />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={4} dot={{ r: 5, fill: '#22c55e', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
