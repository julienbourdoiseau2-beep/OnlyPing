import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function hasR2Config() {
  return Boolean(env("R2_ENDPOINT") && env("R2_BUCKET") && env("R2_ACCESS_KEY_ID") && env("R2_SECRET_ACCESS_KEY"));
}

function withSingleSlash(base: string, suffix: string) {
  return `${base.replace(/\/+$/, "")}/${suffix.replace(/^\/+/, "")}`;
}

const r2Client = hasR2Config()
  ? new S3Client({
      region: env("R2_REGION") || "auto",
      endpoint: env("R2_ENDPOINT"),
      credentials: {
        accessKeyId: env("R2_ACCESS_KEY_ID"),
        secretAccessKey: env("R2_SECRET_ACCESS_KEY")
      }
    })
  : null;

export function isR2Enabled() {
  return Boolean(r2Client);
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType?: string;
  cacheControl?: string;
}) {
  if (!r2Client) {
    throw new Error("R2 non configure");
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env("R2_BUCKET"),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl
    })
  );
}

export async function getR2SignedReadUrl(key: string, expiresInSeconds = 120) {
  if (!r2Client) {
    throw new Error("R2 non configure");
  }

  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: env("R2_BUCKET"),
      Key: key
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function getR2SignedUploadUrl(params: {
  key: string;
  contentType?: string;
  cacheControl?: string;
  expiresInSeconds?: number;
}) {
  if (!r2Client) {
    throw new Error("R2 non configure");
  }

  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: env("R2_BUCKET"),
      Key: params.key,
      ContentType: params.contentType,
      CacheControl: params.cacheControl
    }),
    { expiresIn: params.expiresInSeconds ?? 300 }
  );
}

export function toR2VideoRef(key: string) {
  return `r2:${key}`;
}

export function parseR2VideoRef(value: string) {
  if (!value.startsWith("r2:")) {
    return null;
  }
  return value.slice(3);
}

export function getR2PublicBaseUrl() {
  return env("R2_PUBLIC_BASE_URL");
}

export function toPublicR2Url(key: string) {
  const base = getR2PublicBaseUrl();
  if (!base) {
    return "";
  }
  return withSingleSlash(base, key);
}

export function parseR2PublicUrl(urlValue: string) {
  const base = getR2PublicBaseUrl();
  if (!base || !urlValue) {
    return null;
  }

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedUrl = urlValue.replace(/\/+$/, "");
  if (!normalizedUrl.startsWith(normalizedBase)) {
    return null;
  }

  const key = normalizedUrl.slice(normalizedBase.length).replace(/^\/+/, "");
  return key || null;
}

export async function deleteFromR2(key: string) {
  if (!r2Client) {
    return;
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env("R2_BUCKET"),
      Key: key
    })
  );
}
