# Vibe Coding API

Proyek ini adalah sistem *backend* REST API sederhana namun kokoh, dirancang untuk menangani fungsionalitas Autentikasi Pengguna (Registrasi, Login, Manajemen Sesi, dan Profil). Proyek ini dibangun dengan fokus pada eksekusi tinggi menggunakan teknologi *modern* dari ekosistem **Bun**.

---

## 🛠️ Technology Stack & Library

Aplikasi ini ditenagai oleh kombinasi tumpukan teknologi berikut:
- **[Bun](https://bun.sh/)** - Runtime JavaScript canggih, bundler, test runner, sekaligus package manager yang terintegrasi.
- **[ElysiaJS](https://elysiajs.com/)** - *Web framework* ergonomis berkecepatan tinggi khusus untuk lingkungan Bun.
- **[Drizzle ORM](https://orm.drizzle.team/)** - *Headless Object Relational Mapper* (ORM) Type-safe berbasis TypeScript.
- **[MySQL2](https://www.npmjs.com/package/mysql2)** - Driver asli yang stabil untuk koneksi database MySQL.
- **TypeBox** - Pustaka validasi yang sudah diintegrasikan langsung ke dalam *Route* ElysiaJS untuk pengetatan validasi *Request Payload*.

---

## 📂 Arsitektur & Struktur Direktori

Aplikasi ini menggunakan pola **Service-Route Architecture** atau **Controller-Service Architecture**. Struktur ini dengan teguh memisahkan *Endpoint/Routing* dengan *Business Logic* agar rapi dan mudah di-maintanance.

### Hirarki Folder
```
📦 vibe-coding
├── 📂 src
│   ├── 📄 index.ts               # Entry point (Inisialisasi aplikasi ElysiaJS)
│   ├── 📂 db
│   │   ├── 📄 index.ts           # Koneksi instans Drizzle ORM
│   │   └── 📂 schema             # Berisi definisi model struktur tabel database
│   ├── 📂 routes                 # Mendefinisikan rute/endpoint (Elysia Handler & Validation)
│   └── 📂 services               # Memuat logika bisnis utama aplikasi (Database query, Hashing)
├── 📂 tests                      # Kumpulan skenario Unit Testing lengkap (bun test)
├── 📄 package.json               # Konfigurasi dependensi dan scripts eksekusi
└── 📄 README.md                  # Dokumentasi proyek
```

### Konvensi Penamaan (File Naming Conventions)
- **Routes:**  Menggunakan sufiks `-route.ts` (Contoh: `users-route.ts`).
- **Services:** Menggunakan sufiks `-service.ts` (Contoh: `users-service.ts`).
- **Skema Database:** Menggunakan bentuk jamak dari nama tabel (Contoh: `users.ts`, `sessions.ts`).
- **Pengujian:** Menggunakan sufiks `.test.ts` (Contoh: `auth.test.ts`, `user.test.ts`).

---

## 💾 Database Schema

Aplikasi berjalan menggunakan RDBMS **MySQL**. Database ini memiliki dua tabel relasional utama:

### 1. `users`
Menyimpan identitas pengguna.
- `id` (INT) - Primary Key, Auto Increment
- `name` (VARCHAR 255)
- `email` (VARCHAR 255) - UNIQUE Index
- `password` (VARCHAR 255) - Hash menggunakan *Bcrypt*
- `created_at` (TIMESTAMP)

### 2. `sessions`
Mencatat sesi aktif dari pengguna (berbasis token UUID).
- `id` (INT) - Primary Key, Auto Increment
- `token` (VARCHAR 255) - Token UUID untuk autentikasi API
- `user_id` (INT) - Foreign Key menuju `users.id`
- `created_at` (TIMESTAMP)

*(Relasi: Satu `User` dapat memiliki banyak `Session` aktif di berbagai perangkat).*

---

## 🌐 Dokumentasi API Tersedia

Semua permintaan (Req) dan tanggapan (Res) menggunakan `Content-Type: application/json`. Skema registrasi dan login masing-masing diberikan proteksi `maxLength: 255` di root API, lalu mengembalikan *Unprocessable Entity HTTP 422* jika standar validasi dilanggar.

### 1. Registrasi Pengguna
- **Endpoint:** `POST /api/users`
- **Tujuan:** Membuat akun pengguna baru.
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "mysecurepassword"
  }
  ```
- **Responses:**
  - `200 OK` - Berhasil (`{ "data": "OK" }`).
  - `400 Bad Request` - Email sudah terdaftar.
  - `422 Unprocessable Content` - Kegagalan validasi.

### 2. Login
- **Endpoint:** `POST /api/login`
- **Tujuan:** Autentikasi dan menghasilkan token untuk header otorisasi sesi.
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "mysecurepassword"
  }
  ```
- **Responses:**
  - `200 OK` - Berhasil mengembalikan UUID Token (`{ "data": "b2f6...uuid...e5f3" }`).
  - `401 Unauthorized` - Email atau password salah.

### 3. Dapatkan Pengguna Saat Ini (Current User)
- **Endpoint:** `GET /api/users/current`
- **Tujuan:** Melihat informasi profil *current user*.
- **Headers:** `Authorization: Bearer <token_aktif>`
- **Responses:**
  - `200 OK` - Berhasil (`{ "data": { "id": 1, "name": "John Doe", "email": "..." } }`). Password selalu dirahasiakan API.
  - `401 Unauthorized` - Jika tidak membawa header otorisasi, atau jika sesi telah mati.

### 4. Logout Pengguna
- **Endpoint:** `DELETE /api/users/logout`
- **Tujuan:** Menghentikan token otorisasi atau mencabut sesi terkait agar lenyap dari Database.
- **Headers:** `Authorization: Bearer <token_aktif>`
- **Responses:**
  - `200 OK` - Berhasil logout (`{ "data": "OK" }`).
  - `401 Unauthorized` - Token tidak disisipkan / sudah kedaluwarsa.

---

## ⚙️ Cara Setup Project (Mulai Di Komputer Anda)

1. **Prasyarat Sistem:** Pastikan di komputer Anda terpasang [Bun](https://bun.sh/) dan **MySQL Server**.
2. **Kloning Proyek & Install Dependensi:**
   ```bash
   bun install
   ```
3. **Konfigurasi Lingkungan:**  
   Buat salinan file `.env`. (Buat dengan format kredensial Database Anda).
   ```bash
   DATABASE_URL="mysql://root:password@localhost:3306/nama_database_kamu"
   ```
4. **Push Struktur Database (Migrasi Drizzle):**
   *(Drizzle Kit akan otomatis membuat dan melink-kan ulang basis tabel MySQL ke schema milik codebase).*
   ```bash
   bun run db:push
   ```

---

## 🚀 Menjalankan Aplikasi

Jalankan perintah ini untuk meluncurkan Server Mode Pengembangan (*Live-reload*):
```bash
bun run dev
```
Aplikasi secara aktif akan merespon pada url http://localhost:3000. Untuk melihat dan melakukan introgasi interaktif GUI Database milik Drizzle:
```bash
bun run db:studio
```

---

## 🧪 Cara Test Aplikasi

Siklus Proyek ini sudah dilengkapi dengan kerangka uji (*Testing Suite*) 100% menggunakan `bun test` bawaan Bun untuk efisiensi instan. Skenario meng-cover tes endpoint, *Unit Testing*, dan uji proteksi keamanan manipulasi String hingga tes pembersihan.

Untuk menjalankan seluruh *skenario unit testing*:
```bash
bun test
```
*Note: Test Suite sengaja dikonfigurasikan agar merestart / mem-wipe table lokal database Anda otomatis sebelum skenario tes diluncurkan.*
