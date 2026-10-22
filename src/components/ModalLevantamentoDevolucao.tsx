import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  User, 
  Clock, 
  Printer, 
  Search, 
  Eye, 
  AlertTriangle,
  Send,
  FileCheck
} from 'lucide-react';
import { RequisicaoProcesso, StatusPedido, Operador, TipoAtendimento } from '../types/index.ts';
import { getDataHojeISO, getHoraAtual, formatarStatus, validarLevantamento } from '../utils/requisicoes.ts';

interface ModalProps {
  requisicao: RequisicaoProcesso | null;
  operadorAtivo: Operador | null;
  acaoTipo: 'levantamento' | 'devolucao' | 'digitalizacao' | 'mudar-status';
  isOpen: boolean;
  onClose: () => void;
  onAtualizarStatus: (id: string, payload: any) => Promise<void>;
}

export const ModalLevantamentoDevolucao: React.FC<ModalProps> = ({
  requisicao,
  operadorAtivo,
  acaoTipo,
  isOpen,
  onClose,
  onAtualizarStatus
}) => {
  if (!isOpen || !requisicao) return null;

  const hoje = getDataHojeISO();
  const hora = getHoraAtual();

  // Estados dos formulários de ação
  const [novoStatus, setNovoStatus] = useState<StatusPedido>(
    acaoTipo === 'levantamento'
      ? 'LEVANTADO'
      : acaoTipo === 'devolucao'
      ? 'DEVOLVIDO'
      : acaoTipo === 'digitalizacao'
      ? 'DIGITALIZADO'
      : 'LOCALIZADO'
  );

  const [nomeQuemLevanta, setNomeQuemLevanta] = useState<string>(requisicao.nomeQuemLevanta || requisicao.nomeQuemSolicita || '');
  const [nomeQuemSolicita, setNomeQuemSolicita] = useState<string>(requisicao.nomeQuemSolicita || '');
  const [documentacaoDenominacao, setDocumentacaoDenominacao] = useState<string>(requisicao.documentacaoDenominacao || '');
  const [dataLevantamento, setDataLevantamento] = useState<string>(requisicao.dataLevantamento || hoje);

  const [dataDevolucao, setDataDevolucao] = useState<string>(requisicao.dataDevolucao || hoje);
  const [nomeQuemDevolveu, setNomeQuemDevolveu] = useState<string>(requisicao.nomeQuemDevolveu || requisicao.nomeQuemLevanta || requisicao.nomeQuemSolicita || '');

  const [dataConsulta, setDataConsulta] = useState<string>(requisicao.dataConsulta || hoje);
  const [dataPesquisa, setDataPesquisa] = useState<string>(requisicao.dataPesquisa || hoje);
  const [numeroDigitalizacoes, setNumeroDigitalizacoes] = useState<number | ''>(
    requisicao.numeroDigitalizacoes !== undefined ? requisicao.numeroDigitalizacoes : ''
  );
  const [atendimentoFase, setAtendimentoFase] = useState<TipoAtendimento>(requisicao.atendimentoFase || '1a_fase');

  const [observacoes, setObservacoes] = useState<string>('');
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState<boolean>(false);

  useEffect(() => {
    if (acaoTipo === 'levantamento') {
      setNovoStatus('LEVANTADO');
      setDataLevantamento(requisicao.dataLevantamento || hoje);
      setNomeQuemLevanta(requisicao.nomeQuemLevanta || requisicao.nomeQuemSolicita || '');
    } else if (acaoTipo === 'devolucao') {
      setNovoStatus('DEVOLVIDO');
      setDataDevolucao(requisicao.dataDevolucao || hoje);
      setNomeQuemDevolveu(requisicao.nomeQuemDevolveu || requisicao.nomeQuemLevanta || requisicao.nomeQuemSolicita || '');
    } else if (acaoTipo === 'digitalizacao') {
      setNovoStatus('DIGITALIZADO');
    }
  }, [acaoTipo, requisicao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);

    if (novoStatus === 'LEVANTADO') {
      const v = validarLevantamento({
        nomeQuemLevanta,
        nomeQuemSolicita,
        documentacaoDenominacao,
        dataLevantamento
      });
      if (!v.valido) {
        setErros(v.erros);
        return;
      }
    }

    if (novoStatus === 'DEVOLVIDO' && !nomeQuemDevolveu.trim()) {
      setErros(['O nome de quem procedeu à devolução do documento é obrigatório.']);
      return;
    }

    try {
      setSalvando(true);
      await onAtualizarStatus(requisicao.id, {
        novoStatus,
        operadorNome: operadorAtivo?.nome || 'Operador Responsável',
        operadorId: operadorAtivo?.id || 'op-1',
        observacoes,
        nomeQuemLevanta: novoStatus === 'LEVANTADO' ? nomeQuemLevanta : requisicao.nomeQuemLevanta,
        dataLevantamento: novoStatus === 'LEVANTADO' ? dataLevantamento : requisicao.dataLevantamento,
        nomeQuemDevolveu: novoStatus === 'DEVOLVIDO' ? nomeQuemDevolveu : requisicao.nomeQuemDevolveu,
        dataDevolucao: novoStatus === 'DEVOLVIDO' ? dataDevolucao : requisicao.dataDevolucao,
        dataConsulta: dataConsulta || undefined,
        dataPesquisa: dataPesquisa || undefined,
        numeroDigitalizacoes: numeroDigitalizacoes !== '' ? Number(numeroDigitalizacoes) : undefined,
        atendimentoFase
      });
      onClose();
    } catch (err: any) {
      setErros([err.message || 'Erro ao gravar atualização no arquivo']);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-8">
        {/* Top Header com Estilo da Universidade de Aveiro */}
        <div className="bg-[#24282a] border-b-2 border-[#92d400] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-800 rounded-lg shrink-0 border border-slate-700">
              <FileCheck className="w-5 h-5 text-[#92d400]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {acaoTipo === 'levantamento' && 'Registar Levantamento de Processo (UA)'}
                {acaoTipo === 'devolucao' && 'Registar Devolução ao Arquivo (UA)'}
                {acaoTipo === 'digitalizacao' && 'Registar Digitalizações & Conclusão (UA)'}
                {acaoTipo === 'mudar-status' && 'Atualizar Estado do Processo (UA)'}
              </h3>
              <p className="text-xs text-slate-300">
                {requisicao.referenciaDocumento} • {requisicao.servicoNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Processo */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Denominação:</strong> {requisicao.documentacaoDenominacao}</div>
            <div><strong>Quem solicita:</strong> {requisicao.nomeQuemSolicita}</div>
            <div><strong>Estado Atual:</strong> <span className="font-semibold text-emerald-700">{formatarStatus(requisicao.status).label}</span></div>
            <div><strong>Notificação enviará para:</strong> <span className="font-mono">{requisicao.emailSolicitante || 'Serviço'}</span></div>
          </div>
        </div>

        {/* Erros */}
        {erros.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs">
            {erros.map((e, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{e}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Seletor de Status (quando em modo mudar-status) */}
          {acaoTipo === 'mudar-status' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Novo Status do Pedido
              </label>
              <select
                aria-label="Novo Status do Pedido"
                value={novoStatus}
                onChange={e => setNovoStatus(e.target.value as StatusPedido)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
              >
                <option value="CONCLUIDO">Concluído (Procedimento terminado • Dispensa devolução)</option>
                <option value="PENDENTE">Pendente (Aguardando localização)</option>
                <option value="LOCALIZADO">Localizado (Encontrado no arquivo)</option>
                <option value="PRONTO_LEVANTAMENTO">Pronto para Levantamento (Disponível no balcão)</option>
                <option value="LEVANTADO">Levantado (Empréstimo ativo)</option>
                <option value="EM_CONSULTA">Em Consulta (Sala de Leitura)</option>
                <option value="EM_PESQUISA">Em Pesquisa Arquivística</option>
                <option value="DIGITALIZADO">Digitalizado (Processo concluído digitalmente)</option>
                <option value="DEVOLVIDO">Devolvido ao Arquivo</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          )}

          {/* DADOS DE LEVANTAMENTO EXIGIDOS NO PROMPT */}
          {(acaoTipo === 'levantamento' || novoStatus === 'LEVANTADO') && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4" />
                <span>Campos Obrigatórios no Momento do Levantamento:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Quem Levanta <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeQuemLevanta}
                    onChange={e => setNomeQuemLevanta(e.target.value)}
                    placeholder="Funcionário que levanta fisicamente"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Campo "Quem levanta" do PDF</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Quem Solicita <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeQuemSolicita}
                    onChange={e => setNomeQuemSolicita(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Campo "Quem solicita" do PDF</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Denominação da Documentação / Processo <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentacaoDenominacao}
                    onChange={e => setDocumentacaoDenominacao(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Levantamento <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataLevantamento}
                    onChange={e => setDataLevantamento(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Dia atual por defeito</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Atendimento (Modelo Oficial)
                  </label>
                  <select
                    aria-label="Atendimento (Modelo Oficial)"
                    value={atendimentoFase}
                    onChange={e => setAtendimentoFase(e.target.value as TipoAtendimento)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  >
                    <option value="1a_fase">1ª fase</option>
                    <option value="2a_fase">2ª fase</option>
                    <option value="ambas">Ambas as fases</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DADOS DE DEVOLUÇÃO DO MODELO */}
          {(acaoTipo === 'devolucao' || novoStatus === 'DEVOLVIDO') && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dados de Devolução (Conforme colunas 'Devolução Data' e 'Nome'):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Devolução <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataDevolucao}
                    onChange={e => setDataDevolucao(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Dia atual pré-selecionado</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome de Quem Devolveu <span className="text-[#3b5e00] dark:text-[#92d400] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeQuemDevolveu}
                    onChange={e => setNomeQuemDevolveu(e.target.value)}
                    placeholder="Funcionário que entrega de volta"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Coluna 'Devolução Nome'</span>
                </div>
              </div>
            </div>
          )}

          {/* DADOS DE DIGITALIZAÇÃO / CONSULTA / PESQUISA */}
          {(acaoTipo === 'digitalizacao' || novoStatus === 'DIGITALIZADO' || novoStatus === 'EM_CONSULTA' || novoStatus === 'EM_PESQUISA') && (
            <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/40 space-y-3">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Atividades de Arquivo (Consulta, Pesquisa e Digitalização):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nº de Digitalizações
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={numeroDigitalizacoes}
                    onChange={e => setNumeroDigitalizacoes(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 32"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Páginas digitalizadas</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    value={dataConsulta}
                    onChange={e => setDataConsulta(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Pesquisa
                  </label>
                  <input
                    type="date"
                    value={dataPesquisa}
                    onChange={e => setDataPesquisa(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OBSERVAÇÕES E NOTAS DO OPERADOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Justificação da Ação
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Documento conferido com todas as peças; comunicado ao requerente por e-mail..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                Uma <strong>notificação automática por e-mail</strong> será gerada e enviada imediatamente.
              </span>
            </div>
          </div>

          {/* BOTÕES */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2 bg-[#92d400] hover:bg-[#82be00] text-slate-950 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {salvando ? (
                <span>A Gravar...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>Confirmar & Notificar Requerente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
