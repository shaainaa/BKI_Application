import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import User from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function GET(req: NextRequest) {
  try {
    const userId = Number(req.nextUrl.searchParams.get('userId'));

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId wajib diisi.' }, { status: 400 });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.getDataValue('id'),
        nama: user.getDataValue('nama'),
        email: user.getDataValue('email'),
        username: user.getDataValue('username'),
        noTelp: user.getDataValue('noTelp'),
        jenisBank: user.getDataValue('jenisBank'),
        noRekening: user.getDataValue('noRekening'),
        jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
        role: user.getDataValue('role'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      nama,
      username,
      noTelp,
      jenisBank,
      noRekening,
      jabatanSurveyor,
      currentPassword,
      newPassword,
    } = body;

    const id = Number(userId);
    if (!id) {
      return NextResponse.json({ success: false, error: 'userId wajib diisi.' }, { status: 400 });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    if (!nama || !String(nama).trim()) {
      return NextResponse.json({ success: false, error: 'Nama wajib diisi.' }, { status: 400 });
    }

    if (!username || !String(username).trim()) {
      return NextResponse.json({ success: false, error: 'Username wajib diisi.' }, { status: 400 });
    }

    const usernameTrimmed = String(username).trim();
    const usernameTaken = await User.findOne({
      where: {
        username: usernameTrimmed,
        id: { [Op.ne]: id },
      },
    });

    if (usernameTaken) {
      return NextResponse.json({ success: false, error: 'Username sudah digunakan.' }, { status: 409 });
    }

    user.setDataValue('nama', String(nama).trim());
    user.setDataValue('username', usernameTrimmed);
    user.setDataValue('noTelp', noTelp ? String(noTelp).trim() : null);
    user.setDataValue('jenisBank', jenisBank ? String(jenisBank).trim() : null);
    user.setDataValue('noRekening', noRekening ? String(noRekening).trim() : null);
    user.setDataValue('jabatanSurveyor', jabatanSurveyor ? String(jabatanSurveyor).trim() : null);

    if (newPassword && String(newPassword).trim().length > 0) {
      const newPasswordTrimmed = String(newPassword).trim();
      if (newPasswordTrimmed.length < 6) {
        return NextResponse.json({ success: false, error: 'Password baru minimal 6 karakter.' }, { status: 400 });
      }

      if (!currentPassword || !String(currentPassword).trim()) {
        return NextResponse.json({ success: false, error: 'Password saat ini wajib diisi untuk mengganti password.' }, { status: 400 });
      }

      const storedPassword = String(user.getDataValue('password') || '');
      const isCurrentPasswordValid = await verifyPassword(String(currentPassword), storedPassword);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ success: false, error: 'Password saat ini tidak sesuai.' }, { status: 401 });
      }

      user.setDataValue('password', await hashPassword(newPasswordTrimmed));
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        id: user.getDataValue('id'),
        nama: user.getDataValue('nama'),
        email: user.getDataValue('email'),
        username: user.getDataValue('username'),
        noTelp: user.getDataValue('noTelp'),
        jenisBank: user.getDataValue('jenisBank'),
        noRekening: user.getDataValue('noRekening'),
        jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
        role: user.getDataValue('role'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
