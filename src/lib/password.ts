import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHashOrPlain: string): Promise<boolean> {
  if (!passwordHashOrPlain) {
    return false;
  }

  if (isBcryptHash(passwordHashOrPlain)) {
    return bcrypt.compare(password, passwordHashOrPlain);
  }

  // Backward compatibility untuk data lama yang masih plaintext.
  return password === passwordHashOrPlain;
}
