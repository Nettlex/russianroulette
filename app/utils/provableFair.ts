// Provably Fair RNG Implementation

/**
 * Generate cryptographically secure random number
 */
export function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Generate a random server seed
 */
export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive bullet index from server seed and round ID
 */
export async function deriveBulletIndex(serverSeed: string, roundId: string): Promise<number> {
  const combined = serverSeed + roundId;
  const hash = await sha256(combined);
  // Take first 8 hex chars and convert to number
  const num = parseInt(hash.substring(0, 8), 16);
  return num % 8;
}

/**
 * Verify that a bullet index was fairly generated
 */
export async function verifyFairness(
  commitHash: string,
  serverSeed: string,
  roundId: string,
  bulletIndex: number
): Promise<boolean> {
  // Verify commit hash matches server seed
  const computedCommit = await sha256(serverSeed);
  if (computedCommit !== commitHash) {
    return false;
  }

  // Verify bullet index derives from seed
  const computedBullet = await deriveBulletIndex(serverSeed, roundId);
  if (computedBullet !== bulletIndex) {
    return false;
  }

  return true;
}

/**
 * Generate a new round with commit-reveal
 */
export async function generateFairRound(roundId: string): Promise<{
  commitHash: string;
  serverSeed: string;
  bulletIndex: number;
}> {
  const serverSeed = generateServerSeed();
  const commitHash = await sha256(serverSeed);
  const bulletIndex = await deriveBulletIndex(serverSeed, roundId);

  return {
    commitHash,
    serverSeed,
    bulletIndex,
  };
}

