
import React from 'react';
import { Inspection } from '../types';

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

    const insDate = new Date(ins.data);
    const matchesStart = !startDate || insDate >= new Date(startDate);
    const matchesEnd = !endDate || insDate <= new Date(endDate);

    return matchesSearch && matchesSupplier && matchesStart && matchesEnd;
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
    const headers = ['ID', 'Material', 'Fornecedor', 'Status', 'Data'];
    const rows = filteredInspections.map(i => [i.id, i.material, i.fornecedor, i.status, i.data]);
    const csvContent = "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_inspecoes.csv");
    document.body.appendChild(link);
    link.click();
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
          <div className="flex-1"></div>
          <button
            onClick={() => {
              setLocalSearchTerm('');
              setStartDate('');
              setEndDate('');
              setLocalSelectedSupplier('Todos');
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
                      onClick={() => onEdit(row)}
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
    </div>
  );
};

