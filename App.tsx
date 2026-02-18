
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { InspectionForm } from './components/InspectionForm';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Materials } from './components/Materials';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
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
  const [periodFilter, setPeriodFilter] = useState('últimos 30 dias');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<string>('all');

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

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
        fornecedor: item.fornecedor,
        data: item.data,
        status: (item.qtd_rejeitada > 0 ? 'Rejeitado' : 'Aprovado') as any,
        inspetor: item.inspetor,
        nf: item.nf,
        numeroPedido: item.numero_pedido,
        qtdInspecionada: item.qtd_inspecionada,
        qtdAprovada: item.qtd_aprovada,
        qtdRejeitada: item.qtd_rejeitada,
        motivoRejeicao: item.motivo_rejeicao,
        observacoes: item.observacoes,
        evidencias: item.evidencias
      }));

      setInspections(mappedData);
    } catch (err) {
      console.error('Erro ao buscar inspeções:', err);
    }
  };

  useEffect(() => {
    fetchInspections();
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
            onPeriodChange={setPeriodFilter}
            onSupplierChange={setSupplierFilter}
            onYearChange={setYearFilter}
            onMonthChange={setMonthFilter}
            onWeekChange={setWeekFilter}
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
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
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
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          currentView={currentView}
          onMenuClick={() => setIsSidebarOpen(true)}
          profile={userProfile}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLogout={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
