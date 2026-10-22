import nodemailer, { type Transporter } from 'nodemailer';

// Leitura das configurações SMTP (compatível com SiReS Bibliotecas UA / Reserva-de-Salas-de-Estudo)
export function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const defaultFrom = user ? `"Arquivo Central SBIDM UA" <${user}>` : '"Arquivo Central SBIDM UA" <arquivo@ua.pt>';
  const from = process.env.SMTP_FROM || defaultFrom;

  const isConfigured = Boolean(user && pass);

  return {
    host,
    port,
    user,
    pass,
    from,
    isConfigured
  };
}

let transporterInstance: Transporter | null = null;

function getTransporter(): Transporter | null {
  const config = getSmtpConfig();
  if (!config.isConfigured) return null;

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true para SSL 465, false para 587 STARTTLS
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporterInstance;
}

/**
 * Envia e-mail com código OTP de 6 dígitos para login individual de operador
 */
export async function enviarEmailOTP(
  destinatario: string,
  nomeOperador: string,
  codigoOtp: string
): Promise<{ enviado: boolean; erro?: string; modoDemo: boolean }> {
  const config = getSmtpConfig();

  if (!config.isConfigured) {
    console.log(`[AUTENTICAÇÃO OTP - DEMO] SMTP não configurado. Código OTP para ${destinatario} (${nomeOperador}): ${codigoOtp}`);
    return {
      enviado: false,
      modoDemo: true,
      erro: 'Serviço SMTP não configurado no servidor. Utilize o código de demonstração apresentado.'
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { enviado: false, modoDemo: true, erro: 'Falha ao inicializar transporte SMTP' };
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

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: destinatario,
      subject: `[Arquivo Central UA] Código de Acesso OTP: ${codigoOtp}`,
      text: `Olá ${nomeOperador},\n\nO seu código de verificação temporário para aceder ao Arquivo Central (SBIDM - UA) é: ${codigoOtp}\n\nEste código expira em 10 minutos.\n\nUniversidade de Aveiro • SBIDM`,
      html
    });

    console.log(`[AUTENTICAÇÃO OTP] E-mail enviado com sucesso para ${destinatario}. MessageId: ${info.messageId}`);
    return { enviado: true, modoDemo: false };
  } catch (err: any) {
    console.error(`[AUTENTICAÇÃO OTP - ERRO] Falha ao enviar e-mail para ${destinatario}:`, err.message);
    return {
      enviado: false,
      modoDemo: false,
      erro: `Erro SMTP ao enviar mensagem: ${err.message}`
    };
  }
}

/**
 * Envia notificação por e-mail referente a requisição se SMTP estiver ativo
 */
export async function enviarEmailNotificacao(
  destinatario: string,
  assunto: string,
  html: string
): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config.isConfigured) return false;

  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: config.from,
      to: destinatario,
      subject: assunto,
      html
    });
    return true;
  } catch (err) {
    console.warn('[NOTIFICACAO EMAIL] Falha no envio SMTP:', err);
    return false;
  }
}
