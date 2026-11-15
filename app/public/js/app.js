/* Chill Guard - skrip halaman: konfirmasi, jembatan Android, scan barcode, live chat. */
(function () {
  'use strict';

  // ---- Konfirmasi sebelum aksi berbahaya (atribut data-konfirmasi) ----
  document.addEventListener('click', function (ev) {
    var tombol = ev.target.closest('[data-konfirmasi]');
    if (tombol && !window.confirm(tombol.getAttribute('data-konfirmasi'))) {
      ev.preventDefault();
    }
  });

  // ---- Aplikasi Android: tautan pengaturan server (hanya tampil di WebView) ----
  var tautanServer = document.getElementById('tautanServer');
  if (tautanServer && window.AndroidApp && window.AndroidApp.bukaPengaturan) {
    tautanServer.hidden = false;
    tautanServer.addEventListener('click', function (e) {
      e.preventDefault();
      window.AndroidApp.bukaPengaturan();
    });
  }

  // ---- Scan barcode (kamera native Android) + pencarian nama produk ----
  var kolomBarcode = document.getElementById('barcode');
  var tombolScan = document.getElementById('tombolScan');
  var infoScan = document.getElementById('infoScan');

  function cariNamaProduk(kode) {
    // Open Food Facts (butuh internet di perangkat). Bila gagal, pengguna mengisi nama sendiri.
    var kolomNama = document.getElementById('namaMakanan');
    if (!kolomNama || kolomNama.value.trim() !== '' || !window.fetch) { return; }
    fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(kode) + '.json?fields=product_name')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var nama = d && d.product && d.product.product_name;
        if (nama && kolomNama.value.trim() === '') {
          kolomNama.value = nama;
          if (infoScan) { infoScan.textContent = 'Nama produk terisi otomatis dari barcode. Periksa kembali.'; }
        } else if (infoScan) {
          infoScan.textContent = 'Barcode terbaca. Nama produk tidak ditemukan, isi manual.';
        }
      })
      .catch(function () {
        if (infoScan) { infoScan.textContent = 'Barcode terbaca. Tidak ada internet untuk mencari nama, isi manual.'; }
      });
  }

  // Dipanggil oleh aplikasi Android setelah pemindaian berhasil
  window.onBarcodeScanned = function (kode) {
    if (kolomBarcode) { kolomBarcode.value = kode; }
    if (infoScan) { infoScan.textContent = 'Barcode terbaca: ' + kode; }
    cariNamaProduk(kode);
  };

  if (tombolScan) {
    tombolScan.addEventListener('click', function () {
      if (window.AndroidApp && window.AndroidApp.scanBarcode) {
        window.AndroidApp.scanBarcode();
      } else if (infoScan) {
        infoScan.textContent = 'Scan kamera hanya tersedia di aplikasi Android. Ketik kode barcode secara manual.';
      }
    });
  }

  // ---- Live chat (polling tiap 3 detik) ----
  var kotak = document.querySelector('.chat');
  if (kotak) {
    var lawan = kotak.getAttribute('data-dengan');
    var csrf = kotak.getAttribute('data-csrf');
    var isi = document.getElementById('chatIsi');
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatPesan');
    var terakhir = 0;

    var tambah = function (p) {
      var el = document.createElement('div');
      el.className = 'gelembung' + (p.dari_saya ? ' saya' : '');
      el.textContent = p.teks;                      // textContent: aman dari XSS
      var w = document.createElement('small');
      w.textContent = p.waktu;
      el.appendChild(w);
      isi.appendChild(el);
      terakhir = Math.max(terakhir, p.id);
    };

    var ambil = function () {
      fetch('/chat?ajax=ambil&dengan=' + encodeURIComponent(lawan) + '&setelah=' + terakhir, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok && d.pesan.length) {
            d.pesan.forEach(tambah);
            isi.scrollTop = isi.scrollHeight;
          }
        })
        .catch(function () { /* abaikan; coba lagi pada putaran berikutnya */ });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var teks = input.value.trim();
      if (!teks) { return; }
      var data = new URLSearchParams();
      data.append('ajax', 'kirim');
      data.append('dengan', lawan);
      data.append('pesan', teks);
      data.append('_csrf', csrf);
      fetch('/chat', { method: 'POST', body: data, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { input.value = ''; ambil(); } else { window.alert(d.pesan); }
        });
    });

    ambil();
    setInterval(ambil, 3000);
  }
})();
