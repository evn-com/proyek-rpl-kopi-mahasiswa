# 🤖 DOKUMENTASI SISTEM AI CHATBOT — KOPI MAHASISWA

## 1. PENGENALAN SISTEM

AI Chatbot Kopi Mahasiswa merupakan sistem asisten kecerdasan buatan yang terintegrasi langsung dengan aplikasi Kopi Mahasiswa.

Sistem ini dirancang untuk membantu setiap pengguna menjalankan aktivitas berdasarkan peran (*Role-Based Access Control / RBAC*).

Berbeda dengan chatbot biasa yang hanya menjawab pertanyaan umum, chatbot ini memiliki akses terhadap konteks data operasional aplikasi sesuai dengan role pengguna.

### Tujuan Utama:
- Membantu pekerjaan operasional.
- Menyediakan informasi berdasarkan database aplikasi.
- Mempermudah pencarian data.
- Memberikan analisis dan ringkasan aktivitas.
- Membantu pengambilan keputusan.
- Mengurangi kebutuhan pencarian data secara manual.

---

## 2. ARSITEKTUR SISTEM

Sistem menggunakan pendekatan **AI Assistant berbasis role** (*Role-Aware & Context-Aware AI*).

### Teknologi Utama:
- **Backend**: Next.js & PHP Native API Service.
- **Database**: MySQL (Prisma ORM & PDO).
- **Environment**: Laragon / Node.js.
- **AI Service**: Integrasi model AI melalui REST API (Google Gemini, OpenAI GPT, DeepSeek, xKiro/Nous Research).
- **Model/Provider**: Konfigurasi multi-model AI switcher.
- **Autentikasi**: JWT Token & Session Auth.
- **Keamanan**: Role-Based Access Control (RBAC).
- **Konteks AI**: Data operasional riil yang diekstrak aman dari database sesuai hak akses.

### Alur Kerja Chatbot (9 Langkah):
1. Pengguna login ke aplikasi.
2. Sistem mengidentifikasi identitas dan role pengguna.
3. Pengguna membuka chatbot.
4. Pertanyaan dikirim ke endpoint AI sesuai role.
5. Backend memeriksa autentikasi dan hak akses.
6. Sistem mengambil konteks data yang relevan dari database.
7. Konteks dan pertanyaan dikirim ke AI Service.
8. AI memproses informasi dan menghasilkan jawaban.
9. Jawaban dikirim kembali ke pengguna.

> **Prinsip Utama**: AI tidak diberikan akses bebas terhadap seluruh database. Backend menentukan data yang boleh digunakan berdasarkan role dan batasan akses (*Backend-enforced Least Privilege*).

---

## 3. LIMA AI CHATBOT BERDASARKAN ROLE

### A. ADMIN AI ASSISTANT
- **Fokus**: Pengelolaan dan pengawasan sistem kafe menyeluruh.
- **Kemampuan**:
  - Memahami informasi pelanggan & membership.
  - Melihat konteks pesanan pelanggan.
  - Membantu pencarian informasi pesanan.
  - Memberikan ringkasan informasi operasional toko.
  - Membantu memahami aktivitas pengelolaan produk dan pelanggan.
  - Membedakan pesanan pelanggan dengan Purchase Order supplier.
- **Konteks Data**: Data pelanggan, informasi pesanan, data operasional admin, informasi katalog produk.
- **Contoh Pertanyaan**:
  - *"Siapa pelanggan yang melakukan pemesanan?"*
  - *"Bagaimana ringkasan pesanan pelanggan?"*
  - *"Apa perbedaan pesanan Customer dan Purchase Order?"*
  - *"Bantu jelaskan kondisi operasional toko."*

### B. CUSTOMER AI ASSISTANT
- **Fokus**: Asisten belanja pribadi pelanggan (*Personal Shopping Concierge*).
- **Kemampuan**:
  - Memahami informasi akun Customer yang sedang login.
  - Menampilkan konteks pesanan milik Customer tersebut.
  - Membantu mencari informasi status pesanan meja.
  - Memahami detail transaksi pelanggan.
  - Membantu memberikan rekomendasi dan informasi produk.
  - Memberikan informasi berdasarkan keranjang belanja aktif.
  - Menyediakan ringkasan aktivitas belanja dan poin loyalitas pelanggan.
