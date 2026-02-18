import React from 'react';
import { Inspection } from '../types';

const PrintStyles = () => (
  <style>{`
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
      }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      @page { margin: 1cm; }
    }
  `}</style>
);

interface ReportsProps {
  inspections: Inspection[];
  onEdit: (inspection: Inspection) => void;
  globalSearchTerm?: string;
  globalSupplierFilter?: string;
}

export const Reports: React.FC<ReportsProps> = ({ inspections, onEdit, globalSearchTerm = '', globalSupplierFilter = 'Todos' }) => {
  const [localSearchTerm, setLocalSearchTerm] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [localSelectedSupplier, setLocalSelectedSupplier] = React.useState('Todos');
  const [statusFilter, setStatusFilter] = React.useState('Todos');
  const [viewingInspection, setViewingInspection] = React.useState<Inspection | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Use global values if provided, otherwise local
  const searchTerm = globalSearchTerm || localSearchTerm;
  const selectedSupplier = globalSupplierFilter !== 'Todos' ? globalSupplierFilter : localSelectedSupplier;

  // Dynamic Filtering Logic
  const filteredInspections = inspections.filter(ins => {
    const matchesSearch =
      ins.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSupplier = selectedSupplier === 'Todos' || ins.fornecedor === selectedSupplier;
    const matchesStatus = statusFilter === 'Todos' || ins.status === statusFilter;

    const insDate = new Date(ins.data);
    const matchesStart = !startDate || insDate >= new Date(startDate);
    const matchesEnd = !endDate || insDate <= new Date(endDate);

    return matchesSearch && matchesSupplier && matchesStatus && matchesStart && matchesEnd;
  });

  // Calculate Dynamic Ranking
  const supplierStats = inspections.reduce((acc: any, ins) => {
    if (!acc[ins.fornecedor]) {
      acc[ins.fornecedor] = { name: ins.fornecedor, count: 0, approvals: 0 };
    }
    acc[ins.fornecedor].count += 1;
    if (ins.status === 'Aprovado') acc[ins.fornecedor].approvals += 1;
    return acc;
  }, {});

  const ranking = Object.values(supplierStats)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 4)
    .map((item: any, idx) => ({
      pos: idx + 1,
      name: item.name,
      cat: 'Fornecedor Ativo',
      val: ((item.count / (inspections.length || 1)) * 100).toFixed(1) + '%',
      color: idx === 0 ? 'bg-success' : idx === 1 ? 'bg-primary' : 'bg-slate-400'
    }));

  const suppliers = Array.from(new Set(inspections.map(i => i.fornecedor))).filter(Boolean);

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'DT. Entrad',
      'Material',
      'Desc.Mate',
      'Fornecedor',
      'Status',
      'Inspetor',
      'Quant.',
      'Qtd. Aprov',
      'Qtd. Rejeit',
      'Motivo',
      'NF',
      'Pedido',
      'Obs',
      'Evidências (Links)'
    ];

    const rows = filteredInspections.map(i => [
      i.id,
      i.data,
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

    // Use semicolon as separator for Brazilian Excel compatibility
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_inspecoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
            <span className="material-symbols-rounded !text-3xl fill-1">verified_user</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Relatórios e Análises</h1>
            <p className="text-slate-500 mt-1 font-medium">Revise métricas e gere documentação de conformidade.</p>
          </div>
        </div>
        <div className="relative w-full md:w-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por ID, Material ou Fornecedor..."
            className="w-full md:w-80 h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-primary focus:border-primary font-medium text-sm"
            value={searchTerm}
            onChange={(e) => {
              if (globalSearchTerm === undefined) {
                setLocalSearchTerm(e.target.value);
              }
            }}
            readOnly={globalSearchTerm !== undefined && globalSearchTerm !== ''}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filtros Avançados</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl px-5 h-12 items-center gap-3">
            <span className="text-slate-700 text-xs font-bold whitespace-nowrap">Início</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-0"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl px-5 h-12 items-center gap-3">
            <span className="text-slate-700 text-xs font-bold whitespace-nowrap">Fim</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-0"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <select
            className="bg-slate-50 border border-slate-100 rounded-2xl px-5 h-12 text-xs font-bold text-slate-700 max-w-[200px]"
            value={selectedSupplier}
            onChange={(e) => {
              if (globalSupplierFilter === 'Todos') {
                setLocalSelectedSupplier(e.target.value);
              }
            }}
          >
            <option value="Todos">Fornecedor: Todos</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="bg-slate-50 border border-slate-100 rounded-2xl px-5 h-12 text-xs font-bold text-slate-700 max-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Aprovado">Aprovados</option>
            <option value="Rejeitado">Rejeitados</option>
            <option value="Atenção">Atenção</option>
          </select>
          <div className="flex-1"></div>
          <button
            onClick={() => {
              setLocalSearchTerm('');
              setStartDate('');
              setEndDate('');
              setLocalSelectedSupplier('Todos');
              setStatusFilter('Todos');
            }}
            className="text-primary font-bold text-xs flex items-center gap-2 hover:bg-primary/5 px-4 py-2 rounded-xl transition-all"
          >
            <span className="material-symbols-rounded !text-lg">filter_list_off</span> Limpar Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 pb-4">
            <h2 className="text-xl font-black text-slate-900">Ranking de Fornecedores</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Baseado no volume de inspeções</p>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {ranking.length > 0 ? ranking.map((item) => (
              <div key={item.pos} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${item.pos === 1 ? 'bg-success/10 text-success' : 'bg-slate-50 text-slate-600'}`}>
                    {item.pos}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.cat}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <span className="text-sm font-black text-slate-900">{item.val}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: item.val }}></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 text-xs font-bold">Nenhum dado disponível</div>
            )}
          </div>
          <button className="w-full py-6 text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/50 hover:bg-slate-100 border-t border-slate-50">
            Relatório de Conformidade Geral
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Histórico de Inspeções</h2>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 shadow-sm hover:bg-slate-50">
                <span className="material-symbols-rounded !text-lg text-danger">picture_as_pdf</span> PDF
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 shadow-sm hover:bg-slate-50">
                <span className="material-symbols-rounded !text-lg text-success">table_chart</span> EXCEL
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material/Código</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInspections.length > 0 ? filteredInspections.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setViewingInspection(row)}
                      className="hover:bg-slate-50/50 transition-all cursor-pointer group"
                    >
                      <td className="px-8 py-5 text-xs font-black text-slate-900 font-mono tracking-tighter">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-rounded text-slate-300 group-hover:text-primary transition-colors !text-sm">edit</span>
                          #{row.id}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-700">{row.descricao || 'N/A'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cód: {row.material}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-400">{row.fornecedor}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-500 text-right">
                        {new Date(row.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">Nenhuma inspeção encontrada com estes filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-6 bg-slate-50/30 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Mostrando {filteredInspections.length} de {inspections.length} entradas</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-100">
        <div className="flex gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <span>© 2026 MC Industrial Systems Inc.</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] font-black text-slate-900 uppercase">Status do Banco: Conectado</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Sincronizado com Supabase</p>
          </div>
          <div className="w-3 h-3 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        </div>
      </footer>

      {/* Modern Inspection Detail Modal */}
      {viewingInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${viewingInspection.status === 'Aprovado' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  <span className="material-symbols-rounded !text-3xl">
                    {viewingInspection.status === 'Aprovado' ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inspeção #{viewingInspection.id}</h2>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingInspection.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {viewingInspection.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider font-mono">ID: {viewingInspection.realId}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(viewingInspection)}
                  className="flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  <span className="material-symbols-rounded !text-lg">edit</span> EDITAR DADOS
                </button>
                <button
                  onClick={() => setViewingInspection(null)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Material e Código</span>
                      <p className="text-lg font-black text-slate-800">{viewingInspection.descricao || 'N/A'}</p>
                      <p className="text-sm font-bold text-slate-500 mt-1 uppercase">Cód: {viewingInspection.material}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fornecedor</span>
                      <p className="text-lg font-black text-slate-800">{viewingInspection.fornecedor}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-5 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DT. Entrada</p>
                      <p className="text-sm font-black text-slate-700">{new Date(viewingInspection.data).toLocaleDateString()}</p>
                    </div>
                    <div className="p-5 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NF</p>
                      <p className="text-sm font-black text-slate-700">{viewingInspection.nf || 'N/A'}</p>
                    </div>
                    <div className="p-5 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pedido</p>
                      <p className="text-sm font-black text-slate-700">{viewingInspection.numeroPedido || 'N/A'}</p>
                    </div>
                    <div className="p-5 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inspetor</p>
                      <p className="text-sm font-black text-slate-700">{viewingInspection.inspetor || '---'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Quantidades e Métricas</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl text-center">
                        <p className="text-3xl font-black text-slate-800">{viewingInspection.qtdInspecionada || 0}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Inspecionada</p>
                      </div>
                      <div className="p-6 bg-green-50 rounded-3xl text-center">
                        <p className="text-3xl font-black text-green-700">{viewingInspection.qtdAprovada || 0}</p>
                        <p className="text-[10px] font-bold text-green-400 uppercase mt-1">Aprovada</p>
                      </div>
                      <div className="p-6 bg-red-50 rounded-3xl text-center">
                        <p className="text-3xl font-black text-red-700">{viewingInspection.qtdRejeitada || 0}</p>
                        <p className="text-[10px] font-bold text-red-400 uppercase mt-1">Rejeitada</p>
                      </div>
                    </div>
                  </div>

                  {viewingInspection.status === 'Rejeitado' && (
                    <div className="p-6 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-rounded">warning</span>
                        <h4 className="text-xs font-black uppercase tracking-widest">Motivo da Rejeição</h4>
                      </div>
                      <p className="text-lg font-bold">{viewingInspection.motivoRejeicao || 'Não especificado'}</p>
                    </div>
                  )}

                  <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-rounded text-primary">notes</span>
                      <h4 className="text-xs font-black uppercase tracking-widest">Observações Detalhadas</h4>
                    </div>
                    <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
                      "{viewingInspection.observacoes || 'Nenhuma observação registrada.'}"
                    </p>
                  </div>
                </div>

                {/* Gallery Column */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-rounded !text-lg">image</span> Evidências Visuais
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {viewingInspection.evidencias && viewingInspection.evidencias.length > 0 ? viewingInspection.evidencias.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className="group relative aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 hover:border-primary transition-all cursor-zoom-in"
                      >
                        <img src={url} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-rounded text-white !text-3xl">open_in_full</span>
                        </div>
                      </div>
                    )) : (
                      <div className="aspect-video bg-slate-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                        <span className="material-symbols-rounded text-slate-300 !text-5xl mb-3">photo_camera</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem evidências fotográficas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300 p-4 sm:p-12 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center ring-1 ring-white/20"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <span className="material-symbols-rounded !text-3xl">close</span>
          </button>
          <img
            src={selectedImage}
            alt="Evidência ampliada"
            className="max-w-full max-h-full rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Print-only Detailed View */}
      <div id="print-area" className="hidden print:block p-8">
        <PrintStyles />
        <div className="flex justify-between items-center mb-10 border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Relatório de Inspeções Detalhado</h1>
            <p className="text-sm font-bold text-slate-500 uppercase mt-1">Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-primary">MC Industrial</p>
            <p className="text-xs font-bold text-slate-400 font-mono">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
          </div>
        </div>

        <div className="space-y-12">
          {filteredInspections.map((ins, index) => (
            <div key={ins.id} className={`border-2 border-slate-100 rounded-3xl p-8 page-break`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID da Inspeção</span>
                  <h2 className="text-2xl font-black text-slate-900 font-mono">#{ins.id}</h2>
                </div>
                <div className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${ins.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Status: {ins.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Material / Descrição</p>
                  <p className="text-sm font-black text-slate-800">{ins.descricao || 'N/A'}</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">Cód: {ins.material}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fornecedor</p>
                  <p className="text-sm font-black text-slate-800">{ins.fornecedor}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data e Inspetor</p>
                  <p className="text-sm font-black text-slate-800">{new Date(ins.data).toLocaleDateString('pt-BR')} — {ins.inspetor || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Documentação (NF / Pedido)</p>
                  <p className="text-sm font-black text-slate-800">NF: {ins.nf || 'N/A'} — Pedido: {ins.numeroPedido || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantidades</p>
                  <div className="flex gap-4 mt-1">
                    <div className="text-center bg-slate-50 px-3 py-1 rounded-lg">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Insp</p>
                      <p className="text-xs font-black text-slate-700">{ins.qtdInspecionada || 0}</p>
                    </div>
                    <div className="text-center bg-green-50 px-3 py-1 rounded-lg">
                      <p className="text-[9px] font-bold text-green-400 uppercase">Aprov</p>
                      <p className="text-xs font-black text-green-700">{ins.qtdAprovada || 0}</p>
                    </div>
                    <div className="text-center bg-red-50 px-3 py-1 rounded-lg">
                      <p className="text-[9px] font-bold text-red-400 uppercase">Rejeit</p>
                      <p className="text-xs font-black text-red-700">{ins.qtdRejeitada || 0}</p>
                    </div>
                  </div>
                </div>
                {ins.status === 'Rejeitado' && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-danger">Motivo da Rejeição</p>
                    <p className="text-sm font-black text-danger">{ins.motivoRejeicao || 'Não especificado'}</p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações Adicionais</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                  {ins.observacoes || 'Nenhuma observação registrada para esta inspeção.'}
                </p>
              </div>

              {ins.evidencias && ins.evidencias.length > 0 && (
                <div className="mt-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Evidências Fotográficas</p>
                  <div className="grid grid-cols-4 gap-4">
                    {ins.evidencias.map((url, i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={url} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

