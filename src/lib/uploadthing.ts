import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

type UploadThingData = {
  ufsUrl?: string | null;
  url?: string | null;
  appUrl?: string | null;
};

const resolveUploadedUrl = (data: UploadThingData | null | undefined): string | null => {
  if (!data) return null;
  return data.ufsUrl || data.url || data.appUrl || null;
};

const extractUploadThingKeyFromUrl = (fileUrl?: string | null): string | null => {
  if (!fileUrl) return null;

  try {
    const parsed = new URL(fileUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);

    // Typical URL shape: /f/<fileKey>
    const fIndex = segments.indexOf("f");
    if (fIndex !== -1 && segments[fIndex + 1]) {
      return segments[fIndex + 1];
    }

    return segments.length > 0 ? segments[segments.length - 1] : null;
  } catch {
    return null;
  }
};

export const uploadOneToUploadThing = async (file: File): Promise<string> => {
  const result = await utapi.uploadFiles(file);

  if (result.error) {
    throw new Error(result.error.message || "Gagal upload file ke UploadThing.");
  }

  const uploadedUrl = resolveUploadedUrl(result.data);
  if (!uploadedUrl) {
    throw new Error("UploadThing tidak mengembalikan URL file.");
  }

  return uploadedUrl;
};

export const uploadManyToUploadThing = async (files: File[]): Promise<string[]> => {
  if (files.length === 0) return [];

  const results = await utapi.uploadFiles(files);

  return results.map((item) => {
    if (item.error) {
      throw new Error(item.error.message || "Gagal upload salah satu file ke UploadThing.");
    }

    const uploadedUrl = resolveUploadedUrl(item.data);
    if (!uploadedUrl) {
      throw new Error("UploadThing tidak mengembalikan URL file.");
    }

    return uploadedUrl;
  });
};

export const deleteUploadThingByUrl = async (fileUrl?: string | null) => {
  const key = extractUploadThingKeyFromUrl(fileUrl);
  if (!key) return;

  try {
    await utapi.deleteFiles(key);
  } catch {
    // Ignore delete failures to avoid blocking DB updates.
  }
};

export const deleteUploadThingManyByUrls = async (urls: Array<string | null | undefined>) => {
  const keys = urls
    .map((url) => extractUploadThingKeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  if (keys.length === 0) return;

  try {
    await utapi.deleteFiles(keys);
  } catch {
    // Ignore delete failures to avoid blocking DB updates.
  }
};
