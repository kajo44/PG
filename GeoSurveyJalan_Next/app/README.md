# GeoSurvey Jalan Next

Aplikasi web untuk mendukung survei kondisi jalan, inspeksi foto per STA, visualisasi peta, map matching dasar, analitik, dan ekspor data.

## Status fungsional saat ini

**Ini masih baseline pengembangan.** Dataset jalan dan sebagian statistik adalah data demo. Backend sinkronisasi belum dikonfigurasi; Google Earth Engine belum terhubung. Foto impor belum membaca koordinat EXIF/GPS secara otomatis dan koordinat/STA awal harus diverifikasi. Metode map matching saat ini adalah proyeksi titik ke segmen terdekat, bukan HMM/Viterbi.

## Persyaratan

- Node.js 22 LTS direkomendasikan.
- npm yang menyertai Node.js.
- Akses jaringan diperlukan untuk mengunduh dependensi saat instalasi dan untuk layer peta eksternal saat aplikasi berjalan.

## Menjalankan aplikasi

```bash
npm install
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
- `src/utils/mapMatching.ts` — algoritme proyeksi ruas dasar.
- `src/utils/offlineSync.ts` — antrean lokal sementara; bukan konektor server.

## Prinsip data

- Jangan menganggap nilai awal foto sebagai metadata GPS yang tervalidasi.
- Jangan menganggap label “tersinkron” sebagai bukti penerimaan server.
- Jangan gunakan laporan aplikasi sebagai pengesahan resmi sebelum data dan pejabat penandatangan diverifikasi.
- Jangan menaruh API key rahasia dalam kode frontend atau berkas yang dibundel ke browser.

Lihat `../docs/ROADMAP.md` dan `../docs/AUDIT_FINDINGS.md` untuk rencana dan temuan audit.
