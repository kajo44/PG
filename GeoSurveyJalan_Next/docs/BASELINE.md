# Baseline Awal

## Fakta terverifikasi

- Repositori sumber: `kajo44/PG`.
- Branch sumber: `main`.
- Arsip sumber: `pkrms-geosurvey-pro.zip`.
- SHA blob arsip: `89fad902e41626b13cd7bdbcbd204273b7a7a5e8`.
- SHA-256 arsip yang dihitung oleh runner: `6244179f0a4628a9325c0609700a222b7615c1762e48aa3977621bd0510e97b7`.
- Arsip memiliki 33 entri dengan sekitar 254.501 byte tidak terkompresi.
- Sumber adalah aplikasi web React + TypeScript + Vite; tidak ditemukan file Python dalam arsip.
- Branch pengembangan: `geosurvey-jalan-next`.
- Workspace kerja: `GeoSurveyJalan_Next/app/`.
- Hasil ekstraksi asli: `GeoSurveyJalan_Next/source_original/` dan dipertahankan sebagai baseline.
- Pengujian unit awal: `app/src/utils/mapMatching.test.ts`.

## Fitur yang tampak dari kode

- Peta interaktif dan visualisasi trek.
- Panel map matching dasar.
- Galeri dan formulir penilaian foto.
- Dashboard analitik berbasis data contoh.
- Panel layer peta demonstrasi.
- Ekspor PDF, CSV, dan GeoJSON.
- Antrean perubahan lokal yang belum memiliki backend sinkronisasi.

## Batasan yang belum dianggap selesai

- Pembacaan metadata EXIF/GPS dan penempatan foto secara otomatis.
- Backend persisten untuk ruas, foto, dan sinkronisasi multi-perangkat.
- Integrasi Google Earth Engine dan AI yang benar-benar terhubung.
- HMM/Viterbi untuk map matching sekuensial.
- Uji penerimaan berbasis data jalan nyata dan verifikasi aturan PKRMS.
- Paket desktop/portable; baseline ini adalah aplikasi web.

## Catatan integritas

Arsip asli tetap tidak diubah. Perubahan aplikasi dilakukan di `app/`; jangan menyalin hasil perbaikan kembali ke `source_original/`. Temuan yang dibuktikan oleh kode dibedakan dari rencana dan hal yang belum diuji.
