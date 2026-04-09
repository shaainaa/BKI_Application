import { NextResponse } from 'next/server';
// PENTING: Pastikan lokasi import model BuktiPds ini sudah benar sesuai foldermu!
import BuktiPds from '@/models/BuktiPDS'; 
import { deleteUploadThingByUrl, uploadOneToUploadThing } from '@/lib/uploadthing';

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

    const fileUrl = await uploadOneToUploadThing(file);
    console.log("=== 4. MENCOBA INSERT KE DATABASE ===");

    const existingBukti = await BuktiPds.findOne({ 
      where: { 
        pdsId: parseInt(pdsId), 
        kategori: kategori 
      } 
    });
    
    let savedBukti;

    if (existingBukti) {
      await deleteUploadThingByUrl(existingBukti.get('fileUrl') as string);
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
  } catch (error: unknown) {
    console.error("❌ === ERROR TERJADI DI SERVER === ❌", error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}