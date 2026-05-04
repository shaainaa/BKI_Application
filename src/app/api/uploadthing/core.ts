import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSessionFromRequest } from '@/lib/auth-session';

const f = createUploadthing();

const withSession = async ({ req }: { req: Request }) => {
  const session = await getSessionFromRequest(req);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return { userId: session.id, role: session.role };
};

export const ourFileRouter = {
  // Uploader file agenda (surat/lampiran)
  agendaUploader: f({ 
    pdf: { maxFileSize: "8MB" }, 
    image: { maxFileSize: "8MB" } 
  })
    .middleware(withSession)
    .onUploadComplete(async ({ file }) => {
      console.log("Upload agenda selesai! URL:", file.url);
      return { url: file.url };
    }),

  // Uploader tanda tangan digital PDS
  pdsSignatureUploader: f({
    image: { maxFileSize: "4MB" },
  })
    .middleware(withSession)
    .onUploadComplete(async ({ file }) => {
      console.log("Upload TTD PDS selesai! URL:", file.url);
      return { url: file.url };
    }),

  // Uploader bukti survey/transport/penginapan/lainnya
  pdsEvidenceUploader: f({
    pdf: { maxFileSize: "8MB" },
    image: { maxFileSize: "8MB" },
  })
    .middleware(withSession)
    .onUploadComplete(async ({ file }) => {
      console.log("Upload bukti PDS selesai! URL:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;