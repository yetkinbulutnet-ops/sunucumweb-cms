baslik: WordPress siteniz neden yavaş? Sunucu tarafında kontrol etmeniz gereken 9 şey
slug: wordpress-sitesi-neden-yavas
kategori: wordpress
seoBaslik: WordPress Sitesi Neden Yavaş? Sunucu Tarafı Kontrol Listesi
seoAciklama: WordPress sitenizin yavaşlığının sebebini bulmak için PHP sürümünden veritabanına, önbellekten WP-Cron'a kadar sunucu tarafında bakmanız gereken noktalar.
ozet: Önbellek eklentisi kurdunuz, görselleri sıkıştırdınız ama site hâlâ ağır mı açılıyor? Sorun çoğu zaman temanın ya da görsellerin değil, sunucu tarafındaki ayarların içinde saklı. Adım adım kontrol listesini hazırladık.
etiketler: WordPress|site hızı|PHP|önbellek|veritabanı|TTFB
S: Hangi PHP sürümünü kullanmalıyım?
C: Tema ve eklentileriniz destekliyorsa PHP 8.2 ya da 8.3 kullanmanızı öneririz. Güncellemeden önce sitenin bir kopyasında ya da yedek aldıktan sonra deneme yapın. cPanel'de PHP sürümünü genellikle MultiPHP Yöneticisi ya da PHP Seçici bölümünden değiştirebilirsiniz.
S: Birden fazla önbellek eklentisi kullanmak siteyi hızlandırır mı?
C: Hayır, genellikle tam tersi olur. İki tam sayfa önbellek eklentisi birbirinin önbelleğini bozabilir ve beklenmedik hatalara yol açabilir. Sunucunuz LiteSpeed kullanıyorsa LiteSpeed Cache, kullanmıyorsa tek bir önbellek eklentisi yeterlidir.
S: TTFB değerim ne kadar olmalı?
C: Önbellekten gelen sayfalarda 200 milisaniyenin altı iyi kabul edilir. Önbelleksiz, dinamik sayfalarda 600 milisaniyenin altında kalmak hedeflenmelidir. Bunun üzerindeki değerler sunucu, PHP ya da veritabanı tarafında bir darboğaz olduğunu gösterir.
---
WordPress yavaşladığında ilk yapılan şey genellikle aynıdır: bir önbellek eklentisi kurulur, görseller sıkıştırılır, belki bir hız testi sitesinde puana bakılır. Bunlar faydalı adımlar ama çoğu zaman asıl sorunu çözmez. Özellikle yönetim paneli yavaşsa, sepet ve ödeme sayfaları ağır açılıyorsa ya da site sadece bazı saatlerde tıkanıyorsa, sorun büyük ihtimalle sunucu tarafındadır.

Bu yazıda, destek taleplerinde en sık karşılaştığımız sebepleri bir kontrol listesi halinde topladık. Maddelerin çoğunu teknik bilgi gerektirmeden kendiniz kontrol edebilirsiniz.

## Önce ölçün: yavaşlık nerede?

Tahminle optimizasyon yapmak çoğu zaman vakit kaybıdır. İşe başlamadan önce yavaşlığın hangi aşamada olduğunu bulmak gerekir.

Tarayıcınızın geliştirici araçlarını açın (Windows'ta F12), Ağ sekmesine geçin ve sayfayı yenileyin. Listedeki ilk isteğe, yani sayfanın HTML belgesine tıklayın. Zamanlama bölümünde sunucu yanıtını bekleme süresini (TTFB) göreceksiniz.

- **TTFB yüksekse** (örneğin 1 saniyenin üzerindeyse), sayfa sunucuda üretilirken zaman kaybediliyor. Bu yazının geri kalanı tam olarak bu durum için.
- **TTFB düşük ama sayfa geç yükleniyorsa**, sorun büyük ihtimalle ön yüzde: büyük görseller, çok sayıda JavaScript dosyası, dış kaynaklardan yüklenen fontlar ve takip kodları.

## 1. PHP sürümü

Eski PHP sürümleri, WordPress'in yavaş çalışmasının en yaygın ve en kolay çözülen sebebidir. PHP 7.4'ten 8.2'ye geçmek, hiçbir kod değiştirmeden sayfa üretim süresini belirgin şekilde kısaltabilir. Üstelik PHP 7.4 ve 8.0 artık güvenlik güncellemesi almıyor.

Kontrol etmek için WordPress yönetim panelinde Araçlar menüsünden Site Sağlığı bölümüne girin. Bilgi sekmesinde Sunucu başlığı altında PHP sürümünü görebilirsiniz. Güncellemeden önce mutlaka yedek alın, çünkü uzun süredir güncellenmemiş bazı eklentiler yeni sürümlerde hata verebilir.

## 2. OPcache

PHP, her istekte kaynak kodunu okuyup derler. OPcache, derlenmiş kodu bellekte tutarak bu işlemin her seferinde tekrarlanmasını engeller. WordPress gibi yüzlerce PHP dosyası yükleyen bir yazılımda OPcache kapalıysa, her sayfa açılışında gereksiz yere işlemci harcanır.

Çoğu modern hosting ortamında OPcache varsayılan olarak açıktır ama kontrol etmekte fayda var. Site Sağlığı ekranında ya da phpinfo çıktısında opcache.enable değerine bakabilirsiniz.

## 3. Nesne önbelleği (Redis veya Memcached)

Tam sayfa önbellek, giriş yapmamış ziyaretçilere hazır HTML sunar. Ama yönetim paneli, sepet, hesabım sayfaları ve giriş yapmış kullanıcılar bu önbellekten faydalanamaz. Bu sayfalarda WordPress her seferinde veritabanına onlarca, bazen yüzlerce sorgu gönderir.

Nesne önbelleği, bu sorguların sonuçlarını Redis ya da Memcached gibi bellekte çalışan bir sistemde tutar. Özellikle WooCommerce sitelerinde ve üyelik sitelerinde yönetim paneli ile sepet hızını gözle görülür şekilde artırır. Hosting paketinizde Redis desteği varsa, Redis Object Cache gibi bir eklentiyle etkinleştirebilirsiniz.

## 4. Tam sayfa önbellek doğru mu çalışıyor?

Önbellek eklentisi kurulu olması, önbelleğin çalıştığı anlamına gelmez. Bazı eklentiler, çerez kullanan bir başka eklenti yüzünden sayfaları hiç önbelleğe almayabilir.

Kontrol etmek için sayfayı gizli pencerede açın ve geliştirici araçlarında yanıt başlıklarına bakın. LiteSpeed Cache kullanıyorsanız x-litespeed-cache: hit, diğer eklentilerde genellikle benzer bir hit ya da cached ifadesi görmeniz gerekir. Her yenilemede miss görüyorsanız, önbellek devre dışı kalıyor demektir.

Sunucunuz LiteSpeed web sunucusu kullanıyorsa, LiteSpeed Cache eklentisi sunucu seviyesinde çalıştığı için PHP tabanlı önbellek eklentilerinden daha verimlidir. Aynı anda iki tam sayfa önbellek eklentisi kullanmayın.

## 5. Veritabanında şişmiş autoload verileri

WordPress her sayfa açılışında wp_options tablosundaki autoload olarak işaretli tüm ayarları belleğe yükler. Eklentiler kaldırıldığında bu ayarların çoğu tabloda kalır. Zamanla autoload verisinin boyutu birkaç megabayta çıkabilir ve bu yük her istekte tekrar edilir.

Site Sağlığı ekranı, autoload verisi 800 KB'ı geçtiğinde uyarı verir. phpMyAdmin üzerinden şu sorguyla toplam boyutu kendiniz de görebilirsiniz:

```sql
SELECT ROUND(SUM(LENGTH(option_value)) / 1024) AS kb
FROM wp_options
WHERE autoload IN ('yes', 'on', 'auto-on', 'auto');
```

Değer yüksekse, hangi kayıtların büyük olduğunu sıralayıp, artık kullanmadığınız eklentilere ait olanları temizleyebilirsiniz. Bu işlemi yapmadan önce mutlaka veritabanı yedeği alın.

## 6. WP-Cron

WordPress'in zamanlanmış görevleri (yazı yayınlama, e-posta gönderimi, eklenti güncelleme kontrolleri, yedeklemeler) varsayılan olarak ziyaretçi geldiğinde tetiklenir. Trafiği yüksek sitelerde bu, gereksiz yere sık çalışan işlere, trafiği düşük sitelerde ise hiç çalışmayan görevlere yol açar. Ağır bir görev tam bir ziyaretçinin isteğine denk gelirse, o ziyaretçi sayfanın geç açıldığını görür.

Daha sağlıklı yöntem, wp-config.php dosyasına şu satırı eklemek:

```php
define('DISABLE_WP_CRON', true);
```

ve ardından cPanel'deki Cron Jobs bölümünden wp-cron.php dosyasını her 5 ya da 15 dakikada bir çalışacak şekilde zamanlamaktır. Böylece görevler ziyaretçilerden bağımsız, düzenli aralıklarla çalışır.

## 7. Eklentiler ve arka plan istekleri

Eklenti sayısından çok, eklentilerin ne yaptığı önemlidir. Tek bir kötü yazılmış eklenti, yirmi hafif eklentiden daha fazla yük getirebilir. Özellikle şunlara dikkat edin:

- Her sayfada dış bir servise bağlanan eklentiler (sosyal medya sayaçları, bazı güvenlik ve istatistik eklentileri). Dış servis yavaş yanıt verirse sizin sayfanız da bekler.
- Sunucu üzerinde tarama yapan güvenlik eklentileri. Dosya taramaları paylaşımlı hostingte işlemci limitini kolayca doldurur.
- Yönetim panelinde admin-ajax.php üzerinden sürekli istek gönderen eklentiler. Heartbeat API'sinin sıklığını düşürmek bu yükü azaltır.

Hangi eklentinin yük getirdiğini bulmak için Query Monitor eklentisini geçici olarak kurabilirsiniz. Sayfa başına çalışan sorgu sayısını, en yavaş sorguyu ve dış HTTP isteklerini gösterir. İşiniz bitince kaldırmayı unutmayın.

## 8. Hosting kaynak limitleri

Yukarıdaki her şey yolundaysa ve site yine de yoğun saatlerde yavaşlıyorsa, hesabınızın kaynak limitlerine bakın. cPanel'deki kaynak kullanımı ekranında işlemci, bellek ve eşzamanlı işlem grafiklerinin sık sık sınıra dayanıp dayanmadığını kontrol edin. Limitlere düzenli takılıyorsanız, optimizasyonun sınırına gelmişsiniz demektir ve daha yüksek kaynaklı bir pakete ya da sanal sunucuya geçmek gerekir.

## 9. Sunucunun konumu

Sunucunuz ile ziyaretçileriniz arasındaki fiziksel mesafe, her isteğe sabit bir gecikme ekler. Ziyaretçilerinizin çoğu Türkiye'deyse ve siteniz Amerika'daki bir sunucuda duruyorsa, sayfa ne kadar hızlı üretilirse üretilsin her istekte 100 milisaniyeyi aşan bir yol süresi eklenir. Bir sayfa açılışında onlarca istek yapıldığını düşünürsek, bu fark ciddi bir yavaşlığa dönüşür.

## Kısa kontrol listesi

- PHP 8.2 ya da üzeri kullanılıyor mu?
- OPcache açık mı?
- Yönetim paneli ve sepet için nesne önbelleği var mı?
- Tam sayfa önbellek gerçekten hit veriyor mu?
- Autoload verisi 800 KB'ın altında mı?
- WP-Cron sunucu cron'una taşındı mı?
- Dış servise bağlanan ya da tarama yapan ağır eklentiler var mı?
- Hesap kaynak limitlerine takılıyor mu?
- Sunucu, ziyaretçilerinize yakın bir konumda mı?

## Sonuç

WordPress yavaşlığı çoğu zaman tek bir büyük sorundan değil, birkaç küçük eksikliğin üst üste binmesinden kaynaklanır. Güncel bir PHP sürümü, doğru çalışan bir önbellek, temiz bir veritabanı ve yeterli sunucu kaynağı, sitenin hızının büyük kısmını belirler.

SunucumWEB [WordPress hosting](/wordpress-hosting) paketleri LiteSpeed web sunucusu, güncel PHP sürümleri ve NVMe diskler üzerinde çalışıyor. Sitenizin neden yavaş olduğunu bulamadıysanız, [bize yazın](/iletisim), birlikte bakalım.
