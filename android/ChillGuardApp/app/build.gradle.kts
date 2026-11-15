plugins {
    id("com.android.application")
}

android {
    namespace = "com.chillguard.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.chillguard.app"
        minSdk = 26            // Android 8.0 (sesuai SRS)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity:1.8.2")
    implementation("androidx.core:core:1.12.0")
    // Scan barcode/QR
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")
}
