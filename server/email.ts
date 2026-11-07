import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';

let resendInstance: Resend | null = null;
let transporterInstance: Transporter | null = null;
let brevoTransporterInstance: Transporter | null = null;

// Extrai nome e email a partir de strings como '"Arquivo Central" <email@ua.pt>' ou 'email@ua.pt'
export function parseEmailAndName(fromStr: string, fallbackEmail: string) {
  const match = fromStr.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    const name = match[1]?.trim() || 'Arquivo Central SBIDM UA';
    const email = match[2]?.trim() || fallbackEmail;
    return { name, email };
  }
  return { name: 'Arquivo Central SBIDM UA', email: fromStr || fallbackEmail };
}

// Leitura e normalização das configurações de e-mail (Brevo API/SMTP, Resend API e Nodemailer SMTP)
export function getEmailConfig() {
  // 1. Brevo (Chave de API REST xkeysib-... ou Palavra-passe SMTP xsmtpsib-...)
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
  const brevoUser = (process.env.BREVO_USER || process.env.SENDINBLUE_USER || '').trim();
  const isBrevoSmtpKey = brevoApiKey.startsWith('xsmtpsib-');
  const isBrevoApiKey = brevoApiKey.startsWith('xkeysib-') || (!isBrevoSmtpKey && Boolean(brevoApiKey));
  const isBrevo = Boolean(brevoApiKey);

  // 2. Resend
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const isResend = Boolean(resendApiKey);

  // 3. SMTP Clássico (Gmail, Brevo SMTP Relay ou Universidade de Aveiro)
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const hasSmtp = Boolean(smtpUser && smtpPass);
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  // CC institucional obrigatório para todas as mensagens (padrão arquivo@ua.pt)
  const cc = (process.env.SMTP_CC || process.env.ARQUIVO_EMAIL_CC || 'arquivo@ua.pt').trim();

  // Remetentes padrão
  const defaultBrevoFrom = smtpUser 
    ? `"Arquivo Central SBIDM UA" <${smtpUser}>` 
    : '"Arquivo Central SBIDM UA" <arquivo.SBIDMUA.noreply@gmail.com>';
  const defaultResendFrom = '"Arquivo Central SBIDM UA" <onboarding@resend.dev>';
  const defaultSmtpFrom = smtpUser 
    ? `"Arquivo Central SBIDM UA" <${smtpUser}>` 
    : '"Arquivo Central SBIDM UA" <arquivo@ua.pt>';

  const brevoFrom = (process.env.BREVO_FROM || defaultBrevoFrom).trim();
  const resendFrom = (process.env.RESEND_FROM || defaultResendFrom).trim();
  const smtpFrom = (process.env.SMTP_FROM || defaultSmtpFrom).trim();

  const isConfigured = Boolean(isBrevo || isResend || hasSmtp);

  // Provedor ativo preferencial
  let provedorAtivo: 'brevo' | 'resend' | 'smtp' | 'demo' = 'demo';
  if (isBrevo) {
    provedorAtivo = 'brevo';
  } else if (isResend) {
    provedorAtivo = 'resend';
  } else if (hasSmtp) {
    provedorAtivo = 'smtp';
  }

  let host = smtpHost;
  let port = smtpPort;
  let from = smtpFrom;
  let user = smtpUser;

  if (isBrevo) {
    host = isBrevoSmtpKey ? 'smtp-relay.brevo.com' : 'api.brevo.com';
    port = isBrevoSmtpKey ? 587 : 443;
    from = brevoFrom;
    user = brevoUser || 'brevo';
  } else if (isResend) {
    host = 'api.resend.com';
    port = 443;
    from = resendFrom;
    user = 'resend';
  }

  return {
    isConfigured,
    provedorAtivo,
    // Brevo
    isBrevo,
    isBrevoSmtpKey,
    isBrevoApiKey,
    brevoApiKey,
    brevoUser,
    brevoFrom,
    // Resend
    isResend,
    resendApiKey,
    resendFrom,
    // SMTP (Gmail, Brevo SMTP relay ou UA)
    hasSmtp,
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    smtpFrom,
    // CC Institucional (arquivo@ua.pt)
    cc,
    // Exibição amigável
    host,
    port,
    from,
    user
  };
}

export function getSmtpConfig() {
  return getEmailConfig();
}

