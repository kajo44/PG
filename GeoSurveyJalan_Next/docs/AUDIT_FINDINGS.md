# Temuan Audit Awal — PKRMS GeoSurvey Pro

Audit ini didasarkan pada inspeksi statis arsip yang berhasil diekstrak oleh GitHub Actions. Temuan di bawah adalah kondisi kode sumber awal, bukan klaim bahwa seluruh fitur telah diuji di perangkat pengguna.

## Ringkasan baseline

- Teknologi sumber: React + TypeScript + Vite (bukan aplikasi Python).
- Arsip sumber: 33 entri, sekitar 254.501 byte data tidak terkompresi.
- Area utama: peta interaktif, panel map matching, galeri/inspeksi foto, dashboard analitik, panel layer peta, ekspor PDF/CSV/GeoJSON, dan editor trek.
- Data awal berasal dari `src/data/mockRoads.ts`; lintasan GPS dapat dibuat melalui `generateSimulatedRawGPS`.
- Penyimpanan foto lokal menggunakan `localStorage`.
- Paket `@google/genai` pada manifest bukan bukti bahwa layanan AI telah terhubung.

## Temuan prioritas tinggi

### 1. Status sinkronisasi dan kehilangan antrean
Kode awal menghapus antrean lokal saat tombol sync ditekan tanpa konfirmasi backend. Kode yang sudah diperbarui tidak lagi menghapus antrean dan memberi pesan bahwa backend belum dikonfigurasi. Sinkronisasi nyata tetap belum tersedia.

### 2. Label cloud/GEE tidak didukung implementasi
UI dan ekspor awal menyatakan “120 TB Active”, sinkronisasi cloud, serta integrasi Google Earth Engine. Alur yang diperiksa menggunakan statistik lokal/simulasi dan layer tile peta pihak ketiga, bukan koneksi GEE yang terverifikasi. Label utama dan metadata ekspor telah diluruskan untuk menunjukkan status demo/belum terhubung.

### 3. Map matching belum HMM/Viterbi
Kode awal memproyeksikan setiap titik GPS ke segmen terdekat secara independen. Tidak ada perhitungan probabilitas transisi antar kandidat atau dekode Viterbi. Label dan komentar telah dikoreksi; metode yang ada disebut proyeksi segmen terdekat. HMM/Viterbi masih menjadi pekerjaan lanjutan.

### 4. Status anomali tidak konsisten
Awalnya lonjakan kecepatan dapat mengisi alasan anomali tanpa mengaktifkan flag `isAnomaly`. Flag kini ikut diaktifkan pada kondisi tersebut. Tes unit awal mencakup kasus lonjakan kecepatan.

### 5. Impor foto menciptakan lokasi acak
Kode awal menetapkan STA dan koordinat secara acak saat foto diimpor. Alur itu telah diubah agar tidak menghasilkan lokasi acak; nilai awal menggunakan titik awal ruas dan diberi catatan bahwa STA/koordinat harus diverifikasi. Validasi tipe gambar, batas ukuran 15 MB, geometri ruas, dan kesalahan pembacaan ditambahkan. **EXIF/GPS otomatis dan penentuan STA yang benar belum diimplementasikan.**

### 6. Informasi pengesahan pada laporan tidak valid
Ekspor PDF awal menyertakan nama pejabat, NIP, dan kode lisensi yang ditanam di kode, serta status cloud/HMM yang tidak didukung. Nilai pengesahan tersebut telah diganti menjadi belum ditentukan/draf, dan status integrasi dinyatakan belum terhubung.

## Risiko penting lain

- `localStorage` memiliki batas kapasitas; foto sebagai data URL dapat memenuhi kuota. Pembatasan ukuran impor ditambahkan, tetapi migrasi ke IndexedDB atau penyimpanan file terkelola masih diperlukan.
- Ekspor CSV/GeoJSON perlu diuji dengan data kosong, karakter khusus, koordinat tidak valid, dan foto lintas ruas.
- Proyeksi geometri menggunakan pendekatan equirectangular lokal; batas penggunaan, segmen degenerat, dan validasi CRS masih perlu ditinjau.
- Aplikasi dalam ZIP adalah web app Vite. Paket desktop/portable belum tersedia.
- Paket AI yang tercantum belum menunjukkan alur inferensi nyata. API key rahasia tidak boleh dimasukkan ke bundle frontend; integrasi AI/cloud perlu desain server-side yang aman.

## Urutan perbaikan selanjutnya

1. Selesaikan lint, tes, dan build dari folder kerja `app/`.
2. Tambahkan pengujian untuk geometri degenerat, input invalid, ekspor, dan penyimpanan.
3. Implementasikan EXIF/GPS yang benar dan alur koreksi lokasi/STA secara eksplisit.
4. Migrasikan penyimpanan foto dari localStorage ke penyimpanan yang sesuai dan tidak mudah kehilangan data.
5. Implementasikan HMM/Viterbi dengan kandidat, emisi, transisi, STA kumulatif, serta dataset uji.
6. Rancang backend dan sinkronisasi yang menghapus antrean hanya setelah acknowledgement yang valid.
7. Hubungkan GEE/AI hanya melalui konfigurasi yang benar dan respons layanan yang dapat diverifikasi.
8. Uji terhadap data jalan nyata dan aturan PKRMS sebelum penggunaan operasional.



## Hasil validasi otomatis sementara

- Inventarisasi ZIP dan ekstraksi aman: berhasil.
- Pada satu putaran CI, instalasi npm gagal karena versi `esbuild` yang dipatok aplikasi tidak memenuhi peer requirement Vite 8.3 (`esbuild ^0.27.0 || ^0.28.0`). Dependensi diperbarui ke `^0.28.0`.
- Setelah perbaikan dependensi, validasi harus dijalankan ulang pada workspace `app/`. Status akhir lint, unit test, dan build hanya akan dilaporkan dari run terbaru.

## Batas audit

Audit ini menggabungkan inspeksi statis dan tes otomatis yang sedang dijalankan. Kebenaran geospasial, kinerja, sinkronisasi jaringan, keamanan operasional, dan kesesuaian PKRMS belum dapat dinyatakan lulus tanpa pengujian khusus.
