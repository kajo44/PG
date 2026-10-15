# GeoSurvey Jalan Next

Workspace pengembangan untuk penyempurnaan **PKRMS GeoSurvey Pro** berdasarkan arsip sumber `pkrms-geosurvey-pro.zip`.

## Tujuan

Membangun aplikasi survei jalan yang terstruktur, dapat dipelihara, informatif, dan siap dikembangkan untuk alur kerja geospasial serta integrasi analisis berbantuan AI sesuai hasil audit kode.

## Status

**Tahap: persiapan dan audit awal.** Arsip sumber telah teridentifikasi di root repositori sebagai `pkrms-geosurvey-pro.zip`, tetapi kode di dalam arsip belum diekstrak dan diverifikasi dalam workspace ini. Karena itu, modul aplikasi, dependensi, dan status pengujian belum dinyatakan terverifikasi.

## Prinsip kerja

1. Pertahankan arsip sumber tanpa perubahan.
2. Inventarisasi isi ZIP dan petakan alur aplikasi sebelum refaktor.
3. Pertahankan fitur yang valid; jangan menghapus perilaku lama tanpa alasan dan pengganti.
4. Pisahkan UI, logika domain, akses data, serta integrasi GIS bila struktur sumber mendukungnya.
5. Tambahkan validasi input, penanganan error yang terarah, logging, dan fallback yang aman.
6. Kunci dependensi berdasarkan pemeriksaan impor dan pengujian, bukan perkiraan.
7. Dokumentasikan perubahan dan hasil pengujian; jangan menyatakan lulus sebelum dijalankan.

## Struktur rencana

- `docs/ROADMAP.md` — tahap pengembangan.
- `docs/AUDIT_CHECKLIST.md` — pemeriksaan yang harus dilakukan saat kode sumber tersedia.
- `docs/BASELINE.md` — status faktual awal dan batasan verifikasi.

## Menjalankan aplikasi

Belum tersedia instruksi menjalankan aplikasi untuk workspace ini. Instruksi yang akurat akan ditambahkan setelah entry point, versi Python, dan dependensi dari arsip sumber diverifikasi.
