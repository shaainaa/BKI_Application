import User from '@/models/User';
import { NextResponse } from 'next/server';
import { hashPassword, isBcryptHash, verifyPassword } from '@/lib/password';
import { missingDbEnvs } from '@/lib/db';

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

    const { username, password } = await req.json();

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

      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.getDataValue('id'),
          nama: user.getDataValue('nama'),
          email: user.getDataValue('email'),
          username: user.getDataValue('username'),
          noTelp: user.getDataValue('noTelp'),
          jenisBank: user.getDataValue('jenisBank'),
          noRekening: user.getDataValue('noRekening'),
          jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
          role: user.getDataValue('role') // Kirimkan role (ADMIN/SURVEYOR) ke frontend
        } 
      });
    }
    return loginErrorResponse(401, 'Username atau password salah.');
  } catch (error: unknown) {
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