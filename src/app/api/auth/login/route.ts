import User from '@/models/User';
import { NextResponse } from 'next/server';
import { hashPassword, isBcryptHash, verifyPassword } from '@/lib/password';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await User.findOne({
      where: { username }
    });

    if (user) {
      const storedPassword = String(user.getDataValue('password') || '');
      const isValidPassword = await verifyPassword(String(password), storedPassword);
      if (!isValidPassword) {
        return NextResponse.json({ success: false, message: "Username atau Password salah" }, { status: 401 });
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
    return NextResponse.json({ success: false, message: "Username atau Password salah" }, { status: 401 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}