# Absensi 1.0 (Sistem Kehadiran Karyawan)

Aplikasi sistem absensi berbasis web yang dirancang khusus untuk memenuhi kebutuhan perusahaan dalam mengelola kehadiran dan cuti karyawan. Proyek ini dibangun dengan *stack* modern untuk performa, keamanan, dan tipe data yang ketat.

## 🌟 Fitur Utama

### 🧑‍💼 Karyawan (Employee)
- **Check-In & Check-Out Terintegrasi Geofencing**: Memastikan karyawan hanya bisa absen dalam radius tertentu dari lokasi kantor.
- **Deteksi Keterlambatan**: Mencatat status terlambat berdasarkan threshold waktu masuk (dapat dikonfigurasi melalui `.env`).
- **Kompresi Foto Otomatis**: Foto dari webcam dikompres (70% kualitas) sebelum dikirimkan ke server untuk menghemat *storage* dan *bandwidth*.
- **Konfirmasi Check-Out**: Mencegah salah tekan tombol saat mengakhiri sesi kehadiran.
- **Pengajuan Cuti/Izin**: Karyawan dapat mengajukan absen (cuti/izin/sakit) beserta riwayat status persetujuannya.

### 🛡️ Admin (Management)
- **Dashboard Karyawan**: Mengelola data karyawan (tambah, edit, penugasan *role*).
- **Laporan Kehadiran (History)**: Melihat riwayat absensi setiap karyawan (masuk, keluar, status, foto kehadiran).
- **Manajemen Pengajuan Cuti**: Menerima atau menolak pengajuan cuti/izin karyawan.
- **Keamanan Lanjut**: Panel dilindungi dengan metode `adminProcedure` berbasis tRPC untuk memvalidasi *role* secara konsisten.

## ✅ Status Saat Ini (Audit + Remediasi 27 Mei 2026)
- Geofencing check-in/check-out sudah divalidasi di server.
- Otorisasi admin untuk endpoint sensitif sudah menggunakan `adminProcedure`.
- Foreign key di schema absensi/cuti sudah aktif.
- Unit test backend lulus (`21/21`) dan build produksi berhasil.
- Cookie session policy sudah aman untuk HTTPS production maupun local HTTP.
- Validasi environment kritikal sudah fail-fast saat startup server.
- Analytics sudah di-load secara conditional sehingga build bersih warning placeholder env.

## 🏗️ Teknologi yang Digunakan

Proyek ini dibangun di atas *Web App Template* yang dimodifikasi, menggunakan teknologi:

- **Frontend**: React 19, Vite, Tailwind CSS 4, shadcn/ui, TanStack Query
- **Backend**: Express 4, tRPC 11 (dengan Superjson)
- **Database**: MySQL / TiDB dengan Drizzle ORM
- **Authentication**: Manus OAuth terintegrasi via JWT (Sesi: 24 Jam)
- **Storage**: AWS S3 via Manus Forge
- **Testing**: Vitest untuk unit test (Cakupan Geofencing, Router Auth, Cuti)

## 🚀 Panduan Instalasi (Lokal)

### Persyaratan
- Node.js (Disarankan v20+)
- `pnpm` (Package Manager)  
  Jika belum terpasang global, gunakan `npx pnpm`.
- Database MySQL

### 1. Kloning dan Instalasi
```bash
# Instal semua dependensi
npx pnpm install
```

### 2. Konfigurasi Environment
Buat file `.env` berdasarkan konfigurasi contoh:
```bash
cp .env.example .env
```
Isi nilai-nilai di dalam `.env` sesuai dengan server database Anda dan konfigurasi absensi (seperti latitude/longitude kantor, threshold keterlambatan).

### 3. Setup Database
Sinkronisasikan schema Drizzle ke database:
```bash
npx pnpm db:push
```

### 4. Menjalankan Aplikasi
```bash
# Menjalankan server dan client dalam mode development
npx pnpm dev
```
Aplikasi dapat diakses melalui browser sesuai dengan URL yang tertera di console.

## 🧪 Testing

Jalankan pengujian unit (Vitest) yang mencakup logika geofencing, pengajuan cuti, dan keamanan router:
```bash
npx pnpm test
```

Untuk mengecek tidak ada *error TypeScript*:
```bash
npx pnpm check
```

## 🔒 Catatan Keamanan
Proyek ini mengadopsi standar keamanan yang ketat:
- **Rate Limiting (In-Memory)** diterapkan pada endpoint Check-in / Check-out untuk mencegah serangan DDoS / brute force.
- **Foreign Key Constraints** telah diterapkan di schema Drizzle untuk menjaga integritas data absensi.
- Endpoint admin diamankan secara penuh melalui *middleware* `adminProcedure`.

## Known Limitations
- Rate limiter saat ini masih **in-memory**; untuk deployment multi-instance sangat disarankan migrasi ke Redis/distributed limiter.

## 📜 Lisensi
MIT
