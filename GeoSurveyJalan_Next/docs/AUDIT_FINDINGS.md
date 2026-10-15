# Temuan Audit dan Perbaikan Awal — GeoSurvey Jalan Next

Audit dilakukan terhadap arsip asli dan perubahan aplikasi kerja. Bedakan temuan kode, perbaikan yang telah dibuat, dan kemampuan yang masih belum tersedia.

## Baseline yang terverifikasi

- Teknologi: React + TypeScript + Vite, bukan aplikasi Python.
- Arsip: 33 entri, sekitar 254.501 byte tidak terkompresi; SHA-256 `6244179f0a4628a9325c0609700a222b7615c1762e48aa3977621bd0510e97b7`.
- Data ruas/GPS awal menggunakan data contoh dan generator simulasi.
- Backend sinkronisasi, integrasi GEE, dan inferensi AI nyata belum dikonfigurasi.

## Temuan dan perbaikan

### 1. Antrean sinkronisasi dapat hilang
**Temuan awal:** tombol sync menghapus antrean lokal tanpa konfirmasi server.
**Perbaikan:** handler tidak lagi menghapus antrean atau menambah statistik seolah sinkronisasi berhasil. UI menjelaskan bahwa backend belum dikonfigurasi. Foto evaluasi/ruas disimpan sebagai perubahan lokal yang menunggu backend.

### 2. Klaim cloud/GEE tidak didukung kode
**Temuan awal:** UI dan ekspor mengklaim “120 TB Active”, Google Earth Engine, dan sinkronisasi cloud walau alur yang diperiksa memakai statistik simulasi dan tile peta pihak ketiga.
**Perbaikan:** label utama, atribusi overlay, dan metadata ekspor diluruskan menjadi status demo/belum terhubung. Layer demo bukan NDVI atau hasil analisis Sentinel-2.

### 3. Map matching
**Temuan awal:** UI menyebut HMM/Viterbi, sedangkan fungsi hanya memilih segmen terdekat per titik.
**Perbaikan:** fungsi kini membentuk kandidat proyeksi, menghitung skor emisi berbasis jarak GPS, menghitung skor transisi dari selisih jarak teramati dan jarak STA, lalu menggunakan Viterbi untuk memilih jalur pada satu geometri ruas. Skor kecocokan tetap heuristik, bukan probabilitas terkalibrasi.
**Batasan:** belum diuji terhadap lintasan lapangan nyata, jaringan multi-ruas, persimpangan, atau geometri yang rusak/bercabang.

### 4. Status anomali
**Temuan awal:** lonjakan kecepatan bisa memberi alasan anomali tanpa mengaktifkan flag.
**Perbaikan:** flag anomali ikut aktif saat lonjakan kecepatan terdeteksi; nama metrik diubah dari “anomali diperbaiki” menjadi “anomali terdeteksi”.

### 5. Impor foto
**Temuan awal:** STA dan koordinat ditetapkan acak.
**Perbaikan:** nilai acak dihapus, nilai awal diberi catatan perlu verifikasi, validasi tipe gambar/ukuran maksimum 15 MB dan kegagalan pembacaan ditambahkan.
**Batasan:** EXIF/GPS otomatis belum diimplementasikan; STA dan koordinat sementara tidak boleh dianggap valid untuk analisis teknis.

### 6. Penyimpanan lokal
**Temuan awal:** data URL foto disimpan di localStorage, yang memiliki kuota kecil; antrean juga menyimpan payload foto besar.
**Perbaikan:** foto kini disimpan di IndexedDB dengan migrasi dari cache localStorage lama; antrean sinkronisasi hanya menyimpan metadata foto, bukan bytes gambar. Antrean tetap di localStorage dan masih memiliki batas kapasitas serta belum memiliki backend.
**Batasan:** pengujian kuota penuh, browser privat, dan pemulihan data perlu diperluas.

### 7. Pengesahan laporan
**Temuan awal:** PDF berisi nama pejabat, NIP, dan kode lisensi hard-coded, serta status cloud/HMM yang belum terbukti.
**Perbaikan:** identitas pengesah diganti dengan status belum ditentukan/draf; status cloud dan metode map matching disesuaikan dengan implementasi.

### 8. Dependensi/build
**Temuan awal:** instalasi npm gagal karena versi esbuild tidak sesuai peer requirement Vite 8.3.
**Perbaikan:** esbuild diperbarui ke `^0.28.0`, dependensi yang tidak dipakai di kode dihapus/dipindah ke dev dependencies, dan Vite config memakai resolusi path ESM.
**Validasi terdahulu:** run CI `38768831165` berhasil untuk instalasi, TypeScript check, tes unit, dan production build. Perubahan HMM/Viterbi dan IndexedDB terbaru perlu divalidasi ulang.

## Pekerjaan berikutnya

1. Jalankan ulang lint, tes, dan build pada perubahan terbaru.
2. Perluas pengujian map matching untuk hairpin, segmen degenerat, timestamp invalid, dan kandidat jaringan.
3. Implementasikan pembacaan EXIF/GPS serta koreksi STA/koordinat yang eksplisit.
4. Rancang backend sinkronisasi dengan acknowledgement, retry, dan idempotensi.
5. Hubungkan GEE/AI melalui konfigurasi aman jika layanan tersebut memang diperlukan.
6. Uji hasil ekspor dan perhitungan terhadap data jalan nyata serta aturan PKRMS.

## Batas audit

CI memeriksa tipe, tes yang ada, dan keberhasilan build. CI tidak membuktikan kebenaran survei, kesesuaian PKRMS, keamanan operasional, performa skala besar, atau keandalan sinkronisasi jaringan.
