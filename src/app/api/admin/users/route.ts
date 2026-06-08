import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const users = await User.findAll({
      where: { role: 'SURVEYOR' },
      attributes: ['id', 'nama', 'email', 'username', 'jabatanSurveyor', 'noTelp', 'jenisBank', 'noRekening', 'role'],
      order: [['id', 'DESC']],
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const body = await req.json();
    const {
      nama,
      email,
      username,
      password,
      jabatanSurveyor,
      noTelp,
      jenisBank,
      noRekening,
    } = body;

    if (!nama || !email || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Nama, email, username, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ where: { username } }),
      User.findOne({ where: { email } }),
    ]);

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan.' },
        { status: 409 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    const newUser = await User.create({
      nama,
      email,
      username,
      password: passwordHash,
      jabatanSurveyor: jabatanSurveyor || null,
      noTelp: noTelp || null,
      jenisBank: jenisBank || null,
      noRekening: noRekening || null,
      role: 'SURVEYOR',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.getDataValue('id'),
        nama: newUser.getDataValue('nama'),
        email: newUser.getDataValue('email'),
        username: newUser.getDataValue('username'),
        role: newUser.getDataValue('role'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const body = await req.json();
    const {
      id,
      email,
      username,
      password,
      jabatanSurveyor,
      noTelp,
      jenisBank,
      noRekening,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengguna wajib diisi.' }, { status: 400 });
    }

    if (!email || !username) {
      return NextResponse.json(
        { success: false, error: 'Email dan username wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { id, role: 'SURVEYOR' } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (password && String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ where: { username, id: { [Op.ne]: id } } }),
      User.findOne({ where: { email, id: { [Op.ne]: id } } }),
    ]);

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan.' },
        { status: 409 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan.' },
        { status: 409 }
      );
    }

    const updates: Record<string, string | null> = {
      email,
      username,
      jabatanSurveyor: jabatanSurveyor || null,
      noTelp: noTelp || null,
      jenisBank: jenisBank || null,
      noRekening: noRekening || null,
    };

    if (password) {
      updates.password = await hashPassword(String(password));
    }

    await user.update(updates);

    return NextResponse.json({
      success: true,
      data: {
        id: user.getDataValue('id'),
        nama: user.getDataValue('nama'),
        email: user.getDataValue('email'),
        username: user.getDataValue('username'),
        jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
        noTelp: user.getDataValue('noTelp'),
        jenisBank: user.getDataValue('jenisBank'),
        noRekening: user.getDataValue('noRekening'),
        role: user.getDataValue('role'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengguna wajib diisi.' }, { status: 400 });
    }

    const deletedCount = await User.destroy({ where: { id, role: 'SURVEYOR' } });

    if (!deletedCount) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
