import React from 'react';
import { 
  FileText, 
  PlusCircle, 
  LayoutList, 
  Users, 
  Mail, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  MapPin,
  GraduationCap,
  KeyRound,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Operador } from '../types/index.ts';
import { ThemeToggle } from './ThemeToggle.tsx';

interface NavbarProps {
  abaAtiva: 'rastreamento' | 'novo' | 'modelo-pdf' | 'notificacoes' | 'operadores' | 'estatisticas';
  onMudarAba: (aba: 'rastreamento' | 'novo' | 'modelo-pdf' | 'notificacoes' | 'operadores' | 'estatisticas') => void;
  operadorAtivo: Operador | null;
  totalPendentes: number;
  totalAtivos: number;
  sessaoAtiva: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  abaAtiva,
  onMudarAba,
  operadorAtivo,
  totalPendentes,
  totalAtivos,
  sessaoAtiva,
  onLogout
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-30 transition-colors">
      {/* 1. Barra Institucional Superior da Universidade de Aveiro */}
      <div className="bg-[#24282a] text-slate-300 text-[11px] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3 h-3 text-[#92d400]" />
              <span className="hidden sm:inline">Campus Universitário de Santiago, 3810-193 Aveiro</span>
              <span className="sm:hidden">UAveiro • Santiago</span>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline text-slate-400">
              Serviços de Biblioteca, Informação Documental e Museologia (SBIDM)
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://www.ua.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition flex items-center gap-1"
            >
              <span>Portal ua.pt</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </a>
            <span className="text-slate-600">|</span>
            <span className="text-white font-medium">Arquivo Central</span>
          </div>
        </div>
      </div>

      {/* 2. Header Principal com o Logótipo Oficial da UA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-2 sm:py-0">
          {/* Logo e Identidade da Universidade de Aveiro */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-1 rounded bg-white shrink-0">
              <img
                src="/assets/aistudio/image_a3790441.png"
                alt="Universidade de Aveiro"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-[#24282a] dark:text-white font-sans whitespace-nowrap">
                  Universidade de Aveiro
                </span>
                <span className="text-slate-300 dark:text-slate-600 font-light hidden sm:inline">|</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 dark:bg-[#92d400]/25 px-1.5 sm:px-2 py-0.5 rounded border border-[#92d400]/50 hidden sm:inline">
                  Arquivo
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Registo e Rastreamento de Processos
              </p>
            </div>
          </div>

          {/* Indicadores Rápidos, Seletor de Tema e Operador de Atendimento */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Indicadores Rápidos (Apenas para sessão ativa) */}
            {sessaoAtiva && (
              <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <strong>{totalPendentes}</strong> pedidos pendentes
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="flex items-center gap-1.5 text-[#284000] dark:text-[#cbf561]">
                  <span className="w-2 h-2 rounded-full bg-[#92d400]"></span>
                  <strong>{totalAtivos}</strong> empréstimos ativos
                </span>
              </div>
            )}

            {/* Alternador de Tema Claro / Escuro */}
            <ThemeToggle />

            {/* Perfil do Operador Autenticado com Encerramento de Sessão */}
            {sessaoAtiva && operadorAtivo ? (
              <div className="relative group">
                <div className="flex items-center gap-2 bg-[#92d400]/15 dark:bg-[#92d400]/20 hover:bg-[#92d400]/25 transition px-2 sm:px-3 py-1.5 rounded-lg border border-[#92d400]/50 cursor-pointer">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold shadow-xs shrink-0">
                      {operadorAtivo.nome.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                  </div>
                  <div className="text-left text-xs hidden sm:block">
                    <div className="text-[#284000] dark:text-[#cbf561] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <span>Sessão Ativa</span>
                    </div>
                    <div className="font-bold text-[#24282a] dark:text-slate-100 truncate max-w-[130px] sm:max-w-[170px]">
                      {operadorAtivo.nome}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>

                {/* Dropdown da Sessão Autenticada */}
                <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#3b5e00] dark:text-[#cbf561]">
                      Operador em Turno
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {operadorAtivo.nome}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {operadorAtivo.email}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                        {operadorAtivo.numeroFuncionario}
                      </span>
                      <span>• {operadorAtivo.cargo}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => onMudarAba('operadores')}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Gerir Equipa de Operadores</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 px-1">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Terminar Sessão</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3b5e00] dark:text-[#92d400]" />
                <span>Área Reservada</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Barra de Navegação no Estilo da Universidade de Aveiro */}
        {sessaoAtiva && (
          <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => onMudarAba('rastreamento')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'rastreamento'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Rastreamento de Processos</span>
          </button>

          <button
            onClick={() => onMudarAba('novo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'novo'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Requisição</span>
          </button>

          <button
            onClick={() => onMudarAba('modelo-pdf')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'modelo-pdf'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Modelo Oficial (PDF)</span>
          </button>

          <button
            onClick={() => onMudarAba('notificacoes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'notificacoes'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Notificações por E-mail</span>
          </button>

          <button
            onClick={() => onMudarAba('operadores')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'operadores'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Operadores SBIDM</span>
          </button>

          <button
            onClick={() => onMudarAba('estatisticas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold transition whitespace-nowrap ${
              abaAtiva === 'estatisticas'
                ? 'bg-[#92d400] text-slate-950 font-bold shadow-xs hover:bg-[#82be00]'
                : 'text-slate-600 dark:text-slate-300 hover:text-[#24282a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Painel Administrativo</span>
          </button>
        </nav>
        )}
      </div>
    </header>
  );
};

