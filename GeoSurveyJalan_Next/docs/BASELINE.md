# Baseline Awal

## Fakta terverifikasi

- Repositori sumber: `kajo44/PG`; branch sumber: `main`.
- Arsip sumber: `pkrms-geosurvey-pro.zip`.
- SHA blob arsip: `89fad902e41626b13cd7bdbcbd204273b7a7a5e8`.
- SHA-256 arsip yang dihitung runner: `6244179f0a4628a9325c0609700a222b7615c1762e48aa3977621bd0510e97b7`.
- Arsip memiliki 33 entri dengan sekitar 254.501 byte tidak terkompresi.
- Sumber adalah aplikasi web React + TypeScript + Vite; tidak ditemukan file Python dalam arsip.
- Branch pengembangan: `geosurvey-jalan-next`.
- Aplikasi kerja: `GeoSurveyJalan_Next/app/`.
- Hasil ekstraksi asli: `GeoSurveyJalan_Next/source_original/`; dipertahankan terpisah.
- Tes unit: `app/src/utils/mapMatching.test.ts`.

## Fitur dan perbaikan yang sudah ada di workspace

- Peta interaktif dan visualisasi trek.
- Map matching HMM/Viterbi untuk satu geometri ruas: kandidat proyeksi, skor emisi berbasis jarak, skor transisi berbasis jarak/STA, dan dekode jalur.
- Validasi dasar koordinat, timestamp, parameter algoritme, serta status anomali kecepatan.
- Galeri/penilaian foto dengan validasi tipe dan ukuran berkas.
- Penyimpanan foto IndexedDB dengan migrasi cache localStorage lama; antrean sinkronisasi metadata tetap lokal.
- Panel layer peta demo, analitik berbasis data contoh, dan ekspor PDF/CSV/GeoJSON.
- Pemberitahuan bahwa backend cloud belum dikonfigurasi dan antrean tidak boleh dihapus sebelum acknowledgement.

## Batasan yang belum dianggap selesai

- Pembacaan EXIF/GPS otomatis dan penempatan foto/STA yang tervalidasi.
- Backend persisten untuk ruas, foto, dan sinkronisasi multi-perangkat.
- Integrasi Google Earth Engine dan inferensi AI yang benar-benar terhubung.
- Map matching jaringan multi-ruas/interseksi dan kalibrasi skor dengan data nyata.
- Uji penerimaan berbasis data jalan nyata dan verifikasi aturan PKRMS.
- Paket desktop/portable; baseline ini adalah aplikasi web.

## Catatan integritas

Arsip asli tidak diubah. Perubahan hanya dilakukan pada `app/`; jangan menyalin hasil perbaikan ke `source_original/`. Hasil CI memverifikasi tipe, tes unit, dan build—bukan otomatis membuktikan kebenaran hasil survei atau kepatuhan PKRMS.