function getResendClient(): Resend | null {
  const config = getEmailConfig();
  if (!config.isResend) return null;
  if (!resendInstance) {
    resendInstance = new Resend(config.resendApiKey);
  }
  return resendInstance;
}

function getTransporter(): Transporter | null {
  const config = getEmailConfig();
  if (!config.hasSmtp) return null;

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true para SSL 465, false para 587 STARTTLS
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporterInstance;
}

function getBrevoTransporter(): Transporter | null {
  const config = getEmailConfig();
  if (!config.isBrevo || !config.brevoUser) return null;

  if (!brevoTransporterInstance) {
    brevoTransporterInstance = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // STARTTLS no porto 587
      auth: {
        user: config.brevoUser,
        pass: config.brevoApiKey
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return brevoTransporterInstance;
}

/**
 * Envia e-mail com código OTP de 6 dígitos para login individual de operador.
 * Ordem de prioridade inteligente:
 * 1. Brevo (REST API se xkeysib-... ou SMTP Relay se xsmtpsib-... com BREVO_USER)
 * 2. Resend API
 * 3. Gmail SMTP de contingência automática (fallback)
 */
export async function enviarEmailOTP(
  destinatario: string,
  nomeOperador: string,
  codigoOtp: string
): Promise<{ 
  enviado: boolean; 
  erro?: string; 
  modoDemo: boolean; 
  provedorUtilizado?: string;
  motivoFallback?: string;
}> {
  const config = getEmailConfig();

  if (!config.isConfigured) {
    console.log(`[AUTENTICAÇÃO OTP - DEMO] E-mail não configurado. Código OTP para ${destinatario} (${nomeOperador}): ${codigoOtp}`);
    return {
      enviado: false,
      modoDemo: true,
      erro: 'Nenhum serviço de e-mail configurado. Utilize o código de demonstração apresentado.'
    };
  }

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação • Arquivo Central UA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table role="presentation" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; border-collapse: separate; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Cabeçalho Institucional UA -->
    <tr>
      <td style="background-color: #24282a; padding: 24px 32px; border-bottom: 4px solid #92d400;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #92d400; font-weight: 700;">
          Universidade de Aveiro • SBIDM
        </p>
        <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">
          Arquivo Central — Autenticação de Operador
        </h1>
      </td>
    </tr>

    <!-- Conteúdo Principal -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
          Olá, <strong>${nomeOperador}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #475569;">
          Foi solicitada uma sessão individual no <strong>Sistema de Gestão e Rastreamento de Processos (ArquiDocs)</strong> do Arquivo Central da Universidade de Aveiro.
        </p>

        <!-- Caixa de Destaque do Código OTP -->
        <table role="presentation" style="width: 100%; margin: 24px 0; background-color: #f8fafc; border: 2px dashed #92d400; border-radius: 8px;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #3b5e00; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                O seu código de verificação temporário (OTP):
              </span>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #24282a; font-family: 'Courier New', Courier, monospace; margin: 4px 0;">
                ${codigoOtp}
              </div>
              <span style="font-size: 12px; color: #64748b; display: block; margin-top: 8px;">
                Válido durante <strong>10 minutos</strong>. Nunca partilhe este código.
              </span>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
          Se não solicitou este acesso, ignore esta mensagem. Nenhum acesso será concedido sem a validação deste código de uso único.
        </p>
      </td>
    </tr>

    <!-- Rodapé -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; font-weight: 600;">
          Serviços de Biblioteca, Informação Documental e Museologia (SBIDM)
        </p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Campus Universitário de Santiago, 3810-193 Aveiro • Universidade de Aveiro
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const subject = `[Arquivo Central UA] Código de Acesso OTP: ${codigoOtp}`;
  const text = `Olá ${nomeOperador},\n\nO seu código de verificação temporário para aceder ao Arquivo Central (SBIDM - UA) é: ${codigoOtp}\n\nEste código expira em 10 minutos.\n\nUniversidade de Aveiro • SBIDM`;

  let motivoFallback: string | undefined = undefined;

  // 1. TENTATIVA COM BREVO (REST API OU SMTP RELAY)
  if (config.isBrevo) {
    // 1A. Brevo SMTP Relay (se a chave começar por xsmtpsib- e existir BREVO_USER)
    if (config.isBrevoSmtpKey && config.brevoUser) {
      const brevoTransporter = getBrevoTransporter();
      if (brevoTransporter) {
        try {
          const info = await brevoTransporter.sendMail({
            from: config.brevoFrom,
            to: destinatario,
            subject,
            text,
            html
          });
          console.log(`[AUTENTICAÇÃO OTP - BREVO SMTP SUCESSO] E-mail individual enviado para ${destinatario}. MessageId: ${info.messageId}`);
          return { enviado: true, modoDemo: false, provedorUtilizado: 'Brevo SMTP Relay' };
        } catch (err: any) {
          console.warn(`[AUTENTICAÇÃO OTP - BREVO SMTP AVISO] Brevo SMTP falhou: ${err.message}`);
          motivoFallback = `Brevo SMTP falhou (${err.message}).`;
        }
      }
    } else if (config.isBrevoSmtpKey && !config.brevoUser) {
      console.warn(`[AUTENTICAÇÃO OTP - BREVO AVISO] A chave BREVO_API_KEY inserida (${config.brevoApiKey.slice(0, 10)}...) é uma palavra-passe SMTP (xsmtpsib-...). Para utilizar este relay, defina também a variável BREVO_USER com o seu Login do Brevo. Em alternativa, no separador 'Chaves de API' (API Keys), gere uma chave REST API v3 (começa por xkeysib-...).`);
      motivoFallback = `A chave Brevo inserida (xsmtpsib-...) é uma palavra-passe SMTP. Para envio direto por Brevo, defina a variável BREVO_USER com o Login do separador SMTP (ou gere uma chave de API v3 que começa por xkeysib-...).`;
    }

    // 1B. Brevo REST API v3 (se a chave for de API ou não for SMTP)
    if (config.isBrevoApiKey) {
      try {
        const sender = parseEmailAndName(config.brevoFrom, 'arquivo.sbidmua.noreply@gmail.com');
        const payload: any = {
          sender: { name: sender.name, email: sender.email },
          to: [{ email: destinatario, name: nomeOperador }],
          subject,
          htmlContent: html,
          textContent: text
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': config.brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resData: any = await response.json();

        if (response.ok) {
          console.log(`[AUTENTICAÇÃO OTP - BREVO API SUCESSO] E-mail individual enviado para ${destinatario}. MessageId: ${resData.messageId}`);
          return { enviado: true, modoDemo: false, provedorUtilizado: 'Brevo API' };
        } else {
          console.warn(`[AUTENTICAÇÃO OTP - BREVO API AVISO] ${resData.message || resData.code}`);
          motivoFallback = `Brevo API recusou (${resData.message || resData.code}).`;
        }
      } catch (err: any) {
        console.warn(`[AUTENTICAÇÃO OTP - BREVO API ERRO] ${err.message}`);
        motivoFallback = `Brevo API falhou (${err.message}).`;
      }
    }

    if (config.hasSmtp) {
      console.log(`[AUTENTICAÇÃO OTP - FALLBACK ATIVADO] A comutar para envio via SMTP de contingência (${config.smtpUser})...`);
    } else if (!config.isResend) {
      return {
        enviado: false,
        modoDemo: false,
        erro: motivoFallback || 'Falha ao autenticar com o Brevo.'
      };
    }
  }

  // 2. TENTATIVA COM RESEND SE ATIVO
  if (config.isResend) {
    const resend = getResendClient();
    if (resend) {
      try {
        const response = await resend.emails.send({
          from: config.resendFrom,
          to: [destinatario],
          subject,
          text,
          html
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        console.log(`[AUTENTICAÇÃO OTP - RESEND SUCESSO] E-mail individual enviado para ${destinatario}. ID: ${response.data?.id}`);
        return { enviado: true, modoDemo: false, provedorUtilizado: 'Resend API' };
      } catch (err: any) {
        console.warn(`[AUTENTICAÇÃO OTP - RESEND AVISO] Resend falhou (${err.message}).`);
        if (!motivoFallback) {
          motivoFallback = `Resend falhou (${err.message}).`;
        }
      }
    }
  }

  // 3. ENVIO VIA NODEMAILER SMTP (DIRETO OU CONTINGÊNCIA/FALLBACK)
  if (config.hasSmtp) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: config.smtpFrom,
          to: destinatario,
          subject,
          text,
          html
        });

        console.log(`[AUTENTICAÇÃO OTP - SMTP SUCESSO] E-mail individual enviado para ${destinatario}. MessageId: ${info.messageId}`);
        return { 
          enviado: true, 
          modoDemo: false, 
          provedorUtilizado: config.isBrevo 
            ? 'Gmail SMTP (Contingência Brevo)' 
            : (config.isResend ? 'Gmail SMTP (Contingência Resend)' : 'Gmail SMTP'),
          motivoFallback
        };
      } catch (err: any) {
        console.error(`[AUTENTICAÇÃO OTP - SMTP ERRO] Falha ao enviar para ${destinatario}:`, err.message);
        return {
          enviado: false,
          modoDemo: false,
          erro: `Erro SMTP ao enviar mensagem: ${err.message}`
        };
      }
    }
  }

  // 4. SE NENHUM SERVIÇO CONSEGUIU ENVIAR
  return {
    enviado: false,
    modoDemo: true,
    erro: 'Não foi possível expedir o e-mail por Brevo, Resend nem SMTP. Foi gerado um código de emergência na interface.'
  };
}

