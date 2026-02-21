import React from 'react';
import { View, UserProfile } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps & { profile: UserProfile }> = ({ currentView, onNavigate, isOpen, onClose, profile }) => {
  const isAdmin = profile.role === 'Admin';
  const isClient = profile.role === 'Cliente';

  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    {
      view: View.INSPECTION_FORM,
      label: 'Cadastrar Inspeção',
      icon: 'assignment_add',
      disabled: isClient
    },
    { view: View.MATERIALS, label: 'Materiais', icon: 'inventory_2' },
    { view: View.REPORTS, label: 'Relatórios', icon: 'analytics' },
    ...(isAdmin ? [{ view: View.USERS, label: 'Usuários', icon: 'group' }] : []),
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
      transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex flex-col h-full py-6">
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="bg-primary rounded-xl p-2.5 text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-rounded !text-2xl fill-1">factory</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 text-base font-bold leading-none">MC Industrial</h1>
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mt-1">Controle de Qualidade</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 grow">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => !item.disabled && onNavigate(item.view)}
              disabled={item.disabled}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.view
                ? 'bg-blue-50 text-primary font-bold active-nav'
                : item.disabled
                  ? 'opacity-40 cursor-not-allowed grayscale'
                  : 'text-slate-500 hover:bg-slate-50 font-medium'
                }`}
            >
              <span className="material-symbols-rounded">
                {item.icon}
              </span>
              <p className="text-sm">{item.label}</p>
              {item.disabled && (
                <span className="material-symbols-rounded !text-xs ml-auto opacity-50">lock</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pt-6 border-t border-slate-100">
          <button
            onClick={() => onNavigate(View.SETTINGS)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${currentView === View.SETTINGS
              ? 'bg-blue-50 text-primary font-bold active-nav'
              : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            <span className="material-symbols-rounded">settings</span>
            <p className="text-sm font-medium">Configurações</p>
          </button>
        </div>
      </div>
    </aside>
  );
};
