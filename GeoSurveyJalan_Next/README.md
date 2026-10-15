# GeoSurvey Jalan Next

Workspace pengembangan untuk penyempurnaan **PKRMS GeoSurvey Pro** berdasarkan arsip sumber `pkrms-geosurvey-pro.zip`.

## Struktur

- `app/` — aplikasi kerja yang sedang disempurnakan.
- `source_original/` — hasil ekstraksi arsip asli; jangan diedit.
- `audit/` — inventaris sumber dan laporan pemeriksaan otomatis.
- `docs/` — baseline, temuan audit, checklist, dan roadmap.
- `tools/audit_source_zip.py` — ekstraksi aman dan inventarisasi ZIP.

## Tujuan

Membangun aplikasi survei jalan yang terstruktur, dapat dipelihara, informatif, dan siap dikembangkan untuk alur kerja geospasial serta integrasi analisis berbantuan AI sesuai hasil audit kode.

## Status faktual

Sumber adalah aplikasi web React + TypeScript + Vite. Dataset awal berisi data contoh/simulasi. Backend sinkronisasi dan integrasi Google Earth Engine belum dikonfigurasi. Map matching saat ini menggunakan proyeksi titik ke segmen terdekat, bukan HMM/Viterbi. Status ini akan berubah hanya setelah implementasi dan pengujian terverifikasi.

## Jalankan aplikasi

Lihat `app/README.md` untuk persyaratan, perintah instalasi, pemeriksaan kualitas, dan keterbatasan.