/**
 * Envia notificação por e-mail referente a requisições/levantamentos.
 * Suporta Brevo API / SMTP com fallback automático para Resend e Gmail SMTP.
 */
export async function enviarEmailNotificacao(
  destinatario: string,
  assunto: string,
  html: string
): Promise<boolean> {
  const config = getEmailConfig();
  if (!config.isConfigured) return false;

  // 1. TENTATIVA VIA BREVO
  if (config.isBrevo) {
    // 1A. Brevo SMTP
    if (config.isBrevoSmtpKey && config.brevoUser) {
      const brevoTransporter = getBrevoTransporter();
      if (brevoTransporter) {
        try {
          await brevoTransporter.sendMail({
            from: config.brevoFrom,
            to: destinatario,
            cc: config.cc,
            subject: assunto,
            html
          });
          console.log(`[NOTIFICAÇÃO BREVO SMTP] E-mail enviado para ${destinatario} (CC: ${config.cc}). Assunto: ${assunto}`);
          return true;
        } catch (err: any) {
          console.warn('[NOTIFICAÇÃO BREVO SMTP AVISO]:', err.message);
        }
      }
    }

    // 1B. Brevo REST API
    if (config.isBrevoApiKey) {
      try {
        const sender = parseEmailAndName(config.brevoFrom, 'arquivo.sbidmua.noreply@gmail.com');
        const payload: any = {
          sender: { name: sender.name, email: sender.email },
          to: [{ email: destinatario }],
          subject: assunto,
          htmlContent: html
        };
        if (config.cc) {
          payload.cc = [{ email: config.cc, name: 'Arquivo Central SBIDM UA' }];
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': config.brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log(`[NOTIFICAÇÃO BREVO API] E-mail enviado para ${destinatario} (CC: ${config.cc}). Assunto: ${assunto}`);
          return true;
        }
      } catch (err: any) {
        console.warn('[NOTIFICAÇÃO BREVO API ERRO]:', err.message);
      }
    }
  }

  // 2. TENTATIVA VIA RESEND API
  if (config.isResend) {
    const resend = getResendClient();
    if (resend) {
      try {
        const response = await resend.emails.send({
          from: config.resendFrom,
          to: [destinatario],
          cc: config.cc ? [config.cc] : undefined,
          subject: assunto,
          html
        });

        if (!response.error) {
          console.log(`[NOTIFICAÇÃO RESEND] E-mail enviado para ${destinatario} (CC: ${config.cc}). Assunto: ${assunto}`);
          return true;
        }
      } catch (err: any) {
        console.warn('[NOTIFICAÇÃO RESEND ERRO]:', err.message);
      }
    }
  }

  // 3. CONTINGÊNCIA / FALLBACK VIA SMTP
  if (config.hasSmtp) {
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: config.smtpFrom,
          to: destinatario,
          cc: config.cc,
          subject: assunto,
          html
        });
        console.log(`[NOTIFICAÇÃO SMTP CONTINGÊNCIA] E-mail enviado para ${destinatario} (CC: ${config.cc}). Assunto: ${assunto}`);
        return true;
      } catch (err: any) {
        console.warn('[NOTIFICAÇÃO SMTP ERRO]:', err.message);
      }
    }
  }

  return false;
}
