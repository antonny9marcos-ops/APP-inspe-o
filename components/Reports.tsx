import React from 'react';
import { Inspection } from '../types';
import { SectorSwitcher } from './SectorSwitcher';

interface ReportsProps {
  inspections: Inspection[];
  onEdit: (inspection: Inspection) => void;
  globalSearchTerm?: string;
  globalSupplierFilter?: string;
  selectedSector: string;
  sectors: string[];
  onSectorChange: (sector: string) => void;
  categoryFilter?: string;
}

export const Reports: React.FC<ReportsProps> = ({ 
  inspections, 
  onEdit, 
  globalSearchTerm = '', 
  globalSupplierFilter = 'Todos', 
  selectedSector,
  sectors,
  onSectorChange,
  categoryFilter = 'TODOS'
}) => {
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [localSelectedSupplier, setLocalSelectedSupplier] = React.useState('Todos');
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [viewingInspection, setViewingInspection] = React.useState<Inspection | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const searchTerm = globalSearchTerm || localSearchTerm;
  const selectedSupplier = globalSupplierFilter !== 'Todos' ? globalSupplierFilter : localSelectedSupplier;

  // Dynamic Filtering Logic
  const filteredInspections = inspections
    .filter(ins => selectedSector === 'TODOS' || ins.setor === selectedSector)
    .filter(ins => categoryFilter === 'TODOS' || (ins.categoria || '').toUpperCase() === (categoryFilter || '').toUpperCase())
    .filter(ins => {
      const matchesSearch =
        (ins.material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSupplier = selectedSupplier === 'Todos' || ins.fornecedor === selectedSupplier;
      const matchesStatus = statusFilter === 'Todos' || ins.status === statusFilter;

      const insDate = new Date(ins.data + 'T00:00:00');
      const matchesStart = !startDate || insDate >= new Date(startDate + 'T00:00:00');
      const matchesEnd = !endDate || insDate <= new Date(endDate + 'T00:00:00');

      return matchesSearch && matchesSupplier && matchesStatus && matchesStart && matchesEnd;
    });

  // Calculate Ranking
  const sectorInspections = inspections.filter(i => selectedSector === 'TODOS' || i.setor === selectedSector);
  const supplierStats = sectorInspections.reduce((acc: any, ins) => {
    if (!acc[ins.fornecedor]) {
      acc[ins.fornecedor] = { name: ins.fornecedor, count: 0, approvals: 0 };
    }
    acc[ins.fornecedor].count += 1;
    if (ins.status === 'Aprovado') acc[ins.fornecedor].approvals += 1;
    return acc;
  }, {});

  const ranking = Object.values(supplierStats)
    .sort((a: any, b: any) => b.count - a.count)
    .map((item: any, idx) => ({
      pos: idx + 1,
      name: item.name,
      val: ((item.count / (sectorInspections.length || 1)) * 100).toFixed(1) + '%',
      color: idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#64748b'
    }));

  const suppliers = Array.from(new Set(sectorInspections.map(i => i.fornecedor))).filter(Boolean);

  const handleExportCSV = () => {
    const headers = [
      'ID Registro',
      'Setor',
      'Data Inspeção',
      'Data Chegada',
      'Código Material',
      'Descrição Material',
      'Fornecedor',
      'Status',
      'Inspetor',
      'Qtd Inspecionada',
      'Qtd Aprovada',
      'Qtd Rejeitada',
      'Motivo Não-Conformidade',
      'Nota Fiscal (NF)',
      'Número do Pedido',
      'Observações',
      'Evidências'
    ];

    const rows = filteredInspections.map(i => [
      i.id,
      i.setor || '',
      i.data,
      i.dataChegada || '',
      i.material,
      `"${(i.descricao || 'N/A').replace(/"/g, '""')}"`,
      `"${i.fornecedor.replace(/"/g, '""')}"`,
      i.status,
      `"${(i.inspetor || '').replace(/"/g, '""')}"`,
      i.qtdInspecionada || 0,
      i.qtdAprovada || 0,
      i.qtdRejeitada || 0,
      `"${(i.motivoRejeicao || '').replace(/"/g, '""')}"`,
      `"${(i.nf || '').replace(/"/g, '""')}"`,
      `"${(i.numeroPedido || '').replace(/"/g, '""')}"`,
      `"${(i.observacoes || '').replace(/"/g, '""')}"`,
      `"${(i.evidencias || []).join(' ; ')}"`
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_inspecoes_${new Date().toLocaleDateString('sv-SE')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 space-y-8 bg-[#05060A] text-slate-100 font-sans min-h-screen">
      
      {/* Phenomenon Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] text-blue-400 uppercase tracking-[0.2em]">
            <span>[ 04 // AUDIT_LOGS_AND_REPORTS ]</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
          </div>
          <h1 
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Relatórios & Auditoria
          </h1>
        </div>

        <div className="w-full md:w-auto">
          <SectorSwitcher sectors={sectors} selectedSector={selectedSector} onSectorChange={onSectorChange} />
        </div>
      </div>

      {/* Advanced Filter Bar (Phenomenon Minimalist Style) */}
      <div 
        className="p-5 sm:p-6 rounded-3xl relative overflow-hidden"
        style={{
          background: 'rgba(10, 12, 18, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            [ FILTROS_AVANÇADOS ]
          </span>
          <button
            onClick={() => {
              setLocalSearchTerm('');
              setStartDate('');
              setEndDate('');
              setLocalSelectedSupplier('Todos');
              setStatusFilter('Todos');
            }}
            className="font-mono text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-rounded text-sm">restart_alt</span>
            Resetar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase">DE:</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-mono text-white focus:outline-none p-0 w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase">ATÉ:</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-mono text-white focus:outline-none p-0 w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <select
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-white outline-none cursor-pointer"
            value={selectedSupplier}
            onChange={(e) => {
              if (globalSupplierFilter === 'Todos') {
                setLocalSelectedSupplier(e.target.value);
              }
            }}
          >
            <option value="Todos">FORNECEDOR: TODOS</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-white outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">STATUS: TODOS</option>
            <option value="Aprovado">APROVADOS</option>
            <option value="Rejeitado">REJEITADOS</option>
            <option value="Atenção">ATENÇÃO</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid: Ranking & Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Supplier Ranking */}
        <div 
          className="lg:col-span-4 p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div>
            <div className="mb-6">
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ VOLUMETRIA // RANKING ]</span>
              <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Participação de Fornecedores
              </h3>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {ranking.length > 0 ? (
                ranking.map((item) => (
                  <div 
                    key={item.pos} 
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500">0{item.pos}</span>
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300">
                      <span>{item.val}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center font-mono text-xs text-slate-500">Nenhum registro para exibir.</div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>AUDIT_CHECK</span>
            <span>TOTAL: {sectorInspections.length} LOTES</span>
          </div>
        </div>

        {/* Right Column: Full Interactive Data Table */}
        <div 
          className="lg:col-span-8 p-6 sm:p-8 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(10, 12, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">[ HISTÓRICO // LOGS ]</span>
              <h3 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Registros de Inspeções ({filteredInspections.length})
              </h3>
            </div>

            <button 
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-rounded text-sm text-emerald-400">download</span>
              <span>EXPORTAR CSV</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar rounded-2xl border border-white/[0.06]">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-10 bg-[#07090F] border-b border-white/[0.08] font-mono text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Material / Código</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Data Insp.</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredInspections.length > 0 ? (
                  filteredInspections.map((row) => {
                    const isApproved = row.status === 'Aprovado';
                    const isRejected = row.status === 'Rejeitado';
                    return (
                      <tr 
                        key={row.id}
                        onClick={() => setViewingInspection(row)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: isApproved ? 'rgba(16, 185, 129, 0.1)' : isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.25)' : isRejected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                              color: isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24'
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b' }} />
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white leading-tight">{row.descricao || 'Item sem descrição'}</p>
                          <p className="font-mono text-[10px] text-slate-500 mt-0.5">CÓD: {row.material}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">{row.fornecedor}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(row.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="material-symbols-rounded text-base text-slate-500 group-hover:text-blue-400 transition-colors">
                            arrow_forward
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center font-mono text-xs text-slate-500">
                      Nenhum registro encontrado para os critérios selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modern Phenomenon Inspection Detail Modal */}
      {viewingInspection && (() => {
        const isApproved = viewingInspection.status === 'Aprovado';
        const isRejected = viewingInspection.status === 'Rejeitado';
        const statusColor = isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24';
        const statusBg = isApproved ? 'rgba(16, 185, 129, 0.12)' : isRejected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
        const statusBorder = isApproved ? 'rgba(16, 185, 129, 0.25)' : isRejected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
        const miniStat = (label: string, value: React.ReactNode) => (
          <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2 min-w-0">
            <span className="text-slate-500 text-[9px] uppercase font-mono tracking-widest flex-shrink-0">{label}</span>
            <span className="text-xs font-bold text-white truncate text-right">{value}</span>
          </div>
        );
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-3xl flex flex-col relative"
            style={{
              background: 'rgba(10, 12, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)'
            }}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: statusBg, border: `1px solid ${statusBorder}` }}
                >
                  <span className="material-symbols-rounded !text-xl" style={{ color: statusColor }}>
                    {isApproved ? 'check_circle' : isRejected ? 'cancel' : 'schedule'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">
                      [ DETALHES // INSPEÇÃO #{viewingInspection.id} ]
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: statusBg, border: `1px solid ${statusBorder}`, color: statusColor }}
                    >
                      {viewingInspection.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5 truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {viewingInspection.descricao || viewingInspection.material}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(viewingInspection)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-rounded text-base">edit</span>
                  <span className="hidden sm:inline">EDITAR DADOS</span>
                  <span className="sm:hidden">EDITAR</span>
                </button>
                <button
                  onClick={() => setViewingInspection(null)}
                  className="w-8 h-8 rounded-xl bg-white/5 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                  aria-label="Fechar"
                >
                  <span className="material-symbols-rounded text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-slate-500 text-[9px] block uppercase font-mono tracking-widest">Material e Código</span>
                      <p className="text-sm font-bold text-white truncate">{viewingInspection.descricao || 'N/A'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Cód: {viewingInspection.material}</p>
                    </div>
                    <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-slate-500 text-[9px] block uppercase font-mono tracking-widest">Fornecedor</span>
                      <p className="text-sm font-bold text-white truncate">{viewingInspection.fornecedor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                    {miniStat('Setor', viewingInspection.setor || '---')}
                    {miniStat('DT. Chegada', viewingInspection.dataChegada ? new Date(viewingInspection.dataChegada + 'T00:00:00').toLocaleDateString('pt-BR') : '---')}
                    {miniStat('DT. Insp.', new Date(viewingInspection.data + 'T00:00:00').toLocaleDateString('pt-BR'))}
                    {miniStat('NF', viewingInspection.nf || 'N/A')}
                    {miniStat('Pedido', viewingInspection.numeroPedido || 'N/A')}
                    {miniStat('Inspetor', viewingInspection.inspetor || '---')}
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">[ QUANTIDADES E MÉTRICAS ]</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                        <p className="text-lg font-black text-white leading-tight">{viewingInspection.qtdInspecionada || 0}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Inspecionada</p>
                      </div>
                      <div
                        className="p-3 rounded-xl text-center"
                        style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      >
                        <p className="text-lg font-black leading-tight" style={{ color: '#34d399' }}>{viewingInspection.qtdAprovada || 0}</p>
                        <p className="text-[9px] font-bold uppercase font-mono" style={{ color: '#34d399' }}>Aprovada</p>
                      </div>
                      <div
                        className="p-3 rounded-xl text-center"
                        style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <p className="text-lg font-black leading-tight" style={{ color: '#f87171' }}>{viewingInspection.qtdRejeitada || 0}</p>
                        <p className="text-[9px] font-bold uppercase font-mono" style={{ color: '#f87171' }}>Rejeitada</p>
                      </div>
                    </div>
                  </div>

                  {isRejected && (
                    <div
                      className="px-3.5 py-2.5 rounded-xl"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-rounded !text-sm" style={{ color: '#f87171' }}>warning</span>
                        <h4 className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#f87171' }}>Motivo da Rejeição</h4>
                      </div>
                      <p className="text-xs font-bold text-white">{viewingInspection.motivoRejeicao || 'Não especificado'}</p>
                    </div>
                  )}

                  <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">[ OBSERVAÇÕES TÉCNICAS ]</span>
                    <p className="text-slate-300 text-xs leading-snug italic">
                      "{viewingInspection.observacoes || 'Nenhuma observação registrada.'}"
                    </p>
                  </div>
                </div>

                {/* Gallery Column */}
                <div className="space-y-2">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-rounded !text-sm">image</span> Evidências Visuais
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {viewingInspection.evidencias && viewingInspection.evidencias.length > 0 ? viewingInspection.evidencias.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className="group relative aspect-video bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.06] hover:border-blue-500/40 transition-all cursor-zoom-in"
                      >
                        <img src={url} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-rounded text-white !text-2xl">open_in_full</span>
                        </div>
                      </div>
                    )) : (
                      <div className="aspect-video rounded-xl flex flex-col items-center justify-center border border-dashed border-white/[0.1] bg-white/[0.01]">
                        <span className="material-symbols-rounded text-slate-600 !text-3xl mb-1.5">photo_camera</span>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono px-2 text-center">Sem evidências fotográficas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span>REGISTRO SINCRONIZADO</span>
              <span>DATA: {new Date(viewingInspection.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Full-screen Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300 p-4 sm:p-12 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center ring-1 ring-white/20 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <span className="material-symbols-rounded !text-2xl">close</span>
          </button>
          <img
            src={selectedImage}
            alt="Evidência ampliada"
            className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
};
