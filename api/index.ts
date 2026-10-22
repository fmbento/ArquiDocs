import app from '../server.ts';
import { getDb } from '../server/db.ts';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await getDb();
      initialized = true;
    } catch (err) {
      console.warn('Aviso ao inicializar base de dados em serverless handler:', err);
    }
  }
  return app(req, res);
}
