import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await User.findOne({ 
      where: { username, password } 
    }) as any;

    if (user) {
      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role // Kirimkan role (ADMIN/SURVEYOR) ke frontend
        } 
      });
    }
    return NextResponse.json({ success: false, message: "Username atau Password salah" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}