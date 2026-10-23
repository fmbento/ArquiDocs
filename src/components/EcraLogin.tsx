import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Operador, SmtpStatus } from '../types/index.ts';

interface EcraLoginProps {
  operadoresDisponiveis: Operador[];
  onLoginSucesso: (operador: Operador, token: string) => void;
}

export const EcraLogin: React.FC<EcraLoginProps> = ({
  operadoresDisponiveis,
  onLoginSucesso
}) => {
  const listaOperadores = operadoresDisponiveis.length > 0 ? operadoresDisponiveis : [
    { id: 'op-0', nome: 'Filipe Bento', email: 'fsb@ua.pt', cargo: 'Cargo Anónimo', numeroFuncionario: '1342F', ativo: true, criadoEm: '2025-01-01' },
    { id: 'op-1', nome: 'Mestre Rui Ferreira', email: 'ruifferreira@ua.pt', cargo: 'Técnico Superior de Arquivo', numeroFuncionario: 'UA-0142', ativo: true, criadoEm: '2025-02-15' },
    { id: 'op-2', nome: 'Luísa Falcão Ribeiro', email: 'lfalcao@ua.pt', cargo: 'Técnica Superior de Arquivo', numeroFuncionario: 'UA-0199', ativo: true, criadoEm: '2025-03-01' },
    { id: 'op-3', nome: 'Gabriela Soares', email: 'gabrielasoares@ua.pt', cargo: 'Técnica Superior de Arquivo', numeroFuncionario: 'UA-1121', ativo: true, criadoEm: '2025-02-15' }
  ];

  const [passo, setPasso] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState<string>('');
  const [codigoOtp, setCodigoOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [nomeOperador, setNomeOperador] = useState<string>('');
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<{ provedor: string; tursoAtivo: boolean; tursoUrlMascarado?: string | null } | null>(null);
  const [tempoRestante, setTempoRestante] = useState<number>(600); // 10 minutos (600s)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setSmtpStatus(data))
      .catch(() => {});

    fetch('/api/db/status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let intervalo: any = null;
    if (passo === 'codigo' && tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [passo, tempoRestante]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSolicitarOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErro('Por favor, indique um endereço de e-mail institucional.');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      setMensagemSucesso(null);

      const res = await fetch('/api/auth/solicitar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const dados = await res.json();

      if (!res.ok) {
        throw new Error(dados.erro || 'Falha ao solicitar código de acesso');
      }

      setNomeOperador(dados.nomeOperador || 'Operador');
      setDevCode(dados.devCode || null);
      setMensagemSucesso(dados.mensagem);
      setPasso('codigo');
      setCodigoOtp(['', '', '', '', '', '']);
      setTempoRestante(600);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao solicitar código.');
    } finally {
      setCarregando(false);
    }
  };

  const handleDigitoChange = (index: number, valor: string) => {
    const limpo = valor.replace(/\D/g, '');
    const novoCodigo = [...codigoOtp];

    if (limpo.length > 1) {
      const digitosColados = limpo.slice(0, 6).split('');
      digitosColados.forEach((d, i) => {
        if (i < 6) novoCodigo[i] = d;
      });
      setCodigoOtp(novoCodigo);
      const proximoVazio = novoCodigo.findIndex(d => d === '');
      if (proximoVazio !== -1) {
        inputRefs.current[proximoVazio]?.focus();
      } else {
        inputRefs.current[5]?.focus();
        submeterCodigo(novoCodigo.join(''));
      }
      return;
    }

    novoCodigo[index] = limpo;
    setCodigoOtp(novoCodigo);

    if (limpo && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (novoCodigo.every(d => d !== '') && limpo) {
      submeterCodigo(novoCodigo.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codigoOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const textoColado = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (textoColado) {
      const digitos = textoColado.slice(0, 6).split('');
      const novo = ['', '', '', '', '', ''];
      digitos.forEach((d, i) => {
        if (i < 6) novo[i] = d;
      });
      setCodigoOtp(novo);
      if (digitos.length === 6) {
        submeterCodigo(novo.join(''));
      } else {
        inputRefs.current[Math.min(digitos.length, 5)]?.focus();
      }
    }
  };

  const submeterCodigo = async (codigoCompleto: string) => {
    if (codigoCompleto.length !== 6) {
      setErro('Por favor, introduza os 6 dígitos do código de acesso.');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const res = await fetch('/api/auth/verificar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          codigo: codigoCompleto
        })
      });

      const dados = await res.json();

      if (!res.ok) {
        throw new Error(dados.erro || 'Código inválido ou expirado');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onLoginSucesso(dados.operador, dados.token);
    } catch (err: any) {
      setErro(err.message || 'Código de verificação incorreto.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
        {/* Cabeçalho Institucional Oficial */}
        <div className="bg-[#24282a] border-b-4 border-[#92d400] px-6 sm:px-8 py-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white shrink-0 shadow-xs">
              <img
                src="/assets/aistudio/image_a3790441.png"
                alt="Universidade de Aveiro"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#92d400]">
                Universidade de Aveiro • SBIDM
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Arquivo Central
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Área Reservada a Técnicos e Operadores do Arquivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-[#92d400]">
            <Lock className="w-4 h-4" />
            <span className="font-semibold text-white">Acesso Restrito</span>
          </div>
        </div>

        {/* Mensagem de Bloqueio Informativa */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-950 dark:text-amber-100 block mb-0.5">
                Autenticação Individual Obrigatória
              </strong>
              <span>
                Para aceder ao registo de requisições, processos arquivísticos, levantamentos e devoluções, deve iniciar sessão com a sua conta individual. Não é permitido acesso sem autenticação.
              </span>
            </div>
          </div>

          {/* Estado dos Serviços: Base de Dados & SMTP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dbStatus?.tursoAtivo ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {dbStatus?.tursoAtivo ? 'Turso Cloud (Ativo)' : 'SQLite Local (Memória)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {dbStatus?.tursoAtivo ? 'libSQL' : 'sql.js'}
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${smtpStatus?.smtpConfigurado ? 'bg-[#92d400]' : 'bg-amber-400 animate-pulse'}`}></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                  {smtpStatus?.smtpConfigurado 
                    ? `SMTP (${smtpStatus.smtpHost})` 
                    : 'Modo Demonstração'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                P.{smtpStatus?.smtpPort || 465}
              </span>
            </div>
          </div>

          {/* Mensagens de Erro */}
          {erro && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{erro}</span>
            </div>
          )}

          {/* PASSO 1: INSERÇÃO DO EMAIL */}
          {passo === 'email' && (
            <form onSubmit={handleSolicitarOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Endereço de Correio Eletrónico Institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="exemplo@ua.pt ou filben@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#92d400] focus:border-[#92d400] transition"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Sem necessidade de palavra-passe. Receberá um código numérico de 6 dígitos (OTP) de uso único.
                </p>
              </div>

              {/* Lista de operadores autorizados no Arquivo Central para preenchimento rápido */}
              {listaOperadores.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Operadores autorizados no Arquivo Central (clique para preencher):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {listaOperadores.filter(o => o.ativo).map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setEmail(op.email)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition flex items-center gap-2.5 ${
                          email.toLowerCase() === op.email.toLowerCase()
                            ? 'border-[#92d400] bg-[#92d400]/10 dark:bg-[#92d400]/20 text-[#284000] dark:text-[#cbf561] font-semibold ring-1 ring-[#92d400]'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold shrink-0 shadow-xs">
                          {op.nome.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">{op.nome}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{op.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 px-4 bg-[#92d400] hover:bg-[#82be00] active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {carregando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A gerar código de acesso...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Código de Acesso (OTP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASSO 2: INSERÇÃO DO CÓDIGO OTP DE 6 DÍGITOS */}
          {passo === 'codigo' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#92d400]/20 text-[#3b5e00] dark:text-[#cbf561] mb-2.5">
                  <ShieldCheck className="w-7 h-7" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Introduza o Código de Verificação
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Enviado para <strong>{email}</strong> ({nomeOperador})
                </p>
              </div>

              {/* Destaque em Modo Demonstração (Sem SMTP ativo) */}
              {devCode && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Modo Demonstração (Sem SMTP Ativo)
                    </span>
                    <span className="font-mono text-sm tracking-widest bg-amber-200 dark:bg-amber-900/80 px-2.5 py-0.5 rounded-md font-bold">
                      {devCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-2.5">
                    Para testes rápidos sem configuração prévia de e-mail, pode preencher diretamente este código:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const digitos = devCode.split('');
                      setCodigoOtp(digitos);
                      submeterCodigo(devCode);
                    }}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Preencher Automaticamente e Iniciar Sessão ({devCode})
                  </button>
                </div>
              )}

              {/* Caixas de Código de 6 Dígitos */}
              <div>
                <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Código de 6 dígitos numéricos
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {codigoOtp.map((digito, idx) => (
                    <input
                      key={idx}
                      ref={el => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digito}
                      onChange={e => handleDigitoChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#92d400] focus:ring-2 focus:ring-[#92d400]/30 transition"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Temporizador */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>Validade do código:</span>
                <span className={`font-mono font-bold ${tempoRestante < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatarTempo(tempoRestante)}
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={carregando || codigoOtp.some(d => d === '')}
                  onClick={() => submeterCodigo(codigoOtp.join(''))}
                  className="w-full py-3 px-4 bg-[#92d400] hover:bg-[#82be00] active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {carregando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>A validar código...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar e Entrar no Arquivo Central</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPasso('email');
                      setErro(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:underline cursor-pointer"
                  >
                    ← Alterar endereço de correio
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSolicitarOtp()}
                    disabled={carregando}
                    className="text-[#3b5e00] dark:text-[#cbf561] hover:underline font-semibold cursor-pointer"
                  >
                    Reenviar novo código
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
