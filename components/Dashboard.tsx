
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Bar, BarChart, Legend } from 'recharts';
import { Inspection } from '../types';

interface DashboardProps {
  inspections: Inspection[];
  onAddClick: () => void;
  searchTerm: string;
  periodFilter: string;
  supplierFilter: string;
  yearFilter: string;
  monthFilter: string;
  weekFilter: string;
  onPeriodChange: (period: string) => void;
  onSupplierChange: (supplier: string) => void;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onWeekChange: (week: string) => void;
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
  onSupplierChange,
  yearFilter,
  monthFilter,
  weekFilter,
  onYearChange,
  onMonthChange,
  onWeekChange
}) => {
  // Local state for Trend card filters
  const [trendYear, setTrendYear] = useState(yearFilter);
  const [trendMonth, setTrendMonth] = useState(monthFilter);
  const [trendWeek, setTrendWeek] = useState(weekFilter);

  // Sync with global filters initially or when they change if local is 'all'
  useEffect(() => {
    if (yearFilter !== 'all') setTrendYear(yearFilter);
    if (monthFilter !== 'all') setTrendMonth(monthFilter);
    if (weekFilter !== 'all') setTrendWeek(weekFilter);
  }, [yearFilter, monthFilter, weekFilter]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    const weeks = new Set<string>();

    inspections.forEach(i => {
      if (i.data) {
        const d = new Date(i.data + 'T00:00:00');
        years.add(d.getFullYear().toString());
      }
    });

    return {
      years: Array.from(years).sort((a, b) => b.localeCompare(a)),
      months: [
        { val: '1', label: 'Janeiro' }, { val: '2', label: 'Fevereiro' }, { val: '3', label: 'Março' },
        { val: '4', label: 'Abril' }, { val: '5', label: 'Maio' }, { val: '6', label: 'Junho' },
        { val: '7', label: 'Julho' }, { val: '8', label: 'Agosto' }, { val: '9', label: 'Setembro' },
        { val: '10', label: 'Outubro' }, { val: '11', label: 'Novembro' }, { val: '12', label: 'Dezembro' }
      ]
    };
  }, [inspections]);

  const suppliers = useMemo(() => {
    const list = Array.from(new Set(inspections.map(i => (i.fornecedor || '').trim()).filter(Boolean)));
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
    const today = now.toLocaleDateString('sv-SE');

    if (periodFilter === 'hoje') {
      filtered = filtered.filter(i => i.data === today);
    } else if (periodFilter === 'últimos 7 dias') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(i => new Date(i.data + 'T00:00:00') >= sevenDaysAgo);
    } else if (periodFilter === 'últimos 30 dias') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = filtered.filter(i => new Date(i.data + 'T00:00:00') >= thirtyDaysAgo);
    } else if (periodFilter === 'este mês') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(i => new Date(i.data + 'T00:00:00') >= startOfMonth);
    } else if (periodFilter === 'todos') {
      // No additional filter needed
    }

    // New Year/Month Filters
    if (yearFilter !== 'all') {
      filtered = filtered.filter(i => new Date(i.data + 'T00:00:00').getFullYear().toString() === yearFilter);
    }
    if (monthFilter !== 'all') {
      filtered = filtered.filter(i => (new Date(i.data + 'T00:00:00').getMonth() + 1).toString() === monthFilter);
    }
    // Simple week filter (relative to year)
    if (weekFilter !== 'all') {
      filtered = filtered.filter(i => {
        const d = new Date(i.data + 'T00:00:00');
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        return week.toString() === weekFilter;
      });
    }

    const total = filtered.length || 0;
    const approved = filtered.filter(i => i.status === 'Aprovado').length;
    const rejected = total - approved;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;
    const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;

    // Sum of qtdInspecionada
    const totalQty = filtered.reduce((acc, i) => acc + (i.qtdInspecionada || 0), 0);
    const totalRejectedQty = filtered.reduce((acc, i) => acc + (i.qtdRejeitada || 0), 0);

    const barData = [
      { name: 'Inspecionados', valor: totalQty, color: '#137fec' },
      { name: 'Rejeitados', valor: totalRejectedQty, color: '#ef4444' }
    ];

    // Material Rejection Logic
    const materialsRejectionMap = filtered.reduce((acc: any, i) => {
      const materialKey = i.descricao || i.material || 'N/A';
      if (!acc[materialKey]) {
        acc[materialKey] = {
          name: materialKey,
          codes: {} as Record<string, number>, // Track rejections per code
          total: 0,
          rejected: 0,
          suppliers: {} as Record<string, number>,
          rejectionSuppliers: {} as Record<string, number>, // Specifically track rejections per supplier
          defects: {} as Record<string, number>
        };
      }
      acc[materialKey].total += 1;
      if (i.status === 'Rejeitado') {
        acc[materialKey].rejected += 1;
        // Track which supplier had the rejection
        if (i.fornecedor) {
          acc[materialKey].rejectionSuppliers[i.fornecedor] = (acc[materialKey].rejectionSuppliers[i.fornecedor] || 0) + 1;
        }
        // Track which code (in case of name grouping) had the rejection
        if (i.material) {
          acc[materialKey].codes[i.material] = (acc[materialKey].codes[i.material] || 0) + 1;
        }
      }
      // Track total inspections per supplier (existing behavior)
      if (i.fornecedor) {
        acc[materialKey].suppliers[i.fornecedor] = (acc[materialKey].suppliers[i.fornecedor] || 0) + 1;
      }
      // Track defects for this material
      if (i.status === 'Rejeitado' && i.motivoRejeicao) {
        acc[materialKey].defects[i.motivoRejeicao] = (acc[materialKey].defects[i.motivoRejeicao] || 0) + 1;
      }
      return acc;
    }, {});

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

    // Trend Data Logic
    let trendData: any[] = [];
    let trendDates: { name: string, date: string }[] = [];

    if (trendWeek !== 'all') {
      // Show days of that specific week
      const year = trendYear !== 'all' ? parseInt(trendYear) : now.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
      const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
      const startOfWeek = new Date(firstMonday.getTime() + (parseInt(trendWeek) - 1) * 7 * 86400000);

      trendDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return { name: d.getDate().toString(), date: d.toISOString().split('T')[0] };
      });
    } else if (trendMonth !== 'all') {
      // Show all days of the selected month
      const year = trendYear !== 'all' ? parseInt(trendYear) : now.getFullYear();
      const month = parseInt(trendMonth) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      trendDates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return { name: (i + 1).toString(), date: d.toISOString().split('T')[0] };
      });
    } else if (trendYear !== 'all') {
      // Show monthly summary for the year
      const year = parseInt(trendYear);
      trendData = filterOptions.months.map(m => {
        const monthFiltered = inspections.filter(i => {
          const d = new Date(i.data + 'T00:00:00');
          return d.getFullYear() === year && (d.getMonth() + 1).toString() === m.val;
        });

        // Apply search and supplier filters specifically for trend
        let finalFiltered = monthFiltered;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          finalFiltered = finalFiltered.filter(i =>
            (i.material?.toLowerCase() || '').includes(term) || (i.fornecedor?.toLowerCase() || '').includes(term)
          );
        }
        if (supplierFilter !== 'Todos') {
          finalFiltered = finalFiltered.filter(i => i.fornecedor === supplierFilter);
        }

        const total = finalFiltered.length;
        const totalQty = finalFiltered.reduce((acc, i) => acc + (i.qtdInspecionada || 0), 0);
        const approvedCount = finalFiltered.filter(i => i.status === 'Aprovado').length;
        return {
          name: m.label.substring(0, 3),
          volume: totalQty,
          rate: total > 0 ? (approvedCount / total) * 100 : 100
        };
      });
    } else {
      // Default: Last 7 days
      trendDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const formattedName = `${d.getDate()}/${d.getMonth() + 1} (${dayName})`;
        return { name: formattedName, date: d.toISOString().split('T')[0] };
      });
    }

    // Apply similar formatting for week and month views if needed
    if (trendWeek !== 'all' || trendMonth !== 'all') {
      trendDates = trendDates.map(td => {
        const d = new Date(td.date + 'T00:00:00'); // Ensure local time
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return { ...td, name: `${d.getDate()}/${d.getMonth() + 1} (${dayName})` };
      });
    }

    if (trendDates.length > 0) {
      trendData = trendDates.map(td => {
        let dayFiltered = inspections.filter(i => i.data === td.date);
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
        const dayTotalQty = dayFiltered.reduce((acc, i) => acc + (i.qtdInspecionada || 0), 0);
        const dayApprovedCount = dayFiltered.filter(i => i.status === 'Aprovado').length;
        return {
          name: td.name,
          volume: dayTotalQty,
          rate: dayTotal > 0 ? (dayApprovedCount / dayTotal) * 100 : 100
        };
      });
    }

    const materialRejectionRanking = Object.values(materialsRejectionMap)
      .map((m: any) => {
        const rate = m.total > 0 ? (m.rejected / m.total) * 100 : 0;

        // Priority: Supplier with most REJECTIONS
        const mostRejectionSupplier = Object.entries(m.rejectionSuppliers).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
        // Fallback: Supplier with most inspections
        const mainSupplier = mostRejectionSupplier || Object.entries(m.suppliers).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Priority: Code with most REJECTIONS
        const mostRejectionCode = Object.entries(m.codes).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
        // Fallback: Just take the first code available if no rejections (shouldn't happen due to filter)
        const code = mostRejectionCode || '---';

        // Get main defect
        const mainDefect = Object.entries(m.defects).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Nenhum';

        return {
          ...m,
          code,
          rejectionRate: rate,
          mainSupplier,
          mainDefect
        };
      })
      .filter((m: any) => m.rejected > 0)
      .sort((a, b) => b.rejectionRate - a.rejectionRate);

    return {
      metrics: [
        { label: 'Total de Inspeções', value: total.toLocaleString(), trend: '', isPositive: true, icon: 'fact_check', color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-100/80 to-white' },
        { label: '% Aprovados', value: approvalRate.toFixed(1) + '%', trend: '', isPositive: true, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-100/80 to-white' },
        { label: '% Rejeitados', value: rejectionRate.toFixed(1) + '%', trend: '', isPositive: false, icon: 'cancel', color: 'text-rose-600', bg: 'bg-rose-50', gradient: 'from-rose-100/80 to-white' },
        { label: 'Qtd Total Inspecionada', value: totalQty.toLocaleString(), unit: 'unid.', trend: '', isPositive: true, icon: 'folder_open', color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-100/80 to-white' },
      ],
      pieData: [
        { name: 'Aprovados', value: approved, color: '#22c55e' },
        { name: 'Rejeitados', value: rejected, color: '#ef4444' },
      ],
      approvalPercentage: Math.round(approvalRate),
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : [{ name: 'Nenhuma rejeição registrada', value: 0, percentage: 0 }],
      trendData,
      barData,
      materialRejectionRanking,
      supplierPerformance: Object.entries(
        filtered.reduce((acc: any, i) => {
          const supplierName = (i.fornecedor || '').trim();
          if (!acc[supplierName]) acc[supplierName] = { name: supplierName, aprovados: 0, rejeitados: 0 };
          if (i.status === 'Aprovado') acc[supplierName].aprovados += 1;
          else if (i.status === 'Rejeitado') acc[supplierName].rejeitados += 1;
          return acc;
        }, {})
      ).map(([_, val]: [any, any]) => val).sort((a, b) => (b.aprovados + b.rejeitados) - (a.aprovados + a.rejeitados))
    };
  }, [inspections, searchTerm, periodFilter, supplierFilter, trendYear, trendMonth, trendWeek]);

  const { metrics, pieData, approvalPercentage, rejectionReasons, trendData, supplierPerformance, barData, materialRejectionRanking } = metricsAndData;

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
            <span className="material-symbols-rounded !text-3xl fill-1">dashboard</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Visão Geral Operacional</h1>
            <p className="text-slate-500 mt-1 font-medium">Métricas de inspeção e dados de desempenho em tempo real</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full md:w-auto">
          <select
            value={periodFilter}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="todos">Geral</option>
            <option value="últimos 30 dias">30 Dias</option>
            <option value="últimos 7 dias">7 Dias</option>
            <option value="hoje">Hoje</option>
            <option value="este mês">Mês</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="all">Ano: Todos</option>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="all">Mês: Todos</option>
            {filterOptions.months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <select
            value={weekFilter}
            onChange={(e) => onWeekChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
          >
            <option value="all">Sem: Todos</option>
            {Array.from({ length: 53 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>S {i + 1}</option>
            ))}
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-4 focus:ring-primary shadow-sm outline-none cursor-pointer hover:border-primary transition-colors appearance-none pr-8 overflow-hidden text-ellipsis whitespace-nowrap"
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
          <div key={metric.label} className={`bg-gradient-to-t ${metric.gradient || 'from-white to-white'} rounded-3xl p-7 shadow-xl shadow-slate-200/40 hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 border border-slate-100`}>
            <div className="flex justify-between items-start mb-6">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{metric.label}</p>
              <div className={`${metric.bg} p-3 rounded-2xl`}>
                <span className={`material-symbols-rounded ${metric.color} !text-2xl fill-1`}>{metric.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-slate-900 text-4xl font-black tracking-tighter">{metric.value}</p>
              {metric.unit && <span className="text-slate-400 text-xs font-bold uppercase">{metric.unit}</span>}
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
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-slate-900">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aprovados x Rejeitados</h3>
            <div className="flex flex-wrap gap-4 justify-end">
              {pieData.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: segment.color, boxShadow: `0 0 8px ${segment.color}66` }}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{segment.name}</span>
                  <span className="text-xs font-black text-slate-900 ml-1">{segment.value}</span>
                </div>
              ))}
            </div>
          </div>
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
        </div>

        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inspecionados x Rejeitados</h3>
            <div className="flex gap-4">
              {barData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar name="Valor" dataKey="valor" radius={[10, 10, 0, 0]} barSize={60}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="pb-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Materiais com Maior Rejeição</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Taxa de rejeição por item</p>
          </div>
          <div className="flex-1 divide-y divide-slate-50 overflow-y-auto max-h-[450px] custom-scrollbar">
            {materialRejectionRanking.length > 0 ? materialRejectionRanking.map((item: any, idx) => (
              <div key={idx} className="py-6 group hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{item.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cód: {item.code || '---'}</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Fornec: {item.mainSupplier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{item.rejectionRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="px-1">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.rejectionRate}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span className="text-danger">Principal Defeito:</span> {item.mainDefect}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 text-xs font-bold">Nenhum dado de rejeição disponível</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Rejeições por Motivo</h3>
            <span className="text-[10px] font-black text-primary px-4 py-1.5 bg-blue-50 rounded-full uppercase tracking-tighter shadow-sm border border-blue-100/50">Por Frequência</span>
          </div>

          <div className="grid grid-cols-1 gap-y-8 text-left">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Desempenho por Fornecedor</h3>
              <p className="text-sm font-medium text-slate-400 mt-1">Aprovações x Rejeições</p>
            </div>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-sm"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aprovados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-danger rounded-sm"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rejeitados</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '500px' }}>
            <div style={{ height: Math.max(448, supplierPerformance.length * 45 + 60) }}>
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
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '11px', fontWeight: '800', marginBottom: '4px', color: '#1e293b' }}
                  />
                  <Bar
                    dataKey="aprovados"
                    name="Aprovados"
                    fill="#22c55e"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="rejeitados"
                    name="Rejeitados"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tendência de Inspeções</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
              {trendYear !== 'all' ? `Resumo Mensal de ${trendYear}` :
                trendMonth !== 'all' ? `Detalhamento Diário` :
                  trendWeek !== 'all' ? `Semana ${trendWeek}` :
                    'Últimos 7 Dias'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <select
                value={trendYear}
                onChange={(e) => setTrendYear(e.target.value)}
                className="bg-slate-50 border-none rounded-lg text-[10px] font-bold h-8 px-2 focus:ring-1 focus:ring-primary shadow-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Ano: Todos</option>
                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={trendMonth}
                onChange={(e) => setTrendMonth(e.target.value)}
                className="bg-slate-50 border-none rounded-lg text-[10px] font-bold h-8 px-2 focus:ring-1 focus:ring-primary shadow-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Mês: Todos</option>
                {filterOptions.months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <select
                value={trendWeek}
                onChange={(e) => setTrendWeek(e.target.value)}
                className="bg-slate-50 border-none rounded-lg text-[10px] font-bold h-8 px-2 focus:ring-1 focus:ring-primary shadow-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Semana: Todos</option>
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>Semana {i + 1}</option>
                ))}
              </select>
            </div>
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
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '8px', fontSize: '12px' }}
                formatter={(value: any, name: string) => {
                  if (name === 'rate') return [`${Number(value).toFixed(1)}%`, 'Taxa de Aprovação'];
                  if (name === 'volume') return [Number(value).toLocaleString(), 'Qtd Inspecionada'];
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="volume" fill="#137fec" radius={[6, 6, 0, 0]} barSize={32} fillOpacity={0.15} />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={4} dot={{ r: 5, fill: '#22c55e', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
