# Fitur: Logout User & Penghapusan Sesi

Fitur ini bertujuan untuk membuat API endpoint yang bisa melakukan log out pengguna saat ini. Proses log out dilakukan dengan menghapus token yang valid (dari header HTTP) dari database, sehingga sesi tersebut tidak bisa digunakan lagi.

## 1. Definisi API
Buat endpoint API untuk melakukan proses logout user.

**Endpoint:** `DELETE /api/users/logout`

**Headers Wajib:**
- `Authorization`: Harus memiliki format `Bearer <token_uuid>`

**Response (Success - 200 OK):**
```json
{
    "data": "OK"
}
```
*(Catatan: Jika sesi berhasil dihapus dari tabel `sessions`)*

**Response (Error - 401 Unauthorized):**
```json
{
    "error": "Unauthorized"
}
```
*(Dikembalikan jika header tidak ada, format header salah, atau token tidak valid/tidak ditemukan di database saat akan dihapus).*

## 2. Struktur Folder dan Penamaan File
Lanjutkan arsitektur kode yang sudah ada:
- `src/routes/users-route.ts`: Untuk router ElysiaJS.
- `src/services/users-service.ts`: Untuk logic pencarian dan penghapusan data di database.

---

## 3. Tahapan Implementasi (Langkah Kerja)

Bagi programmer atau AI yang akan mengimplementasikan, ikuti pedoman langkah-langkah detail berikut:

### **Tahap 1: Layer Service (`src/services/users-service.ts`)**
1. Buat fungsi fungsi asynchronous baru, misalnya `export const logoutUser = async (token: string) => { ... }`.
2. **Logika Validasi & Penghapusan:**
   - Ambil dari database saat ini, token disimpan pada tabel `sessions`. *(Meskipun rancangan awal menyebutkan di tabel users, gunakan arsitektur session yang sudah berjalan dari fitur login sebelumnya).*
   - Lakukan query ke database menggunakan Drizzle ORM untuk cek eksistensi atau langsung hapus berdasarkan token.
   - Cara termudah adalah mencari sesi terlebih dahulu:
     ```typescript
     const existingSession = await db
       .select()
       .from(sessions)
       .where(eq(sessions.token, token))
       .limit(1);
       
     if (existingSession.length === 0) {
       throw new Error("Unauthorized");
     }
     ```
   - Jika sesi ditemukan, jalankan perintah hapus:
     ```typescript
     await db.delete(sessions).where(eq(sessions.token, token));
     ```
3. Return response berhasil berupa objek `{"data": "OK"}` sesuai spesifikasi.

### **Tahap 2: Layer Route (`src/routes/users-route.ts`)**
1. Buka konfigurasi Elysia untuk `usersRoute`.
2. Tambahkan handler untuk HTTP method `DELETE` di endpoint `/api/users/logout`.
3. Akses property `headers` dan fungsionalitas `set` dari parameter handler Elysia `({ headers, set }) => { ... }`.
4. **Validasi Header:**
   - Cek apakah `headers.authorization` memiliki nilai `token`. Jika `undefined`, `set.status = 401; return { "error": "Unauthorized" };`.
   - Cek apakah header dimuali dengan prefix `"Bearer "`.
   - Ekstrak token-nya saja dengan melakukan split (misal: `const token = headers.authorization.split(" ")[1];`). Pastikan token valid setelah di-split.
5. Panggil fungsi `await logoutUser(token)` di dalam blok pembungkus `try..catch`.
6. **Error Handling:**
   - Jika service berhasil dipanggil tanpa terlempar error, teruskan nilai kembaliannya.
   - Jika terjadi `catch (error)`, cek apabila pesan error-nya: `"Unauthorized"`. Jika iya, pasang respons HTTP `set.status = 401;` dan kembalikan JSON `{"error": "Unauthorized"}`. Jika error lain (contoh database mati), bisa kembalikan error internal server `500`.

### **Tahap 3: Pengujian Manual**
1. Hidupkan server melalui perintah `bun run dev`.
2. Login kembali dengan me-nge-hit `POST /api/login` untuk mendapatkan token `UUID` segar.
3. Coba kirim `DELETE /api/users/logout` menggunakan klien HTTP favorit Anda (cURL, Postman) dengan memasukkan header `Authorization: Bearer <token_tadi>`.
   - Cek respons apakah kembali HTTP 200 dan `"data": "OK"`.
4. Verifikasi sesi berbunyi dengan mengirim API hit `GET /api/users/current` menggunakan token yang **sama** seperti poin 3. Jika implementasi benar, maka yang sekarang akan me-return `401 Unauthorized` karena token sudah terhapus di langkah ke 3.
