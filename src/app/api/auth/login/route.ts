import User from '@/models/User';
import { NextResponse } from 'next/server';
import { hashPassword, isBcryptHash, verifyPassword } from '@/lib/password';
import { missingDbEnvs } from '@/lib/db';
import { attachSessionCookie } from '@/lib/auth-session';

const isProd = process.env.NODE_ENV === 'production';

function loginErrorResponse(status: number, message: string, detail?: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(isProd || !detail ? {} : { detail }),
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    if (missingDbEnvs.length > 0) {
      return loginErrorResponse(
        503,
        'Layanan login belum siap. Silakan hubungi admin aplikasi.',
        `Konfigurasi database belum lengkap: ${missingDbEnvs.join(', ')}`
      );
    }

    const body = await req.json();
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');

    if (!username || !password) {
      return loginErrorResponse(400, 'Username dan password wajib diisi.');
    }

    const user = await User.findOne({
      where: { username }
    });

    if (user) {
      const storedPassword = String(user.getDataValue('password') || '');
      const isValidPassword = await verifyPassword(String(password), storedPassword);
      if (!isValidPassword) {
        return loginErrorResponse(401, 'Username atau password salah.');
      }

      // Migrasi otomatis akun lama yang masih menyimpan password plaintext.
      if (!isBcryptHash(storedPassword)) {
        user.setDataValue('password', await hashPassword(String(password)));
        await user.save();
      }

      const userPayload = {
        id: user.getDataValue('id'),
        nama: user.getDataValue('nama'),
        email: user.getDataValue('email'),
        username: user.getDataValue('username'),
        noTelp: user.getDataValue('noTelp'),
        jenisBank: user.getDataValue('jenisBank'),
        noRekening: user.getDataValue('noRekening'),
        jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
        role: user.getDataValue('role'),
      };

      const response = NextResponse.json({
        success: true, 
        user: userPayload,
      });

      await attachSessionCookie(response, {
        id: Number(userPayload.id),
        nama: String(userPayload.nama || ''),
        email: String(userPayload.email || ''),
        username: String(userPayload.username || ''),
        role: userPayload.role === 'ADMIN' ? 'ADMIN' : 'SURVEYOR',
      });

      return response;
    }
    return loginErrorResponse(401, 'Username atau password salah.');
  } catch (error: unknown) {
    console.error('Login error:', error);
    const rawMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    const isSslProtocolMismatch =
      /server does not support secure connection/i.test(rawMessage) ||
      /ssl connection error/i.test(rawMessage) ||
      /wrong version number/i.test(rawMessage);
    const isMissingDbEnv =
      /access denied for user ''@'localhost' \(using password: no\)/i.test(rawMessage) ||
      /missing required environment variable: db_/i.test(rawMessage);

    const isDbConnectionError =
      /connect etimedout/i.test(rawMessage) ||
      /ecconnrefused|econnrefused/i.test(rawMessage) ||
      /getaddrinfo enotfound/i.test(rawMessage) ||
      /access denied for user/i.test(rawMessage) ||
      /unknown database/i.test(rawMessage);

    if (isMissingDbEnv) {
      return loginErrorResponse(
        503,
        'Layanan login belum siap. Silakan hubungi admin aplikasi.',
        'Environment database belum terbaca di runtime.'
      );
    }

    if (isSslProtocolMismatch) {
      return loginErrorResponse(
        503,
        'Koneksi ke layanan sedang bermasalah. Coba lagi beberapa saat.',
        'Mode SSL database tidak cocok (cek DB_SSL_MODE/DB_SSL).'
      );
    }

    if (isDbConnectionError) {
      return loginErrorResponse(
        503,
        'Koneksi ke layanan sedang bermasalah. Coba lagi beberapa saat.',
        rawMessage
      );
    }

    return loginErrorResponse(500, 'Terjadi kesalahan server. Silakan coba lagi.');
  }
}