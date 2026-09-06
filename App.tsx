
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
import { SectorSwitcher } from './components/SectorSwitcher';
import { WhatIsNew } from './components/WhatIsNew';

const SECTORS = ['1058 Carajás', '4065 São Luis', '4050 S11D'];


const INITIAL_INSPECTIONS: Inspection[] = [
  { id: '#QC-8921', material: 'Liga de Alumínio T6', fornecedor: 'MetalWorks Inc.', data: '2023-10-24', status: 'Aprovado', inspetor: 'Sarah Jones' },
  { id: '#QC-8920', material: 'Parafusos de Alta Resistência', fornecedor: 'FastenAll Co.', data: '2023-10-24', status: 'Rejeitado', inspetor: 'Mike Ross' },
  { id: '#QC-8919', material: 'Selante Polimérico B2', fornecedor: 'ChemPlast Ltd.', data: '2023-10-23', status: 'Aprovado', inspetor: 'Sarah Jones' },
  { id: '#QC-8918', material: 'Placa de Alumínio 5083', fornecedor: 'AluTech Global', data: '2023-10-22', status: 'Atenção', inspetor: 'Marcus Chen' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showWhatIsNew, setShowWhatIsNew] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');

  // Estado do Tema (Default: 'light' conforme solicitado pelo usuário)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('todos');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Usuário',
    role: 'Acessando...',
    avatar: 'https://picsum.photos/seed/user/100'
  });

  useEffect(() => {
    const loadUserProfile = async (user: any) => {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('nome, role, avatar_url, setor')
          .eq('id', user.id)
          .single();

        if (error) {
          // Se não encontrar o perfil, usa os metadados como fallback seguro ou padrão baixo
          const rawAvatar = user.user_metadata.avatar_url;
          setUserProfile({
            name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário',
            role: user.user_metadata.role || 'Cliente', 
            avatar: rawAvatar ? `${rawAvatar.split('?')[0]}?t=${Date.now()}` : `https://picsum.photos/seed/${user.id}/100`,
            setor: user.user_metadata.setor
          });
        } else {
          const rawAvatar = data.avatar_url;
          setUserProfile({
            name: data.nome || 'Usuário',
            role: data.role || 'Inspetor',
            avatar: rawAvatar ? `${rawAvatar.split('?')[0]}?t=${Date.now()}` : `https://picsum.photos/seed/${user.id}/100`,
            setor: data.setor
          });
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const lastSeenVersion = localStorage.getItem('app_version_seen');
      const CURRENT_VERSION = '1.2';
      if (lastSeenVersion !== CURRENT_VERSION) {
        setShowWhatIsNew(true);
      }
    }
  }, [session]);

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
        categoria: (() => {
          const rawCat = (item.categoria || '').toUpperCase();
          const rawDesc = (item.material_descricao || '').toUpperCase();
          const rawForn = (item.fornecedor || '').toUpperCase();
          
          const isRolo = (
            rawCat.includes('ROLO') || 
            rawCat.includes('ROLETE') || 
            rawDesc.includes('ROLO') || 
            rawDesc.includes('ROLETE') ||
            ['IMEPEL', 'SUPERIOR'].some(f => rawForn.includes(f))
          );
          
          return isRolo ? 'ROLO TRANSPORTADOR' : 'OUTROS';
        })(),
        unidade: item.unidade || 'UN',
        setor: item.setor || '1058 Carajás'
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
    if (view === View.INSPECTION_FORM) {
      setEditingInspection(null);
    }
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleAddInspection = (newInspection: Inspection) => {
    fetchInspections(); // Refresh data from Supabase
    setEditingInspection(null);
    setCurrentView(View.DASHBOARD);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPeriodFilter('todos');
    setSupplierFilter('Todos');
    setYearFilter('all');
    setMonthFilter('all');
    setWeekFilter('all');
    setCategoryFilter('TODOS');
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
    const list = Array.from(new Set(inspections
      .filter(i => selectedSector === 'TODOS' || i.setor === selectedSector)
      .map(i => (i.fornecedor || '').trim()).filter(Boolean)));
    return ['Todos', ...list.sort()];
  }, [inspections, selectedSector]);

  const filteredBySector = useMemo(() => {
    return inspections.filter(i => i.setor === selectedSector);
  }, [inspections, selectedSector]);

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
            selectedSector={selectedSector}
            sectors={SECTORS}
            onSectorChange={setSelectedSector}
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
            initialData={editingInspection || { setor: selectedSector } as any}
            userProfile={userProfile}
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
            selectedSector={selectedSector}
            sectors={SECTORS}
            onSectorChange={setSelectedSector}
            categoryFilter={categoryFilter}
          />
        );
      case View.SETTINGS:
        return (
          <Settings
            profile={userProfile}
            onUpdateProfile={async (newProfile) => {
              setUserProfile(newProfile);

              const cleanAvatarUrl = newProfile.avatar ? newProfile.avatar.split('?')[0] : newProfile.avatar;

              // Atualiza metadados do Auth
              const { error: authError } = await supabase.auth.updateUser({
                data: {
                  full_name: newProfile.name,
                  role: newProfile.role,
                  avatar_url: cleanAvatarUrl
                }
              });

              if (authError) console.warn('Aviso auth:', authError.message);

              // Persiste também na tabela 'perfis' para carregamento futuro
              if (session?.user?.id) {
                const { error: profileError } = await supabase
                  .from('perfis')
                  .update({
                    nome: newProfile.name,
                    avatar_url: cleanAvatarUrl,
                  })
                  .eq('id', session.user.id);

                if (profileError) {
                  console.error('Erro ao atualizar perfis:', profileError);
                }
              }
            }}
            onUpdatePassword={async (newPassword) => {
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
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
            selectedSector={selectedSector}
            sectors={SECTORS}
            onSectorChange={setSelectedSector}
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
    <div className="flex h-screen overflow-hidden bg-[#05060A] text-slate-100 font-sans">
      {/* Sidebar Overlay para Mobile — handled inside Sidebar */}

      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profile={userProfile}
        selectedSector={selectedSector}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          onMenuClick={() => setIsSidebarOpen(true)}
          profile={userProfile}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={fetchInspections}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {(currentView === View.DASHBOARD) && (
            <div className="px-4 sm:px-8 lg:px-10 mt-5">
              <div 
                className="flex flex-wrap gap-2.5 items-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm glass"
              >
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer font-mono text-[10px] text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08]"
                >
                  <span className="material-symbols-rounded text-sm">filter_list_off</span>
                  <span>RESET</span>
                </button>

                {[
                  { value: periodFilter, onChange: setPeriodFilter, options: [
                    { v: 'todos', l: 'PERÍODO: GERAL' }, { v: 'últimos 30 dias', l: 'ÚLTIMOS 30 DIAS' },
                    { v: 'últimos 7 dias', l: 'ÚLTIMOS 7 DIAS' }, { v: 'hoje', l: 'HOJE' }, { v: 'este mês', l: 'ESTE MÊS' }
                  ]},
                ].map((sel, idx) => (
                  <select
                    key={idx}
                    value={sel.value}
                    onChange={(e) => sel.onChange(e.target.value)}
                    className="rounded-xl font-mono text-[10px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    {sel.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ))}

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-xl font-mono text-[10px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
                >
                  <option value="all">ANO: TODOS</option>
                  {filterOptions.years.map(y => <option key={y} value={y}>ANO: {y}</option>)}
                </select>

                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="rounded-xl font-mono text-[10px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
                >
                  <option value="all">MÊS: TODOS</option>
                  {filterOptions.months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>

                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="rounded-xl font-mono text-[10px] uppercase h-9 px-3 outline-none cursor-pointer transition-all appearance-none max-w-[150px] truncate bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white"
                >
                  {suppliers.map(s => (
                    <option key={s} value={s}>{s === 'Todos' ? 'FORNECEDOR: TODOS' : s}</option>
                  ))}
                </select>

                <div className="w-px h-5 mx-1 hidden sm:block bg-white/[0.08]" />

                <div className="flex p-1 rounded-xl gap-1 bg-white/[0.02] border border-white/[0.06]">
                  {['ROLO TRANSPORTADOR', 'OUTROS', 'TODOS'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        if (cat === 'TODOS') resetFilters();
                        else setCategoryFilter(cat);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                        categoryFilter === cat 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {cat === 'TODOS' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {renderContent()}
        </main>

      </div>
      
      {showWhatIsNew && (
        <WhatIsNew 
          onClose={() => {
            setShowWhatIsNew(false);
            localStorage.setItem('app_version_seen', '1.2');
          }} 
        />
      )}
    </div>
  );
}
