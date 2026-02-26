import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
// PENTING: Pastikan lokasi import model BuktiPds ini sudah benar sesuai foldermu!
import BuktiPds from '@/models/BuktiPDS'; 

export async function POST(request: Request) {
  console.log("=== 1. API UPLOAD MULAI DIPANGGIL ===");
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pdsId = formData.get('pdsId') as string;
    const kategori = formData.get('kategori') as string;

    console.log("=== 2. DATA DITERIMA DARI FRONTEND ===", { 
      pdsId: pdsId, 
      kategori: kategori, 
      adaFile: !!file,
      namaFile: file?.name 
    });

    if (!file || !pdsId || !kategori) {
      console.log("❌ ERROR: Data dari frontend tidak lengkap!");
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    // Mengubah file menjadi buffer untuk disimpan
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');

    // Membuat folder jika belum ada
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Abaikan jika folder sudah ada
    }

    // Menyimpan file ke dalam folder public/uploads
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    console.log("=== 3. FILE FISIK BERHASIL DISIMPAN DI FOLDER ===", filePath);

    // Menyimpan path ke Database
    const fileUrl = `/uploads/${filename}`;
    console.log("=== 4. MENCOBA INSERT KE DATABASE ===");

    const existingBukti = await BuktiPds.findOne({ 
      where: { 
        pdsId: parseInt(pdsId), 
        kategori: kategori 
      } 
    });
    
    let savedBukti;

    if (existingBukti) {
      savedBukti = await existingBukti.update({
        fileUrl: fileUrl,
        namaFile: file.name
      });
    } else {
      savedBukti = await BuktiPds.create({
        pdsId: parseInt(pdsId), 
        kategori: kategori,
        fileUrl: fileUrl,
        namaFile: file.name
      });
    }
    return NextResponse.json({ success: true, message: "File berhasil diupload dan disimpan di database!", data: savedBukti });
  } catch (error: any) {
    console.error("❌ === ERROR TERJADI DI SERVER === ❌", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}