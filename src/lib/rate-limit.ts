import { prisma } from "./prisma";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

const CLEANUP_PROBABILITY = 0.01;
const CLEANUP_GRACE_MS = 60 * 60 * 1000;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

async function cleanupExpiredBuckets() {
  if (Math.random() > CLEANUP_PROBABILITY) {
    return;
  }

  try {
    await prisma.rateLimitBucket.deleteMany({
      where: { resetAt: { lt: new Date(Date.now() - CLEANUP_GRACE_MS) } }
    });
  } catch {
    // Le nettoyage est un bonus opportuniste, une erreur ici ne doit jamais casser une requete.
  }
}

// Backe par Postgres (partage entre toutes les instances serverless) plutot qu'une Map en
// memoire, qui ne protege quasiment rien en production multi-instance/serverless.
export async function checkRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const now = new Date();
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;

  await cleanupExpiredBuckets();

  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + options.windowMs);
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt }
    });
    return { ok: true, remaining: options.max - 1, resetAt };
  }

  if (existing.count >= options.max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated = await prisma.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } }
  });

  return { ok: true, remaining: options.max - updated.count, resetAt: existing.resetAt };
}
