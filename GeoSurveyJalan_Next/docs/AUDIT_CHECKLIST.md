# Checklist Audit Kode

## Struktur dan pemeliharaan
- [ ] Temukan entry point dan jalur startup.
- [ ] Petakan modul dan dependensi antarmodul.
- [ ] Cari kode duplikat, fungsi besar, impor siklik, serta konfigurasi yang tertanam.
- [ ] Identifikasi file lama, aset, cache, model, dan data yang tidak boleh terhapus sembarangan.

## Ketahanan dan keamanan
- [ ] Validasi path, ekstensi file, encoding, ukuran input, dan data kosong.
- [ ] Tangani error dengan pesan yang bisa ditindaklanjuti; hindari `except` yang membungkam error.
- [ ] Gunakan logging dengan tingkat yang tepat; jangan mencatat kredensial atau data sensitif.
- [ ] Pastikan operasi tulis/ekspor aman dan tidak menimpa data pengguna tanpa konfirmasi.
- [ ] Periksa penggunaan subprocess, URL, temporary files, dan izin filesystem.
- [ ] Pastikan pekerjaan panjang tidak membekukan UI dan statusnya dilaporkan.

## Data dan GIS (jika ada)
- [ ] Verifikasi sistem koordinat, urutan longitude/latitude, satuan, dan transformasi CRS.
- [ ] Validasi geometri kosong/tidak valid dan geometri multipart.
- [ ] Periksa parsing KML/KMZ dan pelaporan file tanpa geometri.
- [ ] Periksa EXIF/GPS yang hilang atau tidak valid, zona waktu, dan metadata foto.
- [ ] Periksa transaksi database, indeks, backup, dan penanganan database terkunci.
- [ ] Verifikasi ekspor dan impor dengan sampel valid serta sampel rusak.

## Dependensi dan distribusi
- [ ] Daftar dependensi langsung dari import aktual.
- [ ] Pisahkan dependensi inti, opsional, dan pengembangan.
- [ ] Verifikasi versi Python dan pustaka yang didukung.
- [ ] Uji instalasi pada virtual environment bersih.
- [ ] Uji build portable dan startup pada komputer tanpa lingkungan pengembangan.

## Bukti audit
Untuk setiap temuan, catat: file/baris, kondisi pemicu, dampak, reproduksi, perbaikan, dan hasil uji.
