
import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { InspectionForm } from './components/InspectionForm';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Materials } from './components/Materials';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Analytics } from './components/Analytics';
import { View, Inspection, UserProfile } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';


const INITIAL_INSPECTIONS: Inspection[] = [
  { id: '#QC-8921', material: 'Liga de Alumínio T6', fornecedor: 'MetalWorks Inc.', data: '2023-10-24', status: 'Aprovado', inspetor: 'Sarah Jones' },
  { id: '#QC-8920', material: 'Parafusos de Alta Resistência', fornecedor: 'FastenAll Co.', data: '2023-10-24', status: 'Rejeitado', inspetor: 'Mike Ross' },
  { id: '#QC-8919', material: 'Selante Polimérico B2', fornecedor: 'ChemPlast Ltd.', data: '2023-10-23', status: 'Aprovado', inspetor: 'Sarah Jones' },
  { id: '#QC-8918', material: 'Placa de Alumínio 5083', fornecedor: 'AluTech Global', data: '2023-10-22', status: 'Atenção', inspetor: 'Marcus Chen' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('todos');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('ROLO TRANSPORTADOR');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Usuário',
    role: 'Acessando...',
    avatar: 'https://picsum.photos/seed/user/100'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUserProfile({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          role: session.user.user_metadata.role || 'Operador',
          avatar: session.user.user_metadata.avatar_url || `https://picsum.photos/seed/${session.user.id}/100`
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserProfile({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          role: session.user.user_metadata.role || 'Operador',
          avatar: session.user.user_metadata.avatar_url || `https://picsum.photos/seed/${session.user.id}/100`
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateLastAccess = async (userId: string) => {
    try {
      await supabase
        .from('perfis')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.error('Erro ao atualizar último acesso:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      updateLastAccess(session.user.id);
      
      // Heartbeat every 2 minutes
      const interval = setInterval(() => {
        updateLastAccess(session.user.id);
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('inspecoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database fields to Inspection interface
      const mappedData: Inspection[] = (data || []).map(item => ({
        realId: item.id, // Keep the full UUID for updates
        id: item.id.substring(0, 8).toUpperCase(), // Shortened ID for UI
        material: item.material_codigo,
        descricao: item.material_descricao,
        fornecedor: (item.fornecedor || '').trim(),
        data: item.data,
        dataChegada: item.data_chegada,
        status: (item.qtd_rejeitada > 0 ? 'Rejeitado' : 'Aprovado') as any,
        inspetor: item.inspetor,
        nf: item.nf,
        numeroPedido: item.numero_pedido,
        qtdInspecionada: item.qtd_inspecionada,
        qtdAprovada: item.qtd_aprovada,
        qtdRejeitada: item.qtd_rejeitada,
        motivoRejeicao: item.motivo_rejeicao,
        observacoes: item.observacoes,
        evidencias: item.evidencias,
        categoria: (item.categoria === 'Roletes' || item.categoria === 'Rolos de Carga') 
          ? 'ROLO TRANSPORTADOR' 
          : (item.categoria || 'Outros'),
        unidade: item.unidade || 'UN'
      }));

      setInspections(mappedData);
    } catch (err) {
      console.error('Erro ao buscar inspeções:', err);
    }
  };

  useEffect(() => {
    fetchInspections();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:inspecoes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'inspecoes'
        },
        (payload) => {
          console.log('Realtime change detected:', payload);
          fetchInspections(); // Refresh the list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fecha a sidebar ao mudar de view no mobile
  const navigate = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleAddInspection = (newInspection: Inspection) => {
    fetchInspections(); // Refresh data from Supabase
    setEditingInspection(null);
    setCurrentView(View.DASHBOARD);
  };

  const filterOptions = useMemo(() => {
    const years = Array.from(new Set(inspections.map(i => new Date(i.data + 'T00:00:00').getFullYear().toString()))).sort().reverse();
    return {
      years,
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

  const handleEditClick = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setCurrentView(View.INSPECTION_FORM);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard
            inspections={inspections}
            searchTerm={searchTerm}
            periodFilter={periodFilter}
            supplierFilter={supplierFilter}
            yearFilter={yearFilter}
            monthFilter={monthFilter}
            weekFilter={weekFilter}
            categoryFilter={categoryFilter}
            filterOptions={filterOptions}
            onPeriodChange={setPeriodFilter}
            onSupplierChange={setSupplierFilter}
            onCategoryChange={setCategoryFilter}
            onAddClick={() => {
              if (userProfile.role === 'Cliente') return;
              setEditingInspection(null);
              setCurrentView(View.INSPECTION_FORM);
            }}
          />
        );
      case View.INSPECTION_FORM:
        return (
          <InspectionForm
            initialData={editingInspection || undefined}
            onSave={handleAddInspection}
            onDelete={() => {
              fetchInspections();
              setEditingInspection(null);
              setCurrentView(View.DASHBOARD);
            }}
            onCancel={() => { setEditingInspection(null); setCurrentView(View.DASHBOARD); }}
            onViewHistory={() => navigate(View.REPORTS)}
          />
        );
      case View.REPORTS:
        return (
          <Reports
            inspections={inspections}
            onEdit={handleEditClick}
            globalSearchTerm={searchTerm}
            globalSupplierFilter={supplierFilter}
          />
        );
      case View.SETTINGS:
        return (
          <Settings
            profile={userProfile}
            onUpdateProfile={async (newProfile) => {
              setUserProfile(newProfile);

              // Persistir no Supabase Auth metadata
              const { error } = await supabase.auth.updateUser({
                data: {
                  full_name: newProfile.name,
                  role: newProfile.role,
                  avatar_url: newProfile.avatar
                }
              });

              if (error) {
                console.error('Erro ao atualizar perfil no Supabase:', error);
                throw error;
              }
            }}
            password="*****"
            onUpdatePassword={async (newPassword) => {
              await supabase.auth.updateUser({ password: newPassword });
            }}
          />
        );
      case View.MATERIALS:
        return <Materials role={userProfile.role} />;
      case View.USERS:
        return <UserManagement />;
      case View.ANALYTICS:
        return (
          <Analytics 
            inspections={inspections}
            searchTerm={searchTerm}
            periodFilter={periodFilter}
            supplierFilter={supplierFilter}
            yearFilter={yearFilter}
            monthFilter={monthFilter}
            weekFilter={weekFilter}
            categoryFilter={categoryFilter}
          />
        );
      default:
        return (
          <div className="p-4 md:p-8 flex items-center justify-center h-full">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">construction</span>
              <h2 className="text-xl font-bold text-slate-400">Em desenvolvimento.</h2>
              <button onClick={() => setCurrentView(View.DASHBOARD)} className="mt-4 text-primary font-bold">Dashboard</button>
            </div>
          </div>
        );
    }
  };

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      {/* Sidebar Overlay para Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profile={userProfile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          onMenuClick={() => setIsSidebarOpen(true)}
          profile={userProfile}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchInspections}
          onLogout={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
        />
        <main className="flex-1 overflow-y-auto">
          {(currentView === View.DASHBOARD || currentView === View.ANALYTICS) && (
            <div className="px-4 md:px-8 mt-6">
              <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="material-symbols-rounded text-slate-400 !text-lg">filter_list</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros</span>
                </div>
                
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest h-10 px-4 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none pr-8 relative"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.8rem' }}
                >
                  <option value="todos">Geral</option>
                  <option value="últimos 30 dias">30 Dias</option>
                  <option value="últimos 7 dias">7 Dias</option>
                  <option value="hoje">Hoje</option>
                  <option value="este mês">Mês</option>
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest h-10 px-4 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none pr-8 relative font-bold"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.8rem' }}
                >
                  <option value="all">Ano: Todos</option>
                  {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest h-10 px-4 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none pr-8 relative"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.8rem' }}
                >
                  <option value="all">Mês: Todos</option>
                  {filterOptions.months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>

                <select
                  value={weekFilter}
                  onChange={(e) => setWeekFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest h-10 px-4 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none pr-8 relative"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.8rem' }}
                >
                  <option value="all">Sem: Todos</option>
                  {Array.from({ length: 53 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>S {i + 1}</option>
                  ))}
                </select>

                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest h-10 px-4 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none pr-8 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.8rem' }}
                >
                  {suppliers.map(s => (
                    <option key={s} value={s}>{s === 'Todos' ? 'Fornecedor: Todos' : s}</option>
                  ))}
                </select>

                <div className="h-6 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>

                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  {['ROLO TRANSPORTADOR', 'Correias', 'Todos'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        categoryFilter === cat 
                        ? 'bg-white text-primary shadow-sm border border-slate-100' 
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
