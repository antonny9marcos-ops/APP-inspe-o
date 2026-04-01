import React from 'react';

interface SectorSwitcherProps {
  sectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
}

export const SectorSwitcher: React.FC<SectorSwitcherProps> = ({ sectors, selectedSector, onSectorChange }) => {
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
      <button
        onClick={() => onSectorChange('TODOS')}
        className={`
          px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
          ${selectedSector === 'TODOS' 
            ? 'bg-white text-primary shadow-md scale-105 ring-1 ring-slate-200' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
          }
        `}
      >
        TODOS
      </button>
      {sectors.map((sector) => (
        <button
          key={sector}
          onClick={() => onSectorChange(sector)}
          className={`
            px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
            ${selectedSector === sector 
              ? 'bg-white text-primary shadow-md scale-105 ring-1 ring-slate-200' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
            }
          `}
        >
          {sector}
        </button>
      ))}
    </div>
  );
};
