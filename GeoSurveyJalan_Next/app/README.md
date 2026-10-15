# GeoSurvey Jalan Next

Aplikasi web untuk mendukung survei kondisi jalan, inspeksi foto per STA, visualisasi peta, map matching HMM/Viterbi, analitik, dan ekspor data.

## Status fungsional saat ini

**Ini masih baseline pengembangan.** Dataset jalan dan sebagian statistik adalah data demo. Backend sinkronisasi belum dikonfigurasi; Google Earth Engine belum terhubung. Impor foto membaca GPS EXIF bila tersedia dan menghitung STA awal melalui proyeksi ke geometri ruas. Form inspeksi menyediakan koreksi manual latitude/longitude/STA. Semua hasil tetap perlu diverifikasi. Jika EXIF GPS tidak tersedia, koordinat dan STA awal bersifat sementara.

Map matching menggunakan kandidat proyeksi segmen, skor emisi berbasis jarak GPS, skor transisi berbasis selisih jarak/STA, dan dekode jalur Viterbi pada satu geometri ruas. Model ini masih perlu divalidasi pada data lapangan dan tidak menggantikan pemeriksaan teknis.

## Persyaratan

- Node.js 22 LTS direkomendasikan.
- npm yang menyertai Node.js.
- Akses jaringan diperlukan untuk mengunduh dependensi saat instalasi dan untuk layer peta eksternal saat aplikasi berjalan.

## Menjalankan aplikasi

```bash
npm ci
npm run dev
```

Vite menampilkan alamat lokal di terminal (konfigurasi awal menggunakan port 3000).

## Pemeriksaan kualitas

```bash
npm run lint
npm test
npm run build
```

## Modul utama

- `src/App.tsx` — state dan alur antarmodul.
- `src/components/` — antarmuka peta, galeri, inspeksi foto, analitik, ekspor, dan status integrasi.
- `src/utils/geoMath.ts` — perhitungan geodesi dan STA.
- `src/utils/mapMatching.ts` — HMM/Viterbi untuk satu geometri ruas.
- `src/utils/photoLocation.ts` — proyeksi GPS EXIF ke STA kumulatif ruas.
- `src/utils/offlineSync.ts` — penyimpanan foto IndexedDB dan antrean metadata lokal; bukan konektor server.

## Prinsip data

- Verifikasi GPS EXIF, geometri ruas, dan STA sebelum dipakai untuk keputusan teknis.
- Jangan menganggap antrean lokal sebagai bukti data telah tersinkron ke server.
- Jangan gunakan laporan aplikasi sebagai pengesahan resmi sebelum data dan pejabat penandatangan diverifikasi.
- Jangan menaruh API key rahasia dalam kode frontend atau berkas yang dibundel ke browser.

Lihat `../docs/ROADMAP.md` dan `../docs/AUDIT_FINDINGS.md` untuk rencana dan temuan audit.
