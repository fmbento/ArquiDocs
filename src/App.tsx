import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GraduationCap } from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { RequisicoesList } from './components/RequisicoesList.tsx';
import { FormularioNovaRequisicao } from './components/FormularioNovaRequisicao.tsx';
import { ModeloOficialTabela } from './components/ModeloOficialTabela.tsx';
import { GestaoOperadores } from './components/GestaoOperadores.tsx';
import { PainelNotificacoes } from './components/PainelNotificacoes.tsx';
import { EstatisticasDashboard } from './components/EstatisticasDashboard.tsx';
import { ModalLevantamentoDevolucao } from './components/ModalLevantamentoDevolucao.tsx';
import { ModalDetalhesProcesso } from './components/ModalDetalhesProcesso.tsx';
import { EcraLogin } from './components/EcraLogin.tsx';
import { 
  RequisicaoProcesso, 
  Operador, 
  ServicoSolicitante, 
  NotificacaoEmail, 
  ResumoEstatisticas 
} from './types/index.ts';

const OPERADORES_OFICIAIS_INICIAIS: Operador[] = [
  {
    id: 'op-0',
    nome: 'Filipe Bento',
    email: 'fsb@ua.pt',
    cargo: 'Cargo Anónimo',
    numeroFuncionario: '1342F',
    ativo: true,
    criadoEm: '2025-01-01T08:00:00Z'
  },
  {
    id: 'op-1',
    nome: 'Mestre Rui Ferreira',
    email: 'ruifferreira@ua.pt',
    cargo: 'Técnico Superior de Arquivo',
    numeroFuncionario: 'UA-0142',
    ativo: true,
    criadoEm: '2025-02-15T09:00:00Z'
  },
  {
    id: 'op-2',
    nome: 'Luísa Falcão Ribeiro',
    email: 'lfalcao@ua.pt',
    cargo: 'Técnica Superior de Arquivo',
    numeroFuncionario: 'UA-0199',
    ativo: true,
    criadoEm: '2025-03-01T08:30:00Z'
  },
  {
    id: 'op-3',
    nome: 'Gabriela Soares',
    email: 'gabrielasoares@ua.pt',
    cargo: 'Técnica Superior de Arquivo',
    numeroFuncionario: 'UA-1121',
    ativo: true,
    criadoEm: '2025-02-15T09:00:00Z'
  }
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<
    'rastreamento' | 'novo' | 'modelo-pdf' | 'notificacoes' | 'operadores' | 'estatisticas'
  >('rastreamento');

  const [requisicoes, setRequisicoes] = useState<RequisicaoProcesso[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>(OPERADORES_OFICIAIS_INICIAIS);
  const [servicos, setServicos] = useState<ServicoSolicitante[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoEmail[]>([]);
  const [estatisticas, setEstatisticas] = useState<ResumoEstatisticas | null>(null);
  const [operadorAtivo, setOperadorAtivo] = useState<Operador | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Autenticação individual por OTP (sessão persistente)
  const [sessaoAtiva, setSessaoAtiva] = useState<boolean>(false);
  const [sessaoToken, setSessaoToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('arqui_sessao_token');
    } catch {
      return null;
    }
  });
  const [modalAcao, setModalAcao] = useState<{
    aberto: boolean;
    requisicao: RequisicaoProcesso | null;
    tipo: 'levantamento' | 'devolucao' | 'digitalizacao' | 'mudar-status';
  }>({
    aberto: false,
    requisicao: null,
    tipo: 'levantamento'
  });

  const [modalDetalhes, setModalDetalhes] = useState<{
    aberto: boolean;
    requisicao: RequisicaoProcesso | null;
  }>({
    aberto: false,
    requisicao: null
  });

  // Mensagem toast temporária
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'info' | 'erro' } | null>(null);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'info' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Carregar dados iniciais da API
  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resReq, resOp, resSrv, resNotif, resStat] = await Promise.all([
        fetch('/api/requisicoes'),
        fetch('/api/operadores'),
        fetch('/api/servicos'),
        fetch('/api/notificacoes'),
        fetch('/api/estatisticas')
      ]);

      if (resReq.ok) {
        const dados = await resReq.json();
        setRequisicoes(dados);
      }
      if (resOp.ok) {
        const ops: Operador[] = await resOp.json();
        setOperadores(ops);
      }
      if (resSrv.ok) {
        setServicos(await resSrv.json());
      }
      if (resNotif.ok) {
        setNotificacoes(await resNotif.json());
      }
      if (resStat.ok) {
        setEstatisticas(await resStat.json());
      }
    } catch (err) {
      console.error('Erro ao buscar dados do servidor:', err);
      mostrarToast('Aviso: Verifique a ligação com o servidor', 'info');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Verificar sessão OTP guardada localmente
  useEffect(() => {
    const verificarSessao = async () => {
      const token = localStorage.getItem('arqui_sessao_token');
      if (!token) return;

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const dados = await res.json();
          if (dados.autenticado && dados.operador) {
            setOperadorAtivo(dados.operador);
            setSessaoAtiva(true);
            setSessaoToken(token);
          }
        } else {
          localStorage.removeItem('arqui_sessao_token');
          setSessaoAtiva(false);
          setSessaoToken(null);
        }
      } catch (e) {
        console.warn('Erro ao validar sessão existente:', e);
      }
    };

    verificarSessao();
  }, []);

  const handleLoginSucesso = (operador: Operador, token: string) => {
    try {
      localStorage.setItem('arqui_sessao_token', token);
    } catch {}
    setSessaoToken(token);
    setOperadorAtivo(operador);
    setSessaoAtiva(true);
    mostrarToast(`Sessão iniciada como ${operador.nome}!`, 'sucesso');
  };

  const handleLogout = async () => {
    if (sessaoToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessaoToken}` }
        });
      } catch {}
    }
    try {
      localStorage.removeItem('arqui_sessao_token');
    } catch {}
    setSessaoToken(null);
    setSessaoAtiva(false);
    setOperadorAtivo(null);
    setAbaAtiva('rastreamento');
    mostrarToast('Sessão terminada. Acesso à plataforma fechado.', 'info');
  };

  // Handler para atualizar status de uma requisição
  const handleAtualizarStatus = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/requisicoes/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erroJson = await res.json();
        throw new Error(erroJson.erro || 'Falha ao atualizar status');
      }

      const resposta = await res.json();
      const requisicaoAtualizada: RequisicaoProcesso = resposta.requisicao;

      setRequisicoes(prev =>
        prev.map(r => (r.id === id ? requisicaoAtualizada : r))
      );

      // Se havia modal de detalhes aberto para este mesmo processo, atualiza-o
      if (modalDetalhes.requisicao?.id === id) {
        setModalDetalhes({ aberto: true, requisicao: requisicaoAtualizada });
      }

      // Adiciona a nova notificação à lista
      if (resposta.notificacao) {
        setNotificacoes(prev => [resposta.notificacao, ...prev]);
      }

      // Se foi devolução com sucesso, dispara celebração sutil de confetis
      if (payload.novoStatus === 'DEVOLVIDO') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
        mostrarToast(`Processo ${requisicaoAtualizada.referenciaDocumento} devolvido e arquivado com sucesso! Notificação enviada por e-mail.`, 'sucesso');
      } else if (payload.novoStatus === 'LEVANTADO') {
        mostrarToast(`Levantamento de ${requisicaoAtualizada.referenciaDocumento} registado para ${requisicaoAtualizada.nomeQuemLevanta}. E-mail automático enviado!`, 'sucesso');
      } else {
        mostrarToast(`Estado atualizado para ${payload.novoStatus}. Notificação enviada para o requerente.`, 'sucesso');
      }

      // Recarrega estatísticas em segundo plano
      fetch('/api/estatisticas')
        .then(r => r.json())
        .then(setEstatisticas)
        .catch(console.error);
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      mostrarToast(err.message || 'Erro ao atualizar pedido', 'erro');
      throw err;
    }
  };

  // Handler para criação de nova requisição
  const handleRequisicaoCriada = (nova: RequisicaoProcesso) => {
    setRequisicoes(prev => [nova, ...prev]);
    setAbaAtiva('rastreamento');
    mostrarToast(`Requisição ${nova.numeroRequisicao} (${nova.referenciaDocumento}) registada com sucesso! Notificação enviada.`, 'sucesso');

    // Recarrega estatísticas e notificações
    fetch('/api/estatisticas').then(r => r.json()).then(setEstatisticas).catch(console.error);
    fetch('/api/notificacoes').then(r => r.json()).then(setNotificacoes).catch(console.error);
  };

  // Handlers para gestão de operadores
  const handleAdicionarOperador = async (opData: Omit<Operador, 'id' | 'criadoEm'>) => {
    const res = await fetch('/api/operadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opData)
    });
    if (!res.ok) throw new Error('Falha ao adicionar operador');
    const novoOp = await res.json();
    setOperadores(prev => [...prev, novoOp]);
    mostrarToast(`Operador ${novoOp.nome} registado com sucesso!`, 'sucesso');
  };

  const handleAlternarAtivoOperador = async (op: Operador) => {
    const atualizado = { ...op, ativo: !op.ativo };
    const res = await fetch('/api/operadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atualizado)
    });
    if (res.ok) {
      setOperadores(prev => prev.map(o => (o.id === op.id ? atualizado : o)));
      mostrarToast(`Estado do operador ${op.nome} alterado.`, 'info');
    }
  };

  const handleApagarOperador = async (id: string) => {
    const op = operadores.find(o => o.id === id);
    if (!confirm(`Tem a certeza que deseja remover o operador ${op?.nome}?`)) return;

    const res = await fetch(`/api/operadores/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setOperadores(prev => prev.filter(o => o.id !== id));
      if (operadorAtivo?.id === id) {
        const restantes = operadores.filter(o => o.id !== id && o.ativo);
        setOperadorAtivo(restantes[0] || null);
      }
      mostrarToast('Operador removido.', 'info');
    }
  };

  // Contadores rápidos para o header
  const totalPendentes = requisicoes.filter(
    r => r.status === 'PENDENTE' || r.status === 'LOCALIZADO' || r.status === 'PRONTO_LEVANTAMENTO'
  ).length;

  const totalAtivos = requisicoes.filter(r => r.status === 'LEVANTADO').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Navbar Superior */}
      <Navbar
        abaAtiva={abaAtiva}
        onMudarAba={setAbaAtiva}
        operadorAtivo={operadorAtivo}
        totalPendentes={totalPendentes}
        totalAtivos={totalAtivos}
        sessaoAtiva={sessaoAtiva}
        onLogout={handleLogout}
      />

      {/* Toast Alert Flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              toast.tipo === 'sucesso'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.tipo === 'erro'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-indigo-900 text-indigo-100 border-indigo-700'
            }`}
          >
            <span>{toast.mensagem}</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal: Bloqueado sem autenticação individual */}
      <main className="flex-1 pb-16">
        {!sessaoAtiva || !operadorAtivo ? (
          <EcraLogin
            operadoresDisponiveis={operadores}
            onLoginSucesso={handleLoginSucesso}
          />
        ) : (
          <>
            {abaAtiva === 'rastreamento' && (
              <RequisicoesList
                requisicoes={requisicoes}
                servicos={servicos}
                onNovaRequisicao={() => setAbaAtiva('novo')}
                onSelecionarRequisicao={(r) => setModalDetalhes({ aberto: true, requisicao: r })}
                onAbrirAcao={(r, tipo) => setModalAcao({ aberto: true, requisicao: r, tipo })}
                onRecarregar={carregarDados}
                carregando={carregando}
              />
            )}

            {abaAtiva === 'novo' && (
              <FormularioNovaRequisicao
                servicos={servicos}
                operadorAtivo={operadorAtivo}
                onRequisicaoCriada={handleRequisicaoCriada}
                onCancelar={() => setAbaAtiva('rastreamento')}
              />
            )}

            {abaAtiva === 'modelo-pdf' && (
              <ModeloOficialTabela
                requisicoes={requisicoes}
                onSelecionarRequisicao={(r) => setModalDetalhes({ aberto: true, requisicao: r })}
                onNovoRegisto={() => setAbaAtiva('novo')}
              />
            )}

            {abaAtiva === 'notificacoes' && (
              <PainelNotificacoes notificacoes={notificacoes} />
            )}

            {abaAtiva === 'operadores' && (
              <GestaoOperadores
                operadores={operadores}
                operadorAtivo={operadorAtivo}
                onAdicionarOperador={handleAdicionarOperador}
                onAlternarAtivo={handleAlternarAtivoOperador}
                onApagarOperador={handleApagarOperador}
              />
            )}

            {abaAtiva === 'estatisticas' && (
              <EstatisticasDashboard
                requisicoes={requisicoes}
                servicos={servicos}
                estatisticas={estatisticas}
                onExportarCSV={() => {
                  window.location.href = '/api/export/csv';
                }}
                onFiltrarServico={() => {
                  setAbaAtiva('rastreamento');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Rodapé Institucional da Universidade de Aveiro */}
      <footer className="bg-[#24282a] text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[#92d400] border border-slate-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Universidade de Aveiro</p>
              <p className="text-[11px] text-slate-400">Serviços de Biblioteca, Informação Documental e Museologia • Arquivo Central</p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 space-y-0.5">
            <p>Campus Universitário de Santiago, 3810-193 Aveiro • Portugal</p>
            <p>
              Atendimento: <a href="mailto:arquivo@ua.pt" className="text-slate-200 hover:text-white underline">arquivo@ua.pt</a> • Tel: +351 234 370 200
            </p>
          </div>
        </div>
      </footer>

      {/* Modais Globais (Apenas ativos para operador autenticado) */}
      {sessaoAtiva && (
        <>
          <ModalLevantamentoDevolucao
            isOpen={modalAcao.aberto}
            requisicao={modalAcao.requisicao}
            operadorAtivo={operadorAtivo}
            acaoTipo={modalAcao.tipo}
            onClose={() => setModalAcao({ aberto: false, requisicao: null, tipo: 'levantamento' })}
            onAtualizarStatus={handleAtualizarStatus}
          />

          <ModalDetalhesProcesso
            isOpen={modalDetalhes.aberto}
            requisicao={modalDetalhes.requisicao}
            onClose={() => setModalDetalhes({ aberto: false, requisicao: null })}
            onAbrirAcao={(r, tipo) => {
              setModalDetalhes({ aberto: false, requisicao: null });
              setModalAcao({ aberto: true, requisicao: r, tipo });
            }}
          />
        </>
      )}
    </div>
  );
}