- **Konteks Data**: Identitas Customer login, pesanan aktif & riwayat, keranjang belanja, katalog menu, saldo poin loyalitas.
- **Keamanan**: Konteks pesanan dibatasi secara ketat berdasarkan identitas Customer yang login (isolasi data pelanggan).
- **Contoh Pertanyaan**:
  - *"Bagaimana status pesanan saya?"*
  - *"Apa saja produk dalam keranjang saya?"*
  - *"Produk apa saja yang tersedia?"*
  - *"Tolong jelaskan riwayat pesanan saya."*

### C. KASIR AI ASSISTANT
- **Fokus**: Membantu pekerjaan kasir dan aktivitas transaksi POS.
- **Kemampuan**:
  - Membantu memahami informasi operasional kasir.
  - Memberikan ringkasan informasi dashboard transaksi.
  - Membantu memahami aktivitas transaksi masuk & metode pembayaran.
  - Menjawab pertanyaan berdasarkan konteks yang disediakan backend.
  - Membantu kasir memahami informasi antrean pesanan dan aktivitas penjualan.
- **Keamanan**: Menggunakan pemeriksaan permission `use_kasir_ai`. Akses dibatasi berdasarkan autentikasi dan hak akses Kasir.
- **Contoh Pertanyaan**:
  - *"Bagaimana ringkasan aktivitas penjualan hari ini?"*
  - *"Berapa jumlah transaksi yang tercatat?"*
  - *"Apa saja informasi operasional yang perlu saya perhatikan?"*

### D. SUPPLIER AI ASSISTANT
- **Fokus**: Membantu pengelolaan informasi supplier dan pengadaan barang/bahan baku.
- **Kemampuan**:
  - Memahami profil informasi supplier.
  - Membantu melihat Purchase Order (PO).
  - Memberikan ringkasan informasi pengadaan bahan baku.
  - Membantu memahami status Purchase Order (Draft, Approved, In Transit, Received).
  - Menampilkan informasi PO terbaru.
  - Membantu mencari detail pengadaan.
- **Konteks Data**: Identitas supplier, `supplier_id` milik pengguna yang login, Purchase Order terkait, detail item PO.
- **Keamanan**: Konteks supplier dibatasi ketat berdasarkan `supplier_id`. Supplier tidak boleh melihat data pengadaan milik supplier lain (`use_supplier_ai`).
- **Contoh Pertanyaan**:
  - *"Berapa Purchase Order yang saya miliki?"*
  - *"Bagaimana status PO terbaru?"*
  - *"Tampilkan ringkasan pengadaan bahan baku."*
  - *"Apa saja detail PO saya?"*

### E. OWNER AI ASSISTANT
- **Fokus**: Asisten analisis bisnis eksekutif dan pengawasan usaha (*Executive Business Intelligence*).
- **Kemampuan**:
  - Menganalisis ringkasan penjualan dan tren omzet.
  - Menampilkan total omzet dari transaksi selesai.
  - Membantu memahami volume transaksi.
  - Menampilkan ranking produk terlaris (*Best Seller*).
  - Membantu memantau stok bahan baku kritis (*Low Stock Alert*).
  - Menampilkan informasi Purchase Order pengadaan barang.
  - Membedakan aktivitas penjualan Customer dengan aktivitas pengadaan supplier.
- **Konteks Data**: Total omzet harian/bulanan, jumlah transaksi selesai, ranking produk, stok menipis/habis, ringkasan dan detail Purchase Order terbaru.
- **Contoh Pertanyaan**:
  - *"Berapa omzet toko hari ini?"*
  - *"Produk apa yang paling laris?"*
  - *"Produk apa yang stoknya menipis atau habis?"*
  - *"Bagaimana kondisi pengadaan barang?"*
  - *"Berapa total nilai Purchase Order?"*
  - *"Berikan ringkasan kondisi bisnis terkini."*

---

## 4. KEMAMPUAN DAN SKILL INTI SISTEM

| Skill | Fungsi |
|---|---|
| **Context Awareness** | Memahami konteks data pengguna secara spesifik |
| **Role Awareness** | Menyesuaikan gaya dan konten jawaban berdasarkan role pengguna |
| **Database Context Retrieval** | Mengambil informasi relevan dari database melalui backend yang aman |
| **Business Intelligence** | Membantu memahami kondisi dan performa bisnis secara analitis |
| **Sales Analysis** | Menganalisis ringkasan penjualan, transaksi, dan omzet |
| **Product Intelligence** | Memahami informasi katalog, resep, dan performa produk |
| **Order Intelligence** | Memahami status dan detail pesanan pelanggan |
| **Procurement Intelligence** | Memahami Purchase Order dan pengadaan bahan baku supplier |
| **Inventory Awareness** | Memahami kondisi stok riil, batas minimum, dan audit mutasi |
| **Personalized Assistance** | Memberikan jawaban yang dipersonalisasi sesuai profil pengguna |
| **Natural Language Understanding** | Memahami pertanyaan menggunakan bahasa sehari-hari secara fleksibel |
| **Contextual Response** | Menyusun jawaban terstruktur berdasarkan data faktual yang diberikan |

