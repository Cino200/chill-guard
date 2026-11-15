PROYEK ANDROID STUDIO - CHILL GUARD (WebView + scan barcode)

Cara membuka:
  1. Android Studio > File > Open > pilih folder ini (ChillGuardApp).
  2. Tunggu "Gradle sync" selesai (butuh internet pertama kali; Android Studio akan
     mengunduh Gradle 8.7 dan library sendiri). Jika diminta, setujui "Install missing SDK".
  3. Build > Generate App Bundles or APKs > Generate APKs, lalu klik "locate".
     Hasil: app\build\outputs\apk\debug\app-debug.apk
  4. Salin hasilnya ke  ..\chillguard.apk

Catatan: gradlew/gradle-wrapper.jar tidak disertakan. Gunakan menu Android Studio (langkah 3).
Jika versi AGP/Gradle ditolak karena Android Studio Anda lebih lama, gunakan Android Studio terbaru
atau ubah versi plugin di build.gradle.kts sesuai saran "Android Gradle Plugin Update Assistant".
