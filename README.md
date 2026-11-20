# ☕ Kopi Mahasiswa — Smart Coffee Shop & POS System with Real-Time AI Barista

Dokumentasi tugas akhir mata kuliah **Rekayasa Perangkat Lunak (RPL)** — Sistem Informasi Pemesanan, Kasir (POS), Manajemen Inventaris, dan Asisten Cerdas AI untuk operasional kafe modern.

---

## 👤 Identitas Pengembang / Mahasiswa

| Keterangan | Detail |
| :--- | :--- |
| **Nama Mahasiswa** | **M. Revandya Wibowo** |
| **NIM** | **41257114** |
| **Kelas / Kelompok** | **TI - 1B - 2025** |
| **Tema Topik Kelompok** | **Kopi Mahasiswa** |
| **Mata Kuliah** | Rekayasa Perangkat Lunak (RPL) |
| **Tahun Akademik** | 2025 / 2026 |

---

## 🎥 Tautan Video Dokumentasi & Demo Aplikasi

Berikut adalah video dokumentasi tahapan progres dan demonstrasi penuh aplikasi:

| No | Tahap Dokumentasi | Tautan Video | Status |
| :---: | 
**Video Final Demo** (Integrasi AI & Pengujian Penuh) | [Link Video Final Demo](https://youtube.com/...) | 🟢 Selesai |

---

## 📖 Deskripsi Aplikasi

**Kopi Mahasiswa** adalah aplikasi web modern berbasis *Full-Stack* yang dirancang untuk mendigitalisasi seluruh rantai operasional kedai kopi — mulai dari pemesanan mandiri oleh pelanggan melalui meja kafe, pemrosesan antrean di meja racik barista (*Kitchen Display System*), transaksi kasir (POS), hingga analitik eksekutif dan manajemen inventaris oleh Admin & Owner.

### 🎨 Desain & Tampilan Visual
- **Tema Visual**: Didesain dengan estetika modern khas kedai kopi premium bernuansa ***Warm Espresso & Cream*** (palet warna kopi hangat, cokelat moka, dan aksen oranye *amber*).
- **Mode Tampilan**: Dilengkapi dukungan **Dark Mode & Light Mode** responsif yang nyaman digunakan baik di lingkungan pencahayaan kafe malam maupun siang hari.
- **Desain Responsif**: Optimal digunakan pada layar ponsel pelanggan (Mobile Web App), tablet kasir/barista, serta layar monitor desktop dashboard admin.

---

## 🌟 Fitur Utama Aplikasi

### 1. 📱 Pemesanan Mandiri & Katalog Interaktif (Customer)
- **Katalog Menu Terkategori**: Navigasi mulus antara menu **Kopi** (Espresso, Latte, Macchiato), **Non-Kopi & Teh** (Matcha, Artisan Chocolate), **Snack & Pastry** (Croissant, Kentang Goreng), serta **Paket Promo Mahasiswa**.
- **Kustomisasi Varian & Topping**: Pelanggan dapat memilih varian (*Hot / Iced*, ukuran *Regular / Large*) dan menambahkan *topping* opsional (*Extra Shot Espresso, Oat Milk, Brown Sugar Boba, Salted Caramel*, dll.).
- **Pemilihan Meja Interaktif**: Integrasi pemilihan nomor meja kafe secara langsung dengan visualisasi status meja (*Available / Occupied*).
- **Keranjang & Checkout Cepat**: Estimasi total belanja otomatis dengan dukungan kode promo/voucher mahasiswa.
- **Pelacakan Status Pesanan Real-Time**: Status pesanan live (`WAITING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`).

### 2. 🤖 Integrasi AI Real-Time (Barista AI & Admin AI)
- **Barista AI Chatbot (Sisi Pelanggan)**:
  - Memberikan rekomendasi menu kopi berdasarkan preferensi rasa pelanggan (manis, pahit, *creamy*, hemat).
  - Memberikan informasi ketersediaan meja kosong secara real-time langsung dari database.
- **Admin AI Assistant (Sisi Dashboard)**:
  - Terhubung langsung dengan database operasional (*Live DB Snapshot*).
  - Menjawab pertanyaan analitik bisnis secara presisi (*ultra-concise*): omset hari ini, omset 7 hari/30 hari, rincian pesanan, kopi/menu paling laku, stok bahan baku menipis, hingga jumlah user/pelanggan.
- **🎛️ Multi-Model AI Engine Switcher (Pengaturan AI Admin)**:
  - Admin dapat mengganti model kecerdasan buatan aktif secara instan langsung dari antarmuka web tanpa *restart* server:
    * ⚡ **Google Gemini** (Gemini 2.0 Flash / Gemini 1.5 Flash)
    * 🧠 **OpenAI GPT** (GPT-4o / GPT-4o-mini)
    * 🚀 **DeepSeek AI** (DeepSeek V3 / R1)
    * 🛡️ **Xkiro AI Gateway** (Mistral Small / Cohere Command A+)
  - Dilengkapi fitur pengujian koneksi (*API Key Live Testing*) dan enkripsi penyimpanan key.

### 3. 🧑‍🍳 Kitchen Display System (Barista)
- Antrean tiket pesanan racikan dapur real-time.
- Pemisahan status tiket *In-Progress* dan *Ready to Serve*.
- Otomatis memotong stok bahan baku berdasarkan resep (*Bill of Materials - BOM*).

### 4. 💵 Point of Sale / Kasir (Cashier)
- Penerimaan pesanan walk-in dan meja.
- Verifikasi pembayaran metode **Tunai** maupun **QRIS**.
- Cetak struk belanja digital.

### 5. 📦 Manajemen Bahan Baku, Resep & Inventaris (Admin)
- Pencatatan master bahan baku dengan satuan takaran (*gram, ml, pcs*).
- Indikator peringatan stok kritis (*Low Stock Alert*).
- Formula resep per menu (BOM) untuk pemotongan stok otomatis presisi.
- Log transaksi mutasi stok (*IN, OUT, ADJUSTMENT*).

### 6. 📊 Dashboard Analitik Bisnis & RBAC (Owner & Admin)
- Grafik tren penjualan, omset, dan volume transaksi.
- Ranking produk terlaris (*Best Seller*).
- **Role-Based Access Control (RBAC)** 5 Tingkat:
  1. `Admin`: Akses penuh konfigurasi sistem, menu, bahan baku, dan AI.
  2. `Owner`: Pemantauan eksekutif metrik keuangan dan audit log.
  3. `Cashier`: Transaksi POS dan validasi pembayaran.
  4. `Barista`: Operasional racik pesanan di dapur.
  5. `Customer`: Pemesanan mandiri dan riwayat transaksi.

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

| Lapisan (Layer) | Teknologi yang Digunakan |
| :--- | :--- |
| **Framework Utama** | [Next.js 14](https://nextjs.org/) (React 18, App Router Architecture) |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) dengan palet kustom *Warm Espresso* |
| **Komponen & Ikon** | [Lucide React](https://lucide.dev/), Headless UI, Framer Motion |
| **Database ORM** | [Prisma ORM](https://www.prisma.io/) |
| **Database Engine** | [SQLite](https://www.sqlite.org/) (Default dev) / [MySQL](https://www.mysql.com/) (Production ready) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Autentikasi & Keamanan** | JWT (JSON Web Tokens), Bcrypt password hashing, Cookie session |
| **AI Integration** | Google GenAI SDK (`@google/genai`), OpenAI REST API, Nous Research / Xkiro Gateway |

---

## 💻 Petunjuk Instalasi & Menjalankan Aplikasi (Setup Instruction)

Ikuti langkah-langkah di bawah ini secara berurutan untuk menjalankan proyek di komputer lokal:

### 1. Prasyarat Sistem
Pastikan telah terinstal:
- **Node.js** versi `18.x` atau yang lebih baru ([Unduh Node.js](https://nodejs.org/))
- **npm** (bawaan Node.js) atau **pnpm** / **yarn**
- **Git** ([Unduh Git](https://git-scm.com/))

### 2. Kloning Repository
Buka terminal / PowerShell dan jalankan perintah:
```bash
git clone https://github.com/evn-com/proyek-rpl-kopi-mahasiswa.git
cd proyek-rpl-kopi-mahasiswa
```

### 3. Instal Dependensi Proyek
Instal seluruh paket dependensi yang dibutuhkan:
```bash
npm install
```

### 4. Konfigurasi Environment Variable (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
# Windows (PowerShell / Command Prompt)
copy .env.example .env

# Linux / macOS / Git Bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan nilai konfigurasinya:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="kopi-mahasiswa-secret-key-rpl-2025"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# (Opsional) Kunci API Model AI
GEMINI_API_KEY=""
OPENAI_API_KEY=""
DEEPSEEK_API_KEY=""
XKIRO_API_KEY=""
```

> [!NOTE]
> Jika Anda belum memiliki API Key eksternal, aplikasi tetap dapat berjalan normal karena dilengkapi **Deterministic & Simulation Fallback Engine** cerdas bawaan. Anda juga dapat memasukkan API Key kapan saja melalui menu **Admin ➔ Pengaturan Model AI**.

### 5. Migrasi & Sinkronisasi Database
Jalankan migrasi skema database Prisma:
```bash
npx prisma db push
```

*(Opsional) Isi data awal (seed) produk, meja, bahan baku, dan user bawaan:*
```bash
npm run db:seed
```

### 6. Jalankan Server Pengembangan (Dev Server)
Mulai server pengembangan lokal:
```bash
npm run dev
```

Buka peramban (browser) dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Akun Demo Pengujian (Default Credentials)

Untuk mempermudah pengujian seluruh peran pengguna (RBAC), gunakan kredensial berikut:

| Role / Peran | Email | Kata Sandi (Password) | Halaman Utama |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@kopimahasiswa.id` | `admin123` | `/admin` |
| **Owner** | `owner@kopimahasiswa.id` | `owner123` | `/owner` |
| **Kasir (Cashier)** | `cashier@kopimahasiswa.id` | `cashier123` | `/cashier` |
| **Barista** | `barista@kopimahasiswa.id` | `barista123` | `/barista` |
| **Customer** | `customer@kopimahasiswa.id` | `customer123` | `/menu` |

---

## 📁 Struktur Direktori Proyek

```text
├── prisma/
│   ├── schema.prisma       # Skema database relasional (User, Order, Product, Inventory, dll)
│   ├── seed.ts             # Script seed data awal kafe
│   └── dev.db              # Database SQLite lokal
├── public/                 # Asset statis, gambar produk, dan ikon
├── src/
│   ├── app/                # App Router Next.js 14
│   │   ├── (auth)/         # Halaman Login & Registrasi
│   │   ├── admin/          # Dashboard Admin, POS, Inventaris & Pengaturan AI
│   │   ├── barista/        # Kitchen Display System (KDS)
│   │   ├── cashier/        # Antarmuka Kasir POS & Pembayaran
│   │   ├── owner/          # Dashboard Analitik Eksekutif Owner
│   │   ├── menu/           # Halaman Katalog Pemesanan Pelanggan
│   │   ├── api/            # Route Handlers REST API & AI Chatbot
│   │   └── layout.tsx      # Root Layout dengan Theme Provider
│   ├── components/         # Komponen UI modular (Navbar, Modal, Card, AI Widget)
│   ├── lib/                # Konfigurasi Prisma, AI Engine, Autentikasi, Utilities
│   └── types/              # Definisi TypeScript interface & types
├── .env.example            # Template variabel lingkungan
├── package.json            # Daftar dependensi & script proyek
└── README.md               # Dokumentasi utama proyek
```

---

## 📄 Lisensi & Hak Cipta

Proyek ini dikembangkan sebagai karya tugas mata kuliah **Rekayasa Perangkat Lunak (RPL)** Program Studi Teknik Informatika, Tahun 2025/2026.

**© 2026 M. Revandya Wibowo — Kopi Mahasiswa.**