*Catatan: Pengelompokan skill di atas merupakan dokumentasi kemampuan sistem, bukan daftar tool AI terpisah yang semuanya dapat dieksekusi secara mandiri.*

---

## 5. KEAMANAN SISTEM

Sistem menerapkan 6 lapisan pengamanan (*Six-Tier Security Architecture*):

1. **Session & Token Authentication**: Memastikan pengguna telah terautentikasi (login) secara sah sebelum memproses query.
2. **Role-Based Access Control (RBAC)**: Memastikan endpoint chatbot hanya dapat diakses sesuai hak peran pengguna.
3. **Permission Checking**: Memeriksa izin spesifik (misal `use_kasir_ai`, `use_supplier_ai`) pada role yang memerlukannya.
4. **User Data Isolation**: Mengisolasi konteks data sehingga pengguna (seperti Customer dan Supplier) hanya dapat mengakses datanya sendiri.
5. **Backend Data Filtering**: Backend memfilter dan membersihkan data sensitif (seperti password hash, data finansial rahasia) sebelum dikirim ke AI.
6. **Backend Database Query (Zero Free-SQL Access)**: Pengambilan data dilakukan melalui skema query backend yang teruji, tanpa pernah memberikan akses eksekusi raw SQL bebas kepada model AI.

---

## 6. STRUKTUR IMPLEMENTASI

### Endpoint AI Berdasarkan Role:
- `admin/ai_api.php` atau `/api/ai/admin-chat`
- `customer/ai_api.php` atau `/api/ai/customer-chat`
- `kasir/ai_api.php` atau `/api/ai/cashier-chat`
- `supplier/ai_api.php` atau `/api/ai/supplier-chat`
- `owner/ai_api.php` atau `/api/ai/owner-chat`

### Layanan AI Bersama (*Shared AI Service*):
- `includes/ai_service.php` atau `src/lib/ai/`
- Menangani komunikasi dengan model AI (Gemini, GPT, DeepSeek, Nous Research/xKiro).

---

## 7. STATUS PENGEMBANGAN DAN PENGUJIAN

Kelima chatbot telah melalui pemeriksaan kode dan pengujian fungsional:
- **Admin**: Teruji pada konteks data pelanggan dan pesanan.
- **Customer**: Teruji pada konteks pesanan, keranjang, dan katalog milik pengguna.
- **Kasir**: Teruji pada pemeriksaan permission dan ringkasan dashboard.
- **Supplier**: Teruji pada isolasi data supplier dan informasi PO.
- **Owner**: Teruji pada ringkasan omzet, produk terlaris, stok kritis, dan PO.

---

## 8. KEUNGGULAN SISTEM

- **One Application, Five Specialized AI Assistants**: Satu aplikasi kafe dilengkapi 5 asisten AI dengan spesialisasi berbeda.
- **Contextual Grounding**: Jawaban berlandaskan data operasional nyata dari database kafe.
- **Data Governance**: Pembatasan data ketat sesuai hak akses masing-masing peran.
- **Analytic Value**: Tidak sekadar chatbot FAQ, melainkan pendukung keputusan bisnis nyata.

---

## 9. PENGEMBANGAN SELANJUTNYA (*Roadmap*)

Potensi fitur di masa depan:
- Pembuatan laporan berkala otomatis via AI.
- Analisis prediksi penjualan (*Predictive Sales Forecasting*).
- Rekomendasi restock otomatis berdasarkan tren penjualan dan lead-time supplier.
- Analisis tren menu dan preferensi pelanggan mahasiswa.
- Integrasi notifikasi proaktif WhatsApp dari asisten AI.
- Dashboard visual insight berbasis AI.

---

## 10. KESIMPULAN

AI Chatbot Kopi Mahasiswa mewujudkan paradigma **"One Application, Five Specialized AI Assistants"**. Setiap asisten memiliki konteks, tujuan, dan batasan akses tersendiri sehingga mampu memberikan bantuan yang relevan, aman, dan efisien untuk operasional kafe modern.
