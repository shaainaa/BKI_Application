import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

type ParsedMysqlUrl = {
  host: string;
  port: string;
  user: string;
  password: string;
  dbName: string;
};

function cleanEnv(value?: string): string {
  return String(value ?? '').trim().replace(/^['\"]|['\"]$/g, '');
}

function parseMysqlUrl(url?: string): ParsedMysqlUrl | null {
  const safeUrl = cleanEnv(url);
  if (!safeUrl) return null;

  try {
    const parsed = new URL(safeUrl);
    const protocol = parsed.protocol.replace(':', '').toLowerCase();
    if (protocol !== 'mysql' && protocol !== 'mariadb') {
      return null;
    }

    return {
      host: parsed.hostname,
      port: parsed.port,
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      dbName: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    };
  } catch {
    return null;
  }
}

function toBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() !== 'false';
}

const databaseUrl = cleanEnv(process.env.DATABASE_URL);
const parsedDbUrl = parseMysqlUrl(databaseUrl);

const host = cleanEnv(process.env.DB_HOST) || parsedDbUrl?.host || '';
const dbName = cleanEnv(process.env.DB_NAME) || parsedDbUrl?.dbName || '';
const dbUser = cleanEnv(process.env.DB_USER) || parsedDbUrl?.user || '';
const dbPassword = cleanEnv(process.env.DB_PASSWORD) || parsedDbUrl?.password || '';

const isTiDBHost = /tidbcloud\.com$/i.test(host);
const sslMode = (process.env.DB_SSL_MODE ?? 'auto').toLowerCase(); // auto | on | off
const useSSL =
  sslMode === 'on'
    ? true
    : sslMode === 'off'
      ? false
      : toBooleanEnv(process.env.DB_SSL, isTiDBHost);
const rejectUnauthorized = toBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);
const port = Number(cleanEnv(process.env.DB_PORT) || parsedDbUrl?.port || (isTiDBHost ? '4000' : '3306'));

export const missingDbEnvs = [
  !host ? 'DB_HOST' : null,
  !dbName ? 'DB_NAME' : null,
  !dbUser ? 'DB_USER' : null,
  !dbPassword ? 'DB_PASSWORD' : null,
].filter(Boolean) as string[];

const sslConfig = useSSL
  ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized,
    }
  : undefined;

const sequelize = new Sequelize(
  dbName || 'test',
  dbUser || 'root',
  dbPassword,
  {
    host: host || '127.0.0.1',
    port,
    dialect: 'mysql',
    dialectModule: mysql2,
    dialectOptions: sslConfig
      ? {
          ssl: sslConfig,
        }
      : {},
    logging: false,
  }
);

export default sequelize;