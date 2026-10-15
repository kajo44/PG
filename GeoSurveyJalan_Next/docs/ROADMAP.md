# Roadmap Pengembangan

## Tahap 1 — Akuisisi dan inventarisasi sumber
- [x] Ekstrak arsip sumber ke workspace tanpa mengubah ZIP asli.
- [x] Catat jumlah entri, ukuran, hash, dan struktur direktori.
- [x] Identifikasi entry point, UI, modul domain, aset, konfigurasi, dan dependensi.
- [x] Pisahkan ekstraksi asli dari aplikasi kerja.

## Tahap 2 — Audit teknis dan fungsional
- [x] Petakan fitur yang tampak dari kode dan bedakan data demo dari integrasi nyata.
- [x] Identifikasi risiko antrean sinkronisasi, label cloud/GEE, lokasi foto acak, dan pengesahan hard-coded.
- [x] Periksa dependensi dan perbaiki konflik peer dependency Vite/esbuild.
- [x] Tambahkan checklist audit dan catatan temuan.

## Tahap 3 — Stabilisasi awal
- [x] Cegah penghapusan antrean lokal tanpa acknowledgement backend.
- [x] Tambahkan validasi foto, geometri, GPS, dan status anomali.
- [x] Migrasikan penyimpanan foto ke IndexedDB dengan migrasi cache lama.
- [x] Tambahkan tes unit untuk geodesi, STA, HMM/Viterbi, dan GPS foto.
- [ ] Perluas pengujian ekspor, penyimpanan, dan kasus data rusak.

## Tahap 4 — Rekonstruksi dan peningkatan
- [x] Implementasi awal HMM/Viterbi untuk satu geometri ruas.
- [x] Baca GPS EXIF bila tersedia dan proyeksikan ke STA kumulatif ruas.
- [x] Tambahkan UI koreksi manual latitude/longitude/STA.
- [x] Luruskan label demo/integrasi yang belum dikonfigurasi.
- [ ] Validasi HMM/Viterbi terhadap data GPS lapangan, hairpin nyata, dan interseksi.
- [ ] Validasi foto dan STA terhadap metadata nyata.
- [ ] Rancang backend sinkronisasi dengan acknowledgement, retry, dan idempotensi.
- [ ] Hubungkan GEE/AI melalui konfigurasi aman setelah kebutuhan layanan ditetapkan.
- [ ] Evaluasi map matching multi-ruas/interseksi.

## Tahap 5 — Paket dan dokumentasi
- [x] Tetapkan Node.js/npm sebagai toolchain proyek web.
- [x] Tambahkan lint, unit test, build, CI, dan package-lock.
- [x] Gunakan `npm ci` untuk instalasi dependensi CI yang reproducible.
- [ ] Uji smoke test browser dan perangkat dengan penyimpanan terbatas.
- [ ] Evaluasi distribusi desktop/portable jika dibutuhkan.
- [ ] Dokumentasikan alur kerja lapangan dan batasan data resmi.

**Aturan status:** checklist hanya ditandai selesai setelah ada bukti pemeriksaan atau hasil uji.
