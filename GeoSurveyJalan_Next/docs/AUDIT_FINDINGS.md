# Temuan Audit dan Perbaikan Awal — GeoSurvey Jalan Next

Audit dilakukan terhadap arsip asli dan perubahan aplikasi kerja. Bedakan temuan kode, perbaikan yang telah dibuat, dan kemampuan yang masih belum tersedia.

## Baseline terverifikasi

- Teknologi: React + TypeScript + Vite, bukan aplikasi Python.
- Arsip: 33 entri, sekitar 254.501 byte tidak terkompresi; SHA-256 `6244179f0a4628a9325c0609700a222b7615c1762e48aa3977621bd0510e97b7`.
- Data ruas/GPS awal menggunakan data contoh dan generator simulasi.
- Backend sinkronisasi, integrasi GEE, dan inferensi AI nyata belum dikonfigurasi.

## Temuan dan perbaikan

### 1. Antrean sinkronisasi dapat hilang
**Temuan awal:** tombol sync menghapus antrean lokal tanpa konfirmasi server.
**Perbaikan:** handler tidak lagi menghapus antrean atau menambah statistik seolah sinkronisasi berhasil. UI menjelaskan backend belum dikonfigurasi. Perubahan disimpan lokal dan menunggu backend.

### 2. Klaim cloud/GEE tidak didukung implementasi
**Temuan awal:** UI dan ekspor mengklaim “120 TB Active”, Google Earth Engine, dan sinkronisasi cloud walau alur yang diperiksa menggunakan statistik simulasi dan tile peta pihak ketiga.
**Perbaikan:** label utama, atribusi overlay, dan metadata ekspor diluruskan menjadi status demo/belum terhubung. Layer demo bukan NDVI atau hasil analisis Sentinel-2.

### 3. Map matching HMM/Viterbi
**Temuan awal:** UI menyebut HMM/Viterbi, sedangkan fungsi awal hanya memilih segmen terdekat per titik.
**Perbaikan:** fungsi kini membentuk kandidat proyeksi, menghitung skor emisi berbasis jarak GPS, menghitung skor transisi dari selisih jarak teramati dan jarak STA, lalu menggunakan Viterbi untuk memilih jalur pada satu geometri ruas. Skor kecocokan tetap heuristik, bukan probabilitas terkalibrasi.
**Batasan:** belum divalidasi terhadap lintasan lapangan nyata, jaringan multi-ruas, persimpangan, atau geometri bercabang.

### 4. Status anomali
**Temuan awal:** lonjakan kecepatan bisa memberi alasan anomali tanpa mengaktifkan flag.
**Perbaikan:** flag anomali ikut aktif saat lonjakan kecepatan terdeteksi; nama metrik menggunakan “anomali terdeteksi”.

### 5. Impor foto dan metadata GPS
**Temuan awal:** STA dan koordinat ditetapkan acak.
**Perbaikan:** nilai acak dihapus. Impor kini mencoba membaca GPS EXIF melalui `exifr`; bila tersedia, koordinat asli dipertahankan dan STA awal dihitung dari proyeksi terdekat pada geometri ruas. Foto yang berjarak lebih dari 100 m dari garis ruas diberi peringatan. Bila GPS EXIF tidak tersedia/gagal dibaca, nilai awal memakai titik awal ruas dan STA 0 dengan catatan perlu koreksi. Form inspeksi kini menyediakan input manual latitude/longitude/STA dan validasi rentang dasar.
**Batasan:** hasil otomatis belum menjamin foto berasal dari ruas terpilih; validasi manusia tetap diperlukan. Pembacaan waktu EXIF dan validasi CRS/STA pada data nyata belum selesai.

### 6. Penyimpanan lokal
**Temuan awal:** data URL foto disimpan di localStorage, yang memiliki kuota kecil; antrean juga menyimpan payload foto besar.
**Perbaikan:** foto kini disimpan di IndexedDB dengan migrasi cache localStorage lama. Antrean sinkronisasi hanya menyimpan metadata foto, bukan bytes gambar. Antrean tetap di localStorage dan belum memiliki backend.
**Batasan:** pengujian kuota penuh, browser privat, dan pemulihan data perlu diperluas.

### 7. Pengesahan laporan
**Temuan awal:** PDF berisi nama pejabat, NIP, dan kode lisensi hard-coded serta status cloud/HMM yang tidak didukung.
**Perbaikan:** identitas pengesah diganti menjadi belum ditentukan/draf; status integrasi dan label metode disesuaikan dengan implementasi.

### 8. Dependensi, build, dan performa awal
**Temuan awal:** instalasi npm gagal karena versi esbuild tidak memenuhi peer requirement Vite 8.3; bundle awal besar.
**Perbaikan:** esbuild disesuaikan, dependensi yang tidak digunakan dihapus/dipindah ke dev dependencies, konfigurasi Vite memakai resolusi path ESM, dan modul tab/modal dimuat secara lazy.
**Validasi sebelumnya:** run CI `38770468972` berhasil untuk instalasi, TypeScript check, 12 tes unit, dan production build sebelum lazy loading terbaru. Run CI `38770842597` berhasil untuk `npm ci`, TypeScript check, 12 tes unit, dan production build setelah lazy loading. UI koreksi foto/STA ditambahkan setelah run tersebut sehingga masih menunggu validasi ulang.

## Pekerjaan berikutnya

1. Jalankan ulang instalasi, lint, tes, dan build setelah lazy loading terbaru.
2. Perluas pengujian map matching untuk segmen degenerat, timestamp invalid, dan jaringan multi-ruas.
3. Tambahkan UI koreksi foto/STA dan uji terhadap metadata EXIF nyata.
4. Rancang backend sinkronisasi dengan acknowledgement, retry, dan idempotensi.
5. Hubungkan GEE/AI melalui konfigurasi aman jika layanan tersebut memang diperlukan.
6. Uji ekspor dan perhitungan terhadap data jalan nyata serta aturan PKRMS.

## Batas audit

CI memeriksa tipe, tes yang ada, dan keberhasilan build. CI tidak membuktikan kebenaran survei, kesesuaian PKRMS, keamanan operasional, performa skala besar, atau keandalan sinkronisasi jaringan.
