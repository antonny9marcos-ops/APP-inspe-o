import React from 'react';

interface SectorSwitcherProps {
  sectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
}

export const SectorSwitcher: React.FC<SectorSwitcherProps> = ({ sectors, selectedSector, onSectorChange }) => {
  return (
    <div 
      className="flex items-center gap-1.5 p-1 rounded-2xl backdrop-blur-xl overflow-x-auto whitespace-nowrap max-w-full shrink-0"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <button
        onClick={() => onSectorChange('TODOS')}
        className="px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 shrink-0 cursor-pointer"
        style={{
          background: selectedSector === 'TODOS' 
            ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
            : 'transparent',
          color: selectedSector === 'TODOS' ? '#ffffff' : '#94a3b8',
          boxShadow: selectedSector === 'TODOS' ? '0 4px 12px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
          border: selectedSector === 'TODOS' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent'
        }}
      >
        TODOS
      </button>
      {sectors.map((sector) => {
        const isSelected = selectedSector === sector;
        return (
          <button
            key={sector}
            onClick={() => onSectorChange(sector)}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 shrink-0 cursor-pointer"
            style={{
              background: isSelected 
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                : 'transparent',
              color: isSelected ? '#ffffff' : '#94a3b8',
              boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
              border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent'
            }}
          >
            {sector}
          </button>
        );
      })}
    </div>
  );
};
