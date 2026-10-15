# Roadmap Pengembangan

## Tahap 1 — Akuisisi dan inventarisasi sumber
- [ ] Ekstrak arsip sumber ke workspace tanpa mengubah ZIP asli.
- [ ] Catat daftar file, ukuran, hash, dan struktur direktori.
- [ ] Identifikasi entry point, UI, modul domain, database, aset, konfigurasi, dan skrip build.
- [ ] Temukan dokumentasi yang ada serta konfigurasi dependensi.

## Tahap 2 — Audit teknis dan fungsional
- [ ] Petakan alur kerja pengguna dan fitur yang benar-benar ada.
- [ ] Periksa impor, dependensi, versi runtime, dan kompatibilitas.
- [ ] Periksa validasi input, exception handling, logging, dan potensi kehilangan data.
- [ ] Audit operasi file/folder, database, dan ekspor.
- [ ] Audit alur GIS, koordinat, geometri, foto, EXIF/GPS, serta KML/KMZ bila ada.
- [ ] Buat daftar bug terurut berdasarkan dampak dan tingkat risiko.

## Tahap 3 — Stabilisasi
- [ ] Perbaiki bug kritis dengan perubahan sekecil mungkin.
- [ ] Tambahkan fallback yang tidak menyamarkan kegagalan.
- [ ] Pastikan proses panjang memberi status/progres dan dapat dibatalkan dengan aman bila memungkinkan.
- [ ] Tambahkan pengujian untuk fungsi inti dan kasus gagal.

## Tahap 4 — Rekonstruksi dan peningkatan
- [ ] Rapikan struktur modul mengikuti temuan audit.
- [ ] Tingkatkan konsistensi UI dan pesan status.
- [ ] Perkuat validasi, logging, konfigurasi, dan pemulihan kesalahan.
- [ ] Evaluasi integrasi geospasial/AI berdasarkan kebutuhan nyata dan dukungan kode sumber.
- [ ] Hindari perubahan skema atau penghapusan fitur tanpa migrasi dan catatan.

## Tahap 5 — Paket dan dokumentasi
- [ ] Tetapkan dependensi langsung dan versi yang kompatibel.
- [ ] Siapkan skrip instalasi serta build Windows portable setelah runtime diuji.
- [ ] Dokumentasikan instalasi, penggunaan, troubleshooting, format data, dan batasan.
- [ ] Jalankan smoke test dari lingkungan bersih.
- [ ] Publikasikan catatan rilis dengan daftar fitur dan pengujian yang benar-benar selesai.

**Aturan status:** checklist hanya ditandai selesai setelah ada bukti pemeriksaan atau hasil uji.
