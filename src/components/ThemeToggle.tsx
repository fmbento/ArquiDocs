import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownAberto, setDropdownAberto] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const opcoes: { id: Theme; label: string; icon: React.ReactNode; descricao: string }[] = [
    {
      id: 'light',
      label: 'Claro',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      descricao: 'Interface clara'
    },
    {
      id: 'dark',
      label: 'Escuro',
      icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
      descricao: 'Interface escura'
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: <Monitor className="w-3.5 h-3.5 text-slate-400" />,
      descricao: 'Segue o sistema operativo'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 shadow-xs">
        {/* Botão de Alternância Rápida 1-Clique */}
        <button
          type="button"
          onClick={toggleTheme}
          title={
            resolvedTheme === 'dark'
              ? 'Mudar para Modo Claro (Sun)'
              : 'Mudar para Modo Escuro (Moon)'
          }
          aria-label="Alternar tema claro / escuro"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-[#92d400] transition-transform duration-200 hover:scale-110" />
              {!compact && <span className="hidden sm:inline">Escuro</span>}
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 hover:scale-110" />
              {!compact && <span className="hidden sm:inline">Claro</span>}
            </>
          )}
        </button>

        {/* Botão para abrir o menu com opção Sistema */}
        <button
          type="button"
          onClick={() => setDropdownAberto(!dropdownAberto)}
          title="Opções de tema (Claro / Escuro / Sistema)"
          aria-label="Opções de tema"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${dropdownAberto ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu dropdown com opções */}
      {dropdownAberto && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in-50 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Aparência da Interface
          </div>
          {opcoes.map(opcao => {
            const estaAtivo = theme === opcao.id;
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  setTheme(opcao.id);
                  setDropdownAberto(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                  estaAtivo
                    ? 'font-bold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/15 dark:bg-[#92d400]/20'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opcao.icon}
                  <span>{opcao.label}</span>
                </div>
                {estaAtivo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#92d400]"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
