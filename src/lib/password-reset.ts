import crypto from "crypto";

const TOKEN_TTL_MS = 30 * 60 * 1000;

type ResetPayload = {
  userId: string;
  exp: number;
  pwdSig: string;
};

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET manquant");
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function buildPasswordSignature(passwordHash: string) {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 24);
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

export function createPasswordResetToken(userId: string, passwordHash: string) {
  const payload: ResetPayload = {
    userId,
    exp: Date.now() + TOKEN_TTL_MS,
    pwdSig: buildPasswordSignature(passwordHash)
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function parseAndVerifyPasswordResetToken(token: string): ResetPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as ResetPayload;
    if (!parsed.userId || !parsed.exp || !parsed.pwdSig) {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function matchesPasswordSignature(passwordHash: string, pwdSig: string) {
  return buildPasswordSignature(passwordHash) === pwdSig;
}
