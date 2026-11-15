package com.chillguard.app;

import android.annotation.SuppressLint;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanOptions;

import org.json.JSONObject;

/**
 * Chill Guard - aplikasi Android (WebView).
 * Memuat website Chill Guard dari server portable di laptop (satu server, satu database).
 * Fitur tambahan native: scan barcode/QR (ZXing) dan layar pengaturan alamat server.
 */
public class MainActivity extends AppCompatActivity {

    private static final String NAMA_PREF = "chillguard";
    private static final String KUNCI_ALAMAT = "alamat_server";
    // IP bawaan Windows Mobile Hotspot. Ubah lewat dialog "Atur Server" sesuai IP laptop.
    private static final String ALAMAT_BAWAAN = "http://192.168.137.1:8080/";

    private WebView webView;
    private ValueCallback<Uri[]> callbackPilihFile;
    private boolean dialogGagalTampil = false;

    // Pemindai barcode/QR
    private final ActivityResultLauncher<ScanOptions> pemindai =
            registerForActivityResult(new ScanContract(), hasil -> {
                if (hasil.getContents() != null) {
                    kirimHasilScanKeWeb(hasil.getContents());
                }
            });

    // Pemilih foto (untuk <input type="file"> di form Tambah Makanan)
    private final ActivityResultLauncher<String> pemilihFoto =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (callbackPilihFile != null) {
                    callbackPilihFile.onReceiveValue(uri != null ? new Uri[]{uri} : null);
                    callbackPilihFile = null;
                }
            });

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        // Android 15+ menggambar di bawah status bar; beri jarak agar konten tidak tertutup
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            Insets batas = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
            v.setPadding(batas.left, batas.top, batas.right, batas.bottom);
            return insets;
        });

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false); // agar alarm bisa berbunyi

        webView.addJavascriptInterface(new JembatanAndroid(), "AndroidApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    tampilkanDialogGagal();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (callbackPilihFile != null) {
                    callbackPilihFile.onReceiveValue(null);
                }
                callbackPilihFile = callback;
                pemilihFoto.launch("image/*");
                return true;
            }
        });

        // Tombol Back: mundur di halaman web dulu, baru keluar aplikasi
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        muatServer();
    }

    // ---------------------------------------------------------------- server

    private String ambilAlamat() {
        return getSharedPreferences(NAMA_PREF, MODE_PRIVATE).getString(KUNCI_ALAMAT, ALAMAT_BAWAAN);
    }

    private void simpanAlamat(String alamat) {
        String bersih = alamat.trim();
        if (!bersih.startsWith("http://") && !bersih.startsWith("https://")) {
            bersih = "http://" + bersih;
        }
        if (!bersih.endsWith("/")) {
            bersih = bersih + "/";
        }
        getSharedPreferences(NAMA_PREF, MODE_PRIVATE).edit().putString(KUNCI_ALAMAT, bersih).apply();
    }

    private void muatServer() {
        webView.loadUrl(ambilAlamat());
    }

    private void tampilkanDialogPengaturan() {
        EditText isian = new EditText(this);
        isian.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        isian.setText(ambilAlamat());

        new AlertDialog.Builder(this)
                .setTitle("Alamat Server Chill Guard")
                .setMessage("Isi alamat laptop server, contoh: http://192.168.137.1:8080/")
                .setView(isian)
                .setPositiveButton("Simpan", (d, w) -> {
                    simpanAlamat(isian.getText().toString());
                    muatServer();
                })
                .setNegativeButton("Batal", null)
                .show();
    }

    private void tampilkanDialogGagal() {
        if (isFinishing() || dialogGagalTampil) {
            return;
        }
        dialogGagalTampil = true;
        new AlertDialog.Builder(this)
                .setTitle("Tidak dapat terhubung ke server")
                .setMessage("Pastikan:\n1. start.bat sudah dijalankan di laptop\n"
                        + "2. HP dan laptop memakai hotspot/Wi-Fi yang sama\n"
                        + "3. Alamat server benar:\n" + ambilAlamat())
                .setPositiveButton("Coba Lagi", (d, w) -> muatServer())
                .setNegativeButton("Atur Server", (d, w) -> tampilkanDialogPengaturan())
                .setOnDismissListener(d -> dialogGagalTampil = false)
                .show();
    }

    // ------------------------------------------------------------------ scan

    private void kirimHasilScanKeWeb(String kode) {
        // JSONObject.quote memberi tanda kutip dan meloloskan karakter khusus
        String js = "if (window.onBarcodeScanned) { onBarcodeScanned(" + JSONObject.quote(kode) + "); }";
        webView.evaluateJavascript(js, null);
    }

    /** Dipanggil dari JavaScript web: AndroidApp.scanBarcode() dan AndroidApp.bukaPengaturan() */
    private class JembatanAndroid {
        @JavascriptInterface
        public void scanBarcode() {
            runOnUiThread(() -> {
                ScanOptions opsi = new ScanOptions();
                opsi.setPrompt("Arahkan kamera ke barcode atau QR pada kemasan");
                opsi.setBeepEnabled(true);
                opsi.setOrientationLocked(false);
                pemindai.launch(opsi);
            });
        }

        @JavascriptInterface
        public void bukaPengaturan() {
            runOnUiThread(MainActivity.this::tampilkanDialogPengaturan);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
