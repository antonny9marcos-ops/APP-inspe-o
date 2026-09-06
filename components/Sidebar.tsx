import React from 'react';
import { View, UserProfile } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedSector: string;
}

export const Sidebar: React.FC<SidebarProps & { profile: UserProfile }> = ({ 
  currentView, 
  onNavigate, 
  isOpen, 
  onClose, 
  profile, 
  selectedSector 
}) => {
  const isAdmin = profile.role === 'Admin';
  const isClient = profile.role === 'Cliente';

  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard', code: '01' },
    {
      view: View.INSPECTION_FORM,
      label: 'Cadastrar Inspeção',
      icon: 'add_task',
      code: '02',
      disabled: isClient
    },
    { view: View.MATERIALS, label: 'Materiais & Lotes', icon: 'inventory_2', code: '03' },
    { view: View.REPORTS, label: 'Relatórios & Registros', icon: 'description', code: '04' },
    { view: View.ANALYTICS, label: 'BI & Inteligência', icon: 'monitoring', code: '05' },
    ...(isAdmin ? [{ view: View.USERS, label: 'Controle de Usuários', icon: 'shield_person', code: '06' }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-[#05060A] border-r border-white/[0.07] font-sans select-none
      `}>
        {/* Top Branding Section */}
        <div>
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white relative group"
                style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}
              >
                <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  token
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              </div>
              <div>
                <h1 
                  className="font-extrabold text-white text-[15px] tracking-tight leading-none"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  MC INDUSTRIAL
                </h1>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-blue-400 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>{selectedSector === 'TODOS' ? 'TODOS OS SETORES' : selectedSector}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <span className="material-symbols-rounded text-lg">close</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pt-2 pb-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                [ 01 // NAVEGAÇÃO_PRINCIPAL ]
              </span>
            </div>

            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => !item.disabled && onNavigate(item.view)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer relative
                    ${isActive 
                      ? 'bg-white/[0.05] border border-white/[0.12] text-white shadow-[0_0_25px_rgba(59,130,246,0.1)]' 
                      : item.disabled
                        ? 'opacity-30 cursor-not-allowed text-slate-600'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className={`material-symbols-rounded text-lg transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span className={`text-xs tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.disabled ? (
                      <span className="material-symbols-rounded text-xs text-slate-600">lock</span>
                    ) : (
                      <span className={`font-mono text-[9px] tracking-widest ${isActive ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>
                        {item.code}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & System Telemetry Card */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <button
            onClick={() => onNavigate(View.SETTINGS)}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer
              ${currentView === View.SETTINGS 
                ? 'bg-white/[0.05] border border-white/[0.12] text-white' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-lg text-slate-500">settings</span>
              <span>Configurações do Sistema</span>
            </div>
            <span className="font-mono text-[9px] text-slate-600">07</span>
          </button>

          {/* User Profile Capsule */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
                  alt={profile.name}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#05060A]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{profile.name}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-blue-400 mt-0.5">{profile.role}</p>
              </div>
            </div>

            <div className="font-mono text-[9px] text-slate-600 border border-white/5 px-2 py-0.5 rounded">
              AUTH
            </div>
          </div>

          {/* System Footer Bar */}
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-600 px-1 pt-1">
            <span>MC_QC · v2.4</span>
            <span className="text-emerald-500/80">ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
};
