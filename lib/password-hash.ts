const ITERATIONS = 100_000;
const HASH_ALG = "SHA-256";
const KEY_LENGTH = 256;

function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const decoded = Buffer.from(padded, "base64");

  const buffer = new ArrayBuffer(decoded.byteLength);
  const bytes = new Uint8Array(buffer);

  bytes.set(decoded);

  return bytes;
}

function encodeText(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);

  const buffer = new ArrayBuffer(encoded.byteLength);
  const bytes = new Uint8Array(buffer);

  bytes.set(encoded);

  return bytes;
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<Uint8Array<ArrayBuffer>> {
  const passwordBytes = encodeText(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALG,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return new Uint8Array(derivedBits);
}

export async function hashPassword(password: string): Promise<string> {
  const saltBuffer = new ArrayBuffer(16);
  const salt = new Uint8Array(saltBuffer);

  crypto.getRandomValues(salt);

  const hash = await derivePasswordHash(password, salt);

  return `${bytesToBase64Url(salt)}:${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(
  password: string,
  storedPassword: string
): Promise<boolean> {
  const [saltEncoded, expectedHash] = storedPassword.trim().split(":");

  if (!saltEncoded || !expectedHash) {
    return false;
  }

  try {
    const salt = base64UrlToBytes(saltEncoded);
    const calculatedHashBytes = await derivePasswordHash(password, salt);
    const calculatedHash = bytesToBase64Url(calculatedHashBytes);

    if (calculatedHash.length !== expectedHash.length) {
      return false;
    }

    let difference = 0;

    for (let index = 0; index < calculatedHash.length; index += 1) {
      difference |=
        calculatedHash.charCodeAt(index) ^
        expectedHash.charCodeAt(index);
    }

    return difference === 0;
  } catch {
    return false;
  }
}