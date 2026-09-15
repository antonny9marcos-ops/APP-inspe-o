import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, Tooltip, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Bar, BarChart, PieChart, Pie, Cell, LabelList } from 'recharts';
import { Inspection } from '../types';
import { SpotlightCard } from './SpotlightCard';
import { SectorSwitcher } from './SectorSwitcher';

interface DonutRingProps {
  data: { name: string; value: number; color: string }[];
  onHoverChange: (pos: { x: number; y: number } | null) => void;
}

/*
 * Recharts' <Pie> for the visual (exact original look: innerRadius/outerRadius,
 * paddingAngle, cornerRadius, entrance animation) - but deliberately with no
 * <Tooltip> attached to it. A <Tooltip> inside a <PieChart> mounted alongside
 * a Cartesian chart (the Bar/Composed charts below) stops Recharts' Tooltip
 * from activating for every chart on the page, reproduced in isolation with
 * both recharts v2 and v3; dropping the Pie's own <Tooltip> avoids that
 * entirely while keeping the Pie itself. The floating balloon on hover
 * (DonutTooltip below) is a hand-rolled stand-in for it, styled to match.
 */
const DonutRing: React.FC<DonutRingProps> = ({ data, onHoverChange }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  const handleMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onHoverChange({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="w-full h-full" onMouseMove={total > 0 ? handleMove : undefined} onMouseLeave={() => onHoverChange(null)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius="68%" outerRadius="88%" paddingAngle={6} dataKey="value" stroke="none">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DonutTooltipProps {
  pos: { x: number; y: number };
  data: { name: string; value: number; color: string }[];
  unit?: string;
}

/* Positioned and styled to match Recharts' default <Tooltip contentStyle={{...}}> used by the other charts on this page. */
const DonutTooltip: React.FC<DonutTooltipProps> = ({ pos, data, unit }) => (
  <div
    className="absolute z-10 pointer-events-none whitespace-nowrap"
    style={{
      left: pos.x + 14,
      top: pos.y + 14,
      background: '#090B12',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      color: '#f8fafc',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      padding: '8px 12px'
    }}
  >
    {data.map(entry => (
      <div key={entry.name} style={{ color: entry.color }}>
        {entry.name} : {entry.value.toLocaleString('pt-BR')}{unit ? ` ${unit}` : ''}
      </div>
    ))}
  </div>
);

interface DashboardProps {
  inspections: Inspection[];
  onAddClick: () => void;
  searchTerm: string;
  periodFilter: string;
  supplierFilter: string;
  yearFilter: string;
  monthFilter: string;
  weekFilter: string;
  categoryFilter: string;
  onPeriodChange: (period: string) => void;
  onSupplierChange: (supplier: string) => void;
  onCategoryChange: (category: string) => void;
  filterOptions: {
    years: string[];
    months: { val: string; label: string }[];
  };
  selectedSector: string;
  sectors: string[];
  onSectorChange: (sector: string) => void;
}

/*
 * Rótulo de % em cima das barras dos comparativos (unidade/categoria).
 * Pra uma barra com valor (alta), o texto fica dentro dela, perto do topo.
 * Pra uma barra zerada (altura zero, sem registros naquele grupo), "y"
 * cai bem em cima da base do eixo — sobe o texto pra não colar no nome
 * do grupo abaixo dele.
 */
const renderApprovalLabel = (props: any) => {
  const { x, y, width, value } = props;
  const hasValue = value > 0;
  return (
    <text
      x={x + width / 2}
      y={hasValue ? y + 16 : y - 10}
      textAnchor="middle"
      fill={hasValue ? '#ffffff' : '#64748b'}
      fontFamily="JetBrains Mono, monospace"
      fontWeight={700}
      fontSize={13}
    >
      {value}%
    </text>
  );
};

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const value = payload.value || '';
  const truncated = value.length > 18 ? value.substring(0, 15) + '...' : value;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={4}
        textAnchor="end"
        fill="#64748b"
        style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}
      >
        {truncated}
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
  categoryFilter,
  onCategoryChange,
  filterOptions,
  selectedSector,
  sectors,
  onSectorChange
}) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [trendYear, setTrendYear] = useState(yearFilter);
  const [trendMonth, setTrendMonth] = useState(monthFilter);
  const [trendWeek, setTrendWeek] = useState(weekFilter);
  const [donutTooltipPos, setDonutTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [volumeTooltipPos, setVolumeTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setTrendYear(yearFilter);
    setTrendMonth(monthFilter);
    setTrendWeek(weekFilter);
  }, [yearFilter, monthFilter, weekFilter]);

  const metricsAndData = useMemo(() => {
    // Filtros que não dizem respeito a setor/categoria (busca, período,
    // fornecedor) — aplicados uma vez e reaproveitados pra derivar tanto o
    // dataset final (filtered) quanto as bases dos comparativos por
    // unidade/categoria, que precisam ignorar exatamente esses dois filtros
    // pra poder comparar todas as unidades (ou categorias) lado a lado.
    const applyCommonFilters = (data: Inspection[]) => {
      let result = data;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(i =>
          (i.material?.toLowerCase() || '').includes(term) ||
          (i.fornecedor?.toLowerCase() || '').includes(term) ||
          (i.inspetor?.toLowerCase() || '').includes(term) ||
          (i.codigo?.toLowerCase() || '').includes(term)
        );
      }

      const todayStr = new Date().toLocaleDateString('sv-SE');
      if (periodFilter === 'hoje') {
        result = result.filter(i => i.data === todayStr);
      } else if (periodFilter === 'últimos 7 dias') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgoStr = d.toLocaleDateString('sv-SE');
        result = result.filter(i => i.data >= sevenDaysAgoStr);
      } else if (periodFilter === 'últimos 30 dias') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const thirtyDaysAgoStr = d.toLocaleDateString('sv-SE');
        result = result.filter(i => i.data >= thirtyDaysAgoStr);
      } else if (periodFilter === 'este mês') {
        const [curYear, curMonth] = todayStr.split('-');
        result = result.filter(i => i.data.startsWith(`${curYear}-${curMonth}`));
      }

      if (yearFilter !== 'all') {
        result = result.filter(i => i.data.startsWith(yearFilter));
      }
      if (monthFilter !== 'all') {
        result = result.filter(i => {
          const parts = i.data.split('-');
          return parts[1] === monthFilter;
        });
      }
      if (weekFilter !== 'all') {
        result = result.filter(i => {
          const d = new Date(i.data + 'T00:00:00');
          const startOfYear = new Date(d.getFullYear(), 0, 1);
          const pastDays = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
          const w = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
          return w.toString() === weekFilter;
        });
      }

      if (supplierFilter !== 'Todos') {
        result = result.filter(i => i.fornecedor === supplierFilter);
      }

      return result;
    };

    const commonFiltered = applyCommonFilters(inspections);

    // Base pro comparativo por unidade: todas as unidades, respeitando a
    // categoria selecionada (mas ignorando o filtro de unidade em si).
    const sectorComparisonBase = categoryFilter !== 'TODOS'
      ? commonFiltered.filter(i => (i.categoria || '').toUpperCase() === categoryFilter.toUpperCase())
      : commonFiltered;

    // Base pro comparativo por categoria: todas as categorias, respeitando
    // a unidade selecionada (mas ignorando o filtro de categoria em si).
    const categoryComparisonBase = selectedSector !== 'TODOS'
      ? commonFiltered.filter(i => i.setor === selectedSector)
      : commonFiltered;

    let filtered = selectedSector !== 'TODOS'
      ? sectorComparisonBase.filter(i => i.setor === selectedSector)
      : sectorComparisonBase;

    const totalInspections = filtered.length;
    const totalApproved = filtered.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
    const totalRejected = filtered.filter(i => i.status === 'Rejeitado').length;
    const totalInspectedQty = filtered.reduce((acc, i) => acc + (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 0)), 0);

    const approvalRate = totalInspections > 0 ? (totalApproved / totalInspections) * 100 : 100;
    const rejectionRate = totalInspections > 0 ? (totalRejected / totalInspections) * 100 : 0;

    // ── Tendência (últimos 30 dias vs 30 dias anteriores) ──
    // Usa a mesma "identidade" de filtros (unidade/categoria/fornecedor/
    // busca) do restante da tela, mas ignora o filtro de período/ano/mês/
    // semana — a tendência já É sobre tempo, então um filtro de data por
    // cima não faria sentido (compararia dois recortes arbitrários).
    let identityFiltered = inspections;
    if (selectedSector !== 'TODOS') identityFiltered = identityFiltered.filter(i => i.setor === selectedSector);
    if (categoryFilter !== 'TODOS') identityFiltered = identityFiltered.filter(i => (i.categoria || '').toUpperCase() === categoryFilter.toUpperCase());
    if (supplierFilter !== 'Todos') identityFiltered = identityFiltered.filter(i => i.fornecedor === supplierFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      identityFiltered = identityFiltered.filter(i =>
        (i.material?.toLowerCase() || '').includes(term) ||
        (i.fornecedor?.toLowerCase() || '').includes(term) ||
        (i.inspetor?.toLowerCase() || '').includes(term) ||
        (i.codigo?.toLowerCase() || '').includes(term)
      );
    }

    const trendWindowNow = new Date();
    const last30Str = new Date(trendWindowNow.getTime() - 30 * 86400000).toLocaleDateString('sv-SE');
    const prev60Str = new Date(trendWindowNow.getTime() - 60 * 86400000).toLocaleDateString('sv-SE');
    const last30Items = identityFiltered.filter(i => i.data >= last30Str);
    const prev30Items = identityFiltered.filter(i => i.data >= prev60Str && i.data < last30Str);

    const calcPeriodStats = (data: Inspection[]) => {
      const total = data.length;
      const approved = data.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
      const rejected = data.filter(i => i.status === 'Rejeitado').length;
      const qty = data.reduce((acc, i) => acc + (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 0)), 0);
      return {
        total,
        approvalRate: total > 0 ? (approved / total) * 100 : 0,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
        qty
      };
    };

    const last30Stats = calcPeriodStats(last30Items);
    const prev30Stats = calcPeriodStats(prev30Items);

    const calcDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const hasTrendData = prev30Items.length > 0 || last30Items.length > 0;
    // Métricas de contagem/volume (Total de Registros, Volume Inspecionado)
    // usam variação percentual normal. Métricas que já SÃO uma taxa (Índice
    // de Aprovação, Taxa de Rejeição) mostram a diferença em PONTOS
    // percentuais em vez de "percentual do percentual" — sem isso, uma taxa
    // que sobe de 0,6% pra 3,6% (uma mudança pequena) aparecia como "+458%",
    // o que é matematicamente correto mas enganoso/alarmante de se ler.
    const makeTrend = (current: number, previous: number, higherIsBetter: boolean, mode: 'percent' | 'points' = 'percent') => {
      if (!hasTrendData) return undefined;
      const delta = mode === 'points' ? current - previous : calcDelta(current, previous);
      return { delta, positive: higherIsBetter ? delta >= 0 : delta <= 0, mode };
    };

    // ── Tempo de fila (média entre chegada do material e data da inspeção) ──
    const leadTimes = filtered
      .filter(i => i.data && i.dataChegada)
      .map(i => (new Date(i.data + 'T00:00:00').getTime() - new Date(i.dataChegada + 'T00:00:00').getTime()) / 86400000)
      .filter(d => d >= 0 && d < 365);
    const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : null;

    const metrics = [
      {
        label: 'Total de Registros',
        value: totalInspections.toLocaleString('pt-BR'),
        icon: 'dataset',
        color: '#60a5fa',
        tag: 'CADASTROS',
        trend: makeTrend(last30Stats.total, prev30Stats.total, true)
      },
      {
        label: 'Índice de Aprovação',
        value: `${approvalRate.toFixed(1)}%`,
        icon: 'verified',
        color: '#34d399',
        tag: 'CONFORME',
        trend: makeTrend(last30Stats.approvalRate, prev30Stats.approvalRate, true, 'points')
      },
      {
        label: 'Taxa de Rejeição',
        value: `${rejectionRate.toFixed(1)}%`,
        icon: 'warning',
        color: '#f87171',
        tag: 'NÃO-CONFORME',
        trend: makeTrend(last30Stats.rejectionRate, prev30Stats.rejectionRate, false, 'points')
      },
      {
        label: 'Volume Inspecionado',
        value: totalInspectedQty.toLocaleString('pt-BR'),
        unit: 'UNID.',
        icon: 'inventory_2',
        color: '#fbbf24',
        tag: 'TOTAL QTD',
        trend: makeTrend(last30Stats.qty, prev30Stats.qty, true)
      },
      {
        label: 'Tempo de Fila',
        value: avgLeadTime !== null ? avgLeadTime.toFixed(1) : '--',
        unit: avgLeadTime !== null ? 'DIAS' : undefined,
        icon: 'schedule',
        color: '#a78bfa',
        tag: 'CHEGADA → INSPEÇÃO'
      }
    ];

    // ── Comparativo por Unidade (todas as unidades, ignora o filtro de unidade) ──
    const sectorNames = ['1058 Carajás', '4065 São Luis', '4050 S11D'];
    const sectorComparison = sectorNames.map(setor => {
      const items = sectorComparisonBase.filter(i => i.setor === setor);
      const total = items.length;
      const approved = items.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
      return {
        name: setor.replace(/^\d+\s*/, ''),
        total,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
      };
    });

    // ── Comparativo por Categoria (todas as categorias, ignora o filtro de categoria) ──
    const categoryComparison = ['ROLO TRANSPORTADOR', 'OUTROS'].map(cat => {
      const items = categoryComparisonBase.filter(i => (i.categoria || '').toUpperCase() === cat);
      const total = items.length;
      const approved = items.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
      return {
        name: cat === 'ROLO TRANSPORTADOR' ? 'Rolo Transportador' : 'Outros',
        total,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
      };
    });

    const pieData = [
      { name: 'Aprovados', value: totalApproved, color: '#10b981' },
      { name: 'Rejeitados', value: totalRejected, color: '#ef4444' }
    ];

    const barData = [
      {
        name: 'Total',
        inspecionados: totalInspectedQty,
        rejeitados: filtered.reduce((acc, i) => acc + (i.unidade === 'M' ? (i.status === 'Rejeitado' ? 1 : 0) : (i.qtdRejeitada || 0)), 0)
      }
    ];

    // Rejection reasons map
    const rejectionReasonsMap: Record<string, number> = {};
    filtered.filter(i => i.status === 'Rejeitado').forEach(i => {
      const reason = i.motivoRejeicao || 'Não especificado';
      rejectionReasonsMap[reason] = (rejectionReasonsMap[reason] || 0) + 1;
    });

    const rejectionReasons = Object.entries(rejectionReasonsMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalRejected > 0 ? (value / totalRejected) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Material rejection ranking
    const materialsRejectionMap: Record<string, any> = {};
    filtered.forEach(i => {
      const mat = i.material || 'Não Identificado';
      if (!materialsRejectionMap[mat]) {
        materialsRejectionMap[mat] = {
          name: mat,
          code: i.codigo || '---',
          total: 0,
          rejected: 0,
          mainSupplier: i.fornecedor || 'N/A',
          mainDefect: i.motivoRejeicao || 'Defeito de Superfície'
        };
      }
      materialsRejectionMap[mat].total += (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 1));
      if (i.status === 'Rejeitado') {
        materialsRejectionMap[mat].rejected += (i.unidade === 'M' ? 1 : (i.qtdRejeitada || 1));
        materialsRejectionMap[mat].mainDefect = i.motivoRejeicao || materialsRejectionMap[mat].mainDefect;
      }
    });

    const materialRejectionRanking = Object.values(materialsRejectionMap)
      .filter((m: any) => m.rejected > 0)
      .map((m: any) => ({
        ...m,
        rejectionRate: m.total > 0 ? (m.rejected / m.total) * 100 : 0
      }))
      .sort((a, b) => b.rejectionRate - a.rejectionRate)
      .slice(0, 4);

    // Supplier performance
    const supplierMap: Record<string, { name: string; aprovados: number; rejeitados: number }> = {};
    filtered.forEach(i => {
      const sup = i.fornecedor || 'Outros';
      if (!supplierMap[sup]) {
        supplierMap[sup] = { name: sup, aprovados: 0, rejeitados: 0 };
      }
      if (i.status === 'Rejeitado') {
        supplierMap[sup].rejeitados += (i.unidade === 'M' ? 1 : (i.qtdRejeitada || 1));
      } else {
        supplierMap[sup].aprovados += (i.unidade === 'M' ? 1 : (i.qtdAprovada || 1));
      }
    });

    const supplierPerformance = Object.values(supplierMap)
      .sort((a, b) => (b.aprovados + b.rejeitados) - (a.aprovados + a.rejeitados))
      .slice(0, 7);

    // Trend data - scoped by its own Ano/Mês/Semana selects (trendYear/trendMonth/trendWeek),
    // independent from the global period/year/month/week filters above. Respects sector,
    // category, search and supplier like the rest of the dashboard.
    let trendBase = inspections;
    if (selectedSector !== 'TODOS') {
      trendBase = trendBase.filter(i => i.setor === selectedSector);
    }
    if (categoryFilter !== 'TODOS') {
      trendBase = trendBase.filter(i => (i.categoria || '').toUpperCase() === categoryFilter.toUpperCase());
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      trendBase = trendBase.filter(i =>
        (i.material?.toLowerCase() || '').includes(term) ||
        (i.fornecedor?.toLowerCase() || '').includes(term)
      );
    }
    if (supplierFilter !== 'Todos') {
      trendBase = trendBase.filter(i => i.fornecedor === supplierFilter);
    }

    let trendDates: { name: string; date: string }[] = [];
    let trendData: { name: string; volume: number; rate: number }[] = [];
    const now = new Date();

    if (trendWeek !== 'all') {
      // Days of the selected week
      const year = trendYear !== 'all' ? parseInt(trendYear) : now.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
      const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
      const startOfWeek = new Date(firstMonday.getTime() + (parseInt(trendWeek) - 1) * 7 * 86400000);
      trendDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return { name: '', date: d.toLocaleDateString('sv-SE') };
      });
    } else if (trendMonth !== 'all') {
      // All days of the selected month
      const year = trendYear !== 'all' ? parseInt(trendYear) : now.getFullYear();
      const month = parseInt(trendMonth) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      trendDates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return { name: (i + 1).toString(), date: d.toLocaleDateString('sv-SE') };
      });
    } else if (trendYear !== 'all') {
      // Monthly summary for the selected year
      const year = parseInt(trendYear);
      trendData = filterOptions.months.map(m => {
        const monthFiltered = trendBase.filter(i => {
          const d = new Date(i.data + 'T00:00:00');
          return d.getFullYear() === year && (d.getMonth() + 1).toString() === m.val;
        });
        const total = monthFiltered.length;
        const totalQty = monthFiltered.reduce((acc, i) => acc + (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 0)), 0);
        const approvedCount = monthFiltered.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
        return {
          name: m.label.substring(0, 3),
          volume: totalQty,
          rate: total > 0 ? (approvedCount / total) * 100 : 100
        };
      });
    } else {
      // Default: last 7 days
      trendDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { name: '', date: d.toLocaleDateString('sv-SE') };
      });
    }

    if (trendDates.length > 0) {
      trendData = trendDates.map(td => {
        const d = new Date(td.date + 'T00:00:00');
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const name = td.name ? `${td.name} (${dayName})` : `${d.getDate()}/${d.getMonth() + 1} (${dayName})`;
        const dayItems = trendBase.filter(i => i.data === td.date);
        const totalDay = dayItems.length;
        const approvedDay = dayItems.filter(i => i.status === 'Aprovado' || i.status === 'Atenção').length;
        const vol = dayItems.reduce((acc, i) => acc + (i.unidade === 'M' ? 1 : (i.qtdInspecionada || 0)), 0);
        return {
          name,
          volume: vol,
          rate: totalDay > 0 ? (approvedDay / totalDay) * 100 : 100
        };
      });
    }

    return {
      metrics,
      pieData,
      barData,
      rejectionReasons,
      materialRejectionRanking,
      supplierPerformance,
      trendData,
      sectorComparison,
      categoryComparison,
      approvalPercentage: approvalRate.toFixed(1)
    };
  }, [inspections, searchTerm, periodFilter, supplierFilter, yearFilter, monthFilter, weekFilter, categoryFilter, selectedSector, trendYear, trendMonth, trendWeek, filterOptions.months]);

  return (
    <div className="p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 bg-[#05060A] text-slate-100 font-sans min-h-screen">
      
      {/* Phenomenon Studio Section Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[12px] text-blue-400 uppercase tracking-[0.2em]">
            <span>[ 01 // OVERVIEW_METRICS ]</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span className="text-slate-500">TELEMETRIA EM TEMPO REAL</span>
          </div>
          <h1 
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Visão Geral Operacional
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <SectorSwitcher sectors={sectors} selectedSector={selectedSector} onSectorChange={onSectorChange} />
        </div>
      </div>

      {/* 4 Phenomenon Studio Luxury KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricsAndData.metrics.map((metric, idx) => (
          <SpotlightCard
            key={idx}
            glowColor={metric.color}
            className="p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:border-white/[0.15]"
            style={{
              background: 'rgba(10, 12, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Top Laser Border Highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${metric.color}88 50%, transparent 100%)`
              }}
            />

            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[12px] uppercase tracking-widest text-slate-400">
                {metric.label}
              </span>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: `${metric.color}15`,
                  border: `1px solid ${metric.color}30`,
                  color: metric.color
                }}
              >
                <span className="material-symbols-rounded text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {metric.icon}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {metric.value}
              </span>
              {metric.unit && (
                <span className="font-mono text-[12px] text-slate-500 uppercase tracking-widest">{metric.unit}</span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-[12px]">
              <span className="text-slate-500">{metric.tag}</span>
              {metric.trend ? (
                <span
                  className="flex items-center gap-1"
                  style={{ color: metric.trend.positive ? '#34d399' : '#f87171' }}
                  title="Comparado aos 30 dias anteriores"
                >
                  {metric.trend.delta >= 0 ? '▲' : '▼'} {Math.abs(metric.trend.delta).toFixed(1)}{metric.trend.mode === 'points' ? ' p.p.' : '%'} / 30D
                </span>
              ) : (
                <span style={{ color: metric.color }}>STATUS // ATIVO</span>
              )}
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Main Analytical Chart Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pie Chart Card (Conformidade) */}
        <div 
          className="lg:col-span-5 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 02 // ÍNDICE_CONFORMIDADE ]</span>
              <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Aprovados vs Rejeitados
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Aprov
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Rejeit
              </span>
            </div>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-4xl font-extrabold text-white"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {metricsAndData.approvalPercentage}%
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mt-1">
                Índice de Aprovação
              </span>
            </div>
            <DonutRing data={metricsAndData.pieData} onHoverChange={setDonutTooltipPos} />
            {donutTooltipPos && <DonutTooltip pos={donutTooltipPos} data={metricsAndData.pieData} unit="registros" />}
          </div>
        </div>

        {/* Volume Inspecionado vs Rejeitado Bar Chart */}
        <div 
          className="lg:col-span-7 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 03 // BALANÇO_VOLUMÉTRICO ]</span>
              <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Total Inspecionado vs Total Rejeitado
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="text-blue-400">■ Inspecionados</span>
              <span className="text-red-400">■ Rejeitados</span>
            </div>
          </div>

          <div
            className="h-64 w-full relative"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVolumeTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseLeave={() => setVolumeTooltipPos(null)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsAndData.barData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} barGap={isMobile ? 24 : 48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Tooltip content={() => null} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="inspecionados" name="Inspecionados" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={isMobile ? 32 : 54} />
                <Bar dataKey="rejeitados" name="Rejeitados" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={isMobile ? 32 : 54} />
              </BarChart>
            </ResponsiveContainer>
            {volumeTooltipPos && (
              <DonutTooltip
                pos={volumeTooltipPos}
                data={[
                  { name: 'Inspecionados', value: metricsAndData.barData[0]?.inspecionados || 0, color: '#3b82f6' },
                  { name: 'Rejeitados', value: metricsAndData.barData[0]?.rejeitados || 0, color: '#ef4444' },
                ]}
                unit="unid."
              />
            )}
          </div>
        </div>

      </div>

      {/* Bottom Grids: Materials with Rejection & Supplier Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Rejection Ranking */}
        <div 
          className="lg:col-span-6 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="mb-6">
            <span className="font-mono text-[12px] text-red-400 uppercase tracking-widest">[ 04 // CRITICAL_MATERIALS ]</span>
            <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Materiais com Maior Rejeição
            </h3>
          </div>

          <div className="space-y-4">
            {metricsAndData.materialRejectionRanking.length > 0 ? (
              metricsAndData.materialRejectionRanking.map((item: any, idx: number) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-500">0{idx + 1}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 mt-0.5">
                          <span>COD: {item.code}</span>
                          <span>·</span>
                          <span className="text-blue-400">FORN: {item.mainSupplier}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-red-400">
                      {item.rejectionRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${Math.min(100, item.rejectionRate)}%` }}
                    />
                  </div>
                  <p className="font-mono text-[11px] text-slate-400 mt-2 uppercase">
                    MOTIVO: <span className="text-slate-300">{item.mainDefect}</span>
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center font-mono text-sm text-slate-500">
                Nenhum lote com não-conformidade registrado.
              </div>
            )}
          </div>
        </div>

        {/* Supplier Performance Chart */}
        <div 
          className="lg:col-span-6 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 05 // SUPPLIER_INDEX ]</span>
              <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Desempenho por Fornecedor
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="text-emerald-400">■ Aprovados</span>
              <span className="text-red-400">■ Rejeitados</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={metricsAndData.supplierPerformance}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="rgba(255,255,255,0.04)" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={<CustomYAxisTick />}
                  width={130}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    background: '#090B12',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '13px'
                  }}
                />
                <Bar dataKey="aprovados" name="Aprovados" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                <Bar dataKey="rejeitados" name="Rejeitados" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Trend Chart */}
      <div
        className="p-6 sm:p-8 rounded-3xl relative overflow-hidden"
        style={{
          background: 'rgba(10, 12, 18, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 06 // SÉRIE_TEMPORAL ]</span>
            <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Tendência de Inspeções
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mt-1">
              {trendWeek !== 'all' ? `Semana ${trendWeek}` :
                trendMonth !== 'all' ? 'Detalhamento Diário' :
                  trendYear !== 'all' ? `Resumo Mensal de ${trendYear}` :
                    'Últimos 7 Dias'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <select
                value={trendYear}
                onChange={(e) => setTrendYear(e.target.value)}
                className="rounded-xl font-mono text-[12px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
              >
                <option value="all">Ano: Todos</option>
                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={trendMonth}
                onChange={(e) => setTrendMonth(e.target.value)}
                className="rounded-xl font-mono text-[12px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
              >
                <option value="all">Mês: Todos</option>
                {filterOptions.months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
              <select
                value={trendWeek}
                onChange={(e) => setTrendWeek(e.target.value)}
                className="rounded-xl font-mono text-[12px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
              >
                <option value="all">Semana: Todos</option>
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>Semana {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[12px]">
            <span className="text-blue-400">■ Volume</span>
            <span className="text-emerald-400">■ Taxa de Aprovação</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metricsAndData.trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{
                  background: '#090B12',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'rate') return [`${Number(value).toFixed(1)}%`, 'Taxa de Aprovação'];
                  if (name === 'volume') return [Number(value).toLocaleString('pt-BR'), 'Qtd Inspecionada'];
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="volume" name="volume" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={isMobile ? 16 : 32} fillOpacity={0.25} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                name="rate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#090B12' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparativos: Unidade & Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sector Comparison */}
        <div
          className="p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="mb-6">
            <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 07 // COMPARATIVO_DE_UNIDADES ]</span>
            <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Aprovação por Unidade
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsAndData.sectorComparison} margin={{ top: 24, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#090B12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
                  formatter={(value: any, _name: string, item: any) => [`${value}% (${item.payload.total} registros)`, 'Aprovação']}
                />
                <Bar dataKey="approvalRate" name="Aprovação" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={64}>
                  <LabelList dataKey="approvalRate" content={renderApprovalLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Comparison */}
        <div
          className="p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="mb-6">
            <span className="font-mono text-[12px] text-blue-400 uppercase tracking-widest">[ 08 // COMPARATIVO_DE_CATEGORIAS ]</span>
            <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Aprovação por Categoria
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsAndData.categoryComparison} margin={{ top: 24, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#090B12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
                  formatter={(value: any, _name: string, item: any) => [`${value}% (${item.payload.total} registros)`, 'Aprovação']}
                />
                <Bar dataKey="approvalRate" name="Aprovação" fill="#a78bfa" radius={[6, 6, 0, 0]} barSize={96}>
                  <LabelList dataKey="approvalRate" content={renderApprovalLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
