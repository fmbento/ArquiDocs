import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  BadgeCheck, 
  Check, 
  X, 
  Trash2, 
  UserCog, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Operador } from '../types/index.ts';

interface GestaoOperadoresProps {
  operadores: Operador[];
  operadorAtivo: Operador | null;
  onAdicionarOperador: (op: Omit<Operador, 'id' | 'criadoEm'>) => Promise<void>;
  onAlternarAtivo: (op: Operador) => Promise<void>;
  onApagarOperador: (id: string) => Promise<void>;
}

export const GestaoOperadores: React.FC<GestaoOperadoresProps> = ({
  operadores,
  operadorAtivo,
  onAdicionarOperador,
  onAlternarAtivo,
  onApagarOperador
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [cargo, setCargo] = useState<string>('Técnico Superior de Arquivo');
  const [numeroFuncionario, setNumeroFuncionario] = useState<string>('');
  const [erro, setErro] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || !email.trim()) {
      setErro('O nome e o e-mail do operador são obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      await onAdicionarOperador({
        nome: nome.trim(),
        email: email.trim(),
        cargo: cargo.trim(),
        numeroFuncionario: numeroFuncionario.trim() || `ARQ-${Math.floor(1000 + Math.random() * 9000)}`,
        ativo: true
      });

      setNome('');
      setEmail('');
      setNumeroFuncionario('');
      setMostrarFormulario(false);
    } catch (err: any) {
      setErro(err.message || 'Erro ao adicionar operador');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded bg-white shrink-0">
            <img
              src="/assets/aistudio/image_a3790441.png"
              alt="Universidade de Aveiro"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#24282a] dark:text-white">
                Equipa de Operadores do Arquivo Central
              </h2>
              <span className="text-[11px] font-bold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 dark:bg-[#92d400]/25 px-2 py-0.5 rounded border border-[#92d400]/50">
                SBIDM • UAveiro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Controlo de técnicos com acesso ao balcão de atendimento, registo de levantamentos e devoluções.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-2 px-4 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>{mostrarFormulario ? 'Fechar Formulário' : 'Novo Operador'}</span>
        </button>
      </div>

      {/* Formulário de Novo Operador */}
      {mostrarFormulario && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-[#92d400]/50 shadow-md">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#284000]" />
            <span>Registar Novo Operador / Arquivista</span>
          </h3>

          {erro && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo <span className="text-[#3b5e00] font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Ana Sofia Martins"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Institucional <span className="text-[#3b5e00] font-bold">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operador@ua.pt"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Ex: Técnico Superior de Arquivo"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nº de Funcionário / Mecanográfico
              </label>
              <input
                type="text"
                value={numeroFuncionario}
                onChange={e => setNumeroFuncionario(e.target.value)}
                placeholder="Ex: ARQ-0220"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold transition"
              >
                {salvando ? 'A Gravar...' : 'Guardar Operador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cartões dos Operadores Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {operadores.map(op => {
          const isAtivoAtual = operadorAtivo?.id === op.id;

          return (
            <div
              key={op.id}
              className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                isAtivoAtual
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {op.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{op.nome}</h4>
                      {isAtivoAtual && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Em Turno</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{op.cargo}</p>
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {op.numeroFuncionario}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onAlternarAtivo(op)}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition ${
                    op.ativo
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                  title="Clique para alternar estado ativo/inativo"
                >
                  {op.ativo ? 'ATIVO' : 'INATIVO'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{op.email}</span>
                </span>

                <div className="flex items-center gap-2">
                  {isAtivoAtual && (
                    <span className="text-[11px] font-semibold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 px-2 py-0.5 rounded">
                      Sessão Atual
                    </span>
                  )}

                  {operadores.length > 1 && (
                    <button
                      onClick={() => onApagarOperador(op.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Eliminar operador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
