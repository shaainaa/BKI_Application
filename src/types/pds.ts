/**
 * PDS (Permintaan Data Surveyor) related types
 */

export type PdsStatus = 'PENDING' | 'APPROVED' | 'SUBMITTED' | 'COMPLETED' | 'REJECTED';
export type BuktiStatus = 'PENDING' | 'DITERIMA' | 'DIREJECT';

export interface User {
  id: number;
  nama: string;
  name?: string;
  email: string;
  username: string;
  noTelp?: string | null;
  jenisBank?: string | null;
  noRekening?: string | null;
  jabatanSurveyor?: string | null;
  role: 'ADMIN' | 'SURVEYOR';
}

export interface Pds {
  id: number;
  userId: number;
  user?: User;
  permohonan: string;
  tanggalPengajuan?: string | null;
  lokasi?: string | null;
  keperluan?: string | null;
  noAgenda?: string | number | null;
  tglBerangkat: string;
  jamBerangkat?: string | null;
  tglKembali: string;
  jamKembali?: string | null;
  visitKe?: string | number | null;
  keteranganVisit?: string | null;
  ttdDigitalUrl?: string | null;
  status: PdsStatus;
  buktiSubmittedAt?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  BuktiPdsList?: BuktiPds[];
}

export interface BuktiPds {
  id: number;
  pdsId: number;
  kategori?: string | null;
  fileUrl?: string | null;
  verificationStatus: BuktiStatus;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PdsListFilters {
  status?: PdsStatus;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PdsFilterResponse {
  pdsList: Pds[];
  totalCount: number;
  page: number;
  limit: number;
}
