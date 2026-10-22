import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Eye, 
  FileText, 
  Search, 
  Building2, 
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { NotificacaoEmail } from '../types/index.ts';
import { formatarStatus } from '../utils/requisicoes.ts';

interface PainelNotificacoesProps {
  notificacoes: NotificacaoEmail[];
}

export const PainelNotificacoes: React.FC<PainelNotificacoesProps> = ({ notificacoes }) => {
  const [busca, setBusca] = useState<string>('');
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<NotificacaoEmail | null>(null);

  const filtradas = notificacoes.filter(n => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      n.assunto.toLowerCase().includes(q) ||
      n.destinatarioEmail.toLowerCase().includes(q) ||
      n.destinatarioNome.toLowerCase().includes(q) ||
      n.referenciaDocumento.toLowerCase().includes(q) ||
      n.servicoNome.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
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
                Notificações Automáticas por E-mail
              </h2>
              <span className="text-[11px] font-bold text-[#284000] dark:text-[#cbf561] bg-[#92d400]/20 dark:bg-[#92d400]/25 px-2 py-0.5 rounded border border-[#92d400]/50">
                Arquivo Central UA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Auditoria de alertas automáticos enviados para os utilizadores da Universidade de Aveiro.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#92d400]/20 dark:bg-[#92d400]/25 text-[#284000] dark:text-[#cbf561] border border-[#92d400]/50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#284000] dark:text-[#92d400]" />
          <span>Servidor de E-mail Institucional Ativo</span>
        </div>
      </div>

      {/* Caixa de Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar por assunto, referência, e-mail do requerente ou serviço..."
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400]"
        />
      </div>

      {/* Tabela de Notificações */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Destinatário & Serviço</th>
                <th className="py-3 px-4">Referência / Cota</th>
                <th className="py-3 px-4">Status Comunicado</th>
                <th className="py-3 px-4">Assunto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Ver E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma notificação automática registada.
                  </td>
                </tr>
              ) : (
                filtradas.map(n => {
                  const statusInfo = formatarStatus(n.statusReferente);
                  const dataFormatada = new Date(n.enviadoEm).toLocaleString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={n.id}
                      onClick={() => setNotificacaoSelecionada(n)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {dataFormatada}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {n.destinatarioNome}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{n.destinatarioEmail}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {n.referenciaDocumento}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.cor} ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {n.assunto}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enviado</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotificacaoSelecionada(n);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pré-visualizar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pré-visualização do E-mail */}
      {notificacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">
                  Pré-visualização da Notificação Enviada
                </h3>
              </div>
              <button
                onClick={() => setNotificacaoSelecionada(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div><strong>De:</strong> Arquivo Central UA (SBIDM) &lt;arquivo@ua.pt&gt;</div>
              <div><strong>Para:</strong> {notificacaoSelecionada.destinatarioNome} &lt;{notificacaoSelecionada.destinatarioEmail}&gt;</div>
              <div><strong>Assunto:</strong> {notificacaoSelecionada.assunto}</div>
              <div><strong>Data de Envio:</strong> {new Date(notificacaoSelecionada.enviadoEm).toLocaleString('pt-PT')}</div>
            </div>

            {/* Email Body rendered */}
            <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
              <div 
                className="bg-white rounded-lg shadow-xs overflow-hidden"
                dangerouslySetInnerHTML={{ __html: notificacaoSelecionada.mensagemHtml }}
              />
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setNotificacaoSelecionada(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
