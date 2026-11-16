// Idempotente: roda a cada publicação. Cria o admin inicial só quando não existe nenhum.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@tarefas.app').trim().toLowerCase();
  // Sem senha no código (o repositório é público): o deploy do Hub gera uma e guarda só no .env do servidor.
  const password = String(process.env.SEED_ADMIN_PASSWORD || '');
  if (!password) console.warn('SEED_ADMIN_PASSWORD não definido: admin inicial não criado.');
  const name = process.env.SEED_ADMIN_NAME || 'Administrador';

  if (password && (await prisma.user.count({ where: { role: 'admin' } })) === 0) {
    await prisma.user.upsert({
      where: { email },
      update: { role: 'admin' },
      create: { email, name, role: 'admin', passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Admin criado: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
