import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Server,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Operador, SmtpStatus } from '../types/index.ts';

interface ModalLoginOTPProps {
  aberto: boolean;
  onFechar: () => void;
  operadoresDisponiveis: Operador[];
  onLoginSucesso: (operador: Operador, token: string) => void;
}

export const ModalLoginOTP: React.FC<ModalLoginOTPProps> = ({
  aberto,
  onFechar,
  operadoresDisponiveis,
  onLoginSucesso
}) => {
  const [passo, setPasso] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState<string>('');
  const [codigoOtp, setCodigoOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [nomeOperador, setNomeOperador] = useState<string>('');
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [tempoRestante, setTempoRestante] = useState<number>(600); // 10 minutos (600s)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Carregar status do SMTP
  useEffect(() => {
    if (aberto) {
      fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => setSmtpStatus(data))
        .catch(() => {});
    }
  }, [aberto]);

  // Controlo do temporizador no passo do código
  useEffect(() => {
    let intervalo: any = null;
    if (aberto && passo === 'codigo' && tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [aberto, passo, tempoRestante]);

  // Reset ao abrir
  useEffect(() => {
    if (aberto) {
      setErro(null);
      setMensagemSucesso(null);
      // Se já houver operadores disponíveis, sugere o primeiro
      if (!email && operadoresDisponiveis.length > 0) {
        const primeiro = operadoresDisponiveis.find(o => o.ativo) || operadoresDisponiveis[0];
        setEmail(primeiro.email);
      }
    }
  }, [aberto, operadoresDisponiveis]);

  if (!aberto) return null;

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Enviar pedido de OTP
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

      // Foco no primeiro dígito
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao solicitar código.');
    } finally {
      setCarregando(false);
    }
  };

  // 2. Manipulação de inputs individuais do código OTP
  const handleDigitoChange = (index: number, valor: string) => {
    // Apenas números
    const limpo = valor.replace(/\D/g, '');
    const novoCodigo = [...codigoOtp];

    if (limpo.length > 1) {
      // Caso o utilizador cole o código completo
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
        // Submeter automaticamente se todos preenchidos
        submeterCodigo(novoCodigo.join(''));
      }
      return;
    }

    novoCodigo[index] = limpo;
    setCodigoOtp(novoCodigo);

    if (limpo && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Se todos preenchidos, submete
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

  // 3. Verificar código OTP e autenticar
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
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      onLoginSucesso(dados.operador, dados.token);
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Código de verificação incorreto.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Institucional */}
        <div className="bg-[#24282a] border-b-4 border-[#92d400] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-[#92d400]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-[#92d400]">
                Universidade de Aveiro • SBIDM
              </p>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Autenticação de Operador
              </h3>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6">
          {/* Indicador de Status do SMTP */}
          <div className="mb-5 flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${smtpStatus?.smtpConfigurado ? 'bg-[#92d400]' : 'bg-amber-400 animate-pulse'}`}></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {smtpStatus?.smtpConfigurado 
                  ? `Servidor SMTP Ativo (${smtpStatus.smtpHost})` 
                  : 'Modo Demonstração (Código OTP visual e log)'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Porta {smtpStatus?.smtpPort || 465}
            </span>
          </div>

          {/* Alertas de Erro */}
          {erro && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
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
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                  Sem necessidade de palavra-passe. Receberá um código numérico temporário (OTP) no seu e-mail.
                </p>
              </div>

              {/* Sugestões de Operadores Registados para teste e acesso rápido */}
              {operadoresDisponiveis.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Operadores registados no Arquivo Central:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {operadoresDisponiveis.filter(o => o.ativo).map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setEmail(op.email)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition flex items-center gap-2.5 ${
                          email.toLowerCase() === op.email.toLowerCase()
                            ? 'border-[#92d400] bg-[#92d400]/10 dark:bg-[#92d400]/20 text-[#284000] dark:text-[#cbf561] font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#92d400] text-slate-950 text-xs flex items-center justify-center font-bold shrink-0">
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
                className="w-full py-2.5 px-4 bg-[#92d400] hover:bg-[#82be00] active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
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
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#92d400]/20 text-[#3b5e00] dark:text-[#cbf561] mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Introduza o Código de Verificação
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Enviado para <strong>{email}</strong> ({nomeOperador})
                </p>
              </div>

              {/* Destaque em Modo Demonstração (quando SMTP ainda não estiver preenchido com credenciais reais) */}
              {devCode && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Modo Demonstração (Sem SMTP Ativo)
                    </span>
                    <span className="font-mono text-sm tracking-widest bg-amber-200 dark:bg-amber-900/80 px-2 py-0.5 rounded font-bold">
                      {devCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-2">
                    Para o teste imediato, pode preencher diretamente este código gerado:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const digitos = devCode.split('');
                      setCodigoOtp(digitos);
                      submeterCodigo(devCode);
                    }}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Preencher Automaticamente e Entrar ({devCode})
                  </button>
                </div>
              )}

              {/* Caixas de Código de 6 Dígitos */}
              <div>
                <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  Código de 6 dígitos
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#92d400] focus:ring-2 focus:ring-[#92d400]/30 transition"
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
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={carregando || codigoOtp.some(d => d === '')}
                  onClick={() => submeterCodigo(codigoOtp.join(''))}
                  className="w-full py-2.5 px-4 bg-[#92d400] hover:bg-[#82be00] active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {carregando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>A validar código...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar e Iniciar Sessão</span>
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
                    ← Alterar e-mail
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
