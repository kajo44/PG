# Status Pengembangan

## Selesai
- [x] Branch pengembangan: `geosurvey-jalan-next`.
- [x] Workspace `GeoSurveyJalan_Next/` dengan aplikasi kerja `app/` dan baseline asli `source_original/`.
- [x] Inventaris ZIP, hash, roadmap, checklist, dan temuan audit.
- [x] Perlindungan antrean sinkronisasi; tidak menghapus perubahan tanpa acknowledgement backend.
- [x] Validasi foto impor dan penghapusan penetapan koordinat/STA acak.
- [x] Pembacaan GPS EXIF bila tersedia dan proyeksi awal ke STA ruas.
- [x] Validasi geometri/GPS, HMM/Viterbi awal, dan konsistensi flag anomali.
- [x] Penyimpanan foto IndexedDB dengan migrasi localStorage lama; antrean hanya menyimpan metadata foto.
- [x] Ekspor tidak lagi menampilkan klaim cloud/GEE dan pengesahan hard-coded yang belum terbukti.
- [x] Tes unit awal dan pipeline CI.
- [x] Lazy loading untuk modul tab dan modal.

## Hasil validasi CI
- [x] Run `38768831165`: instalasi, TypeScript check, tes unit, dan production build lulus sebelum EXIF GPS dan penyimpanan IndexedDB.
- [x] Run `38770468972`: instalasi, TypeScript check, 12 tes unit, dan production build lulus setelah EXIF GPS, IndexedDB, dan HMM/Viterbi.
- [ ] Jalankan ulang validasi setelah pemisahan bundle terbaru.

## Pekerjaan lanjutan
- [ ] Tes browser/manual dan uji pada data lapangan nyata.
- [ ] UI koreksi foto/STA dan verifikasi metadata.
- [ ] Backend sinkronisasi yang sesungguhnya.
- [ ] Integrasi GEE/AI dengan konfigurasi aman.
- [ ] Uji ekspor dan evaluasi kebenaran aturan PKRMS.
- [ ] Evaluasi paket desktop/portable bila diperlukan.

**Catatan:** lint, tes, dan build yang lulus tidak membuktikan sendiri bahwa analisis jalan sudah benar secara teknis atau memenuhi aturan PKRMS.
