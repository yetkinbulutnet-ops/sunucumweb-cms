baslik: Web hosting, VDS ya da dedicated sunucu: hangisine ne zaman geçmelisiniz?
slug: web-hosting-vds-dedicated-sunucu-secimi
kategori: sunucu-yonetimi
seoBaslik: Web Hosting mi, VDS mi, Dedicated mı? Doğru Zamanda Geçiş
seoAciklama: Paylaşımlı hosting, VDS ve dedicated sunucu arasındaki farkları, geçiş zamanını gösteren işaretleri ve maliyet hesabını sade bir dille anlattık.
ozet: Siteniz büyüdükçe paylaşımlı hosting yetmemeye başlar. Ama VDS'ye ya da dedicated sunucuya erken geçmek de gereksiz masraf ve yönetim yükü demek. Hangi belirtiler geçiş zamanının geldiğini gösterir, hangi durumda hangi çözüm mantıklı, burada topladık.
etiketler: VDS|dedicated sunucu|web hosting|sunucu seçimi|paylaşımlı hosting
S: VDS ile VPS aynı şey mi?
C: Pratikte aynı anlamda kullanılıyor. İkisi de fiziksel bir sunucunun sanallaştırma ile bölünmüş, kaynakları size ayrılmış bir parçasıdır. Bazı firmalar VDS terimini kaynakların garanti edildiğini vurgulamak için kullanır. Önemli olan isim değil, işlemci, RAM ve disk kaynaklarının size ayrılıp ayrılmadığıdır.
S: Paylaşımlı hostingten VDS'ye geçerken site kapanır mı?
C: Doğru planlanırsa kapanmaz. Site önce yeni sunucuya kopyalanır ve test edilir, ardından DNS kayıtları yeni sunucuya yönlendirilir. DNS değişikliğinin yayılması sırasında iki sunucu da çalıştığı için ziyaretçiler kesinti yaşamaz. Geçişten birkaç gün önce DNS kayıtlarının TTL değerini düşürmek süreci hızlandırır.
S: Yönetimli VDS ne demek?
C: Sunucunun kurulumu, güvenlik güncellemeleri, izleme ve sorun giderme gibi sistem yönetimi işlerinin hosting firması tarafından yapıldığı VDS hizmetidir. Linux bilgisi olmayan ya da buna vakit ayırmak istemeyen işletmeler için genellikle en doğru seçenektir.
---
Bir web sitesi genellikle paylaşımlı hostingte başlar ve bu çoğu zaman doğru karardır. Fiyatı düşüktür, teknik bilgi gerektirmez, e-posta ve SSL gibi ihtiyaçlar hazır gelir. Ama site büyüdükçe bir noktada sayfalar yavaşlamaya, yönetim paneli takılmaya, kampanya günlerinde site hata vermeye başlar. O noktada akla gelen soru hep aynıdır: VDS'ye mi geçmeliyim, doğrudan dedicated sunucu mu almalıyım?

Bu yazıda üç hizmet türünü, aralarındaki gerçek farkları ve geçiş zamanının geldiğini gösteren işaretleri anlatıyoruz.

## Üç seçeneğin kısa tanımı

### Paylaşımlı hosting

Tek bir fiziksel sunucu, yüzlerce web sitesi arasında paylaşılır. Her hesaba disk alanı, işlemci ve bellek için belirli limitler tanımlanır. Sunucunun kurulumu, güvenliği ve güncellemeleri tamamen hosting firmasındadır. Siz sadece cPanel gibi bir panel üzerinden kendi sitenizi, veritabanınızı ve e-postalarınızı yönetirsiniz.

### VDS (sanal sunucu)

Güçlü bir fiziksel sunucu, sanallaştırma yazılımıyla birkaç bağımsız sanal makineye bölünür. Her sanal makineye belirli sayıda işlemci çekirdeği, RAM ve disk ayrılır. Kendi işletim sisteminiz, root erişiminiz ve istediğiniz yazılımı kurma özgürlüğünüz olur. Diğer sanal makinelerin yükü sizi paylaşımlı hostinge göre çok daha az etkiler.

### Dedicated (fiziksel) sunucu

Bir fiziksel sunucunun tamamı size aittir. İşlemcinin tüm çekirdekleri, belleğin tamamı ve disklerin hepsi sadece sizin iş yükünüz için çalışır. Sanallaştırma katmanı olmadığı için en yüksek ve en tutarlı performansı verir. Buna karşılık maliyeti ve yönetim sorumluluğu da en yüksek olan seçenektir.

## Farkı belirleyen asıl konu: kaynak garantisi

Üç seçenek arasındaki farkı tek cümleyle anlatmak gerekirse: paylaşımlı hostingte kaynaklar "en fazla" üzerinden, VDS ve dedicated sunucuda ise "size ayrılmış" olarak tanımlanır.

Paylaşımlı hostingte hesabınıza tanımlanan 2 çekirdek, genellikle en fazla bu kadar kullanabileceğiniz anlamına gelir. Sunucunun o anki durumuna göre bu kaynağa her zaman erişemeyebilirsiniz. VDS'de ayrılan 4 çekirdek ve 8 GB RAM ise sanal makinenizin kaynağıdır ve başka bir müşterinin yoğunluğu bunu elinizden alamaz. Dedicated sunucuda bu kavram tamamen ortadan kalkar, çünkü paylaşılan hiçbir şey yoktur.

## Paylaşımlı hostingin yetmediğini gösteren işaretler

Şu belirtilerden birkaçını birlikte görüyorsanız, geçişi düşünme zamanı gelmiş olabilir:

- **508 Resource Limit Reached hatası:** Hesabınız eşzamanlı işlem ya da işlemci limitine takılıyor demektir. Arada bir görülüyorsa optimizasyonla çözülebilir, düzenli görülüyorsa paket yetmiyordur.
- **cPanel'de kaynak kullanımı grafiklerinin sürekli sınırda olması:** CPU, bellek ya da giriş işlemi (entry process) grafikleri gün içinde sık sık kırmızıya dönüyorsa, siteniz aldığı trafiğe göre dar bir alanda çalışıyor.
- **Yoğun saatlerde belirgin yavaşlama:** Site gece hızlı, öğlen yavaşsa sebep sizin trafiğiniz kadar sunucudaki diğer sitelerin yükü de olabilir.
- **Özel yazılım ihtiyacı:** Node.js, Python uygulaması, Redis, Elasticsearch, farklı bir PHP eklentisi ya da arka planda sürekli çalışan bir işlem gerekiyorsa, paylaşımlı hosting genellikle buna izin vermez.
- **Kampanya ya da reklam dönemlerinde çökme:** Televizyon reklamı, sosyal medya kampanyası ya da indirim günü gibi ani trafik artışlarında site erişilemez oluyorsa, kaynak garantisi olan bir yapıya ihtiyacınız var demektir.

Önemli bir not: bu belirtilerin hepsi her zaman donanım yetersizliğinden kaynaklanmaz. Kötü yazılmış bir eklenti, optimize edilmemiş görseller ya da önbelleğin hiç kullanılmaması da aynı sonuçları doğurabilir. Geçişe karar vermeden önce sitenin kendisini de gözden geçirmek, gereksiz masrafın önüne geçer.

## VDS ne zaman doğru seçim?

VDS, paylaşımlı hosting ile dedicated sunucu arasındaki en esnek basamaktır. Şu durumlarda genellikle en mantıklı tercihtir:

- Günlük birkaç bin ile birkaç on bin arası ziyaretçi alan kurumsal siteler ve orta ölçekli e-ticaret siteleri.
- Birden fazla müşteri sitesini tek bir yerden yönetmek isteyen ajanslar ve serbest çalışan geliştiriciler.
- Kendi yazılımını, özel servisleri ya da farklı dil ve çatılarla yazılmış uygulamaları çalıştırması gereken projeler.
- Kaynak ihtiyacı büyüyen ama henüz tüm bir fiziksel sunucuyu dolduracak kadar yük oluşturmayan işletmeler.

VDS'nin en büyük avantajlarından biri ölçeklenebilir olmasıdır. İhtiyaç arttığında işlemci, RAM ya da disk kaynaklarını genellikle kısa bir yeniden başlatmayla yükseltebilirsiniz. Taşınma gerekmez.

## Dedicated sunucu ne zaman gerekir?

Dedicated sunucu, gerçekten ihtiyaç olduğunda alınması gereken bir yatırımdır. Şu durumlarda VDS'den daha doğru bir seçim olur:

- **Sürekli yüksek işlemci kullanımı:** Büyük e-ticaret siteleri, yoğun veritabanı işlemleri, raporlama sistemleri ya da yüksek trafikli haber siteleri.
- **Tutarlı performans zorunluluğu:** Sanallaştırma katmanının getirdiği küçük dalgalanmaların bile kabul edilemediği işler.
- **Özel donanım ihtiyacı:** Çok yüksek RAM, özel disk düzenleri, donanım RAID kartı ya da GPU gerektiren iş yükleri.
- **Mevzuat ve uyumluluk:** Verilerin başka müşterilerle aynı fiziksel donanımda tutulmaması gereken sektörler.
- **Kendi sanallaştırmanızı kurmak:** Proxmox ya da VMware ile kendi sanal makinelerinizi oluşturup yönetmek istiyorsanız.

## Maliyeti sadece aylık ücret üzerinden hesaplamayın

Paylaşımlı hostingten VDS'ye geçerken aylık ücret artar ama asıl maliyet çoğu zaman gözden kaçan kalemlerde çıkar:

- **Yönetim:** Yönetimsiz bir VDS'de işletim sistemi güncellemeleri, güvenlik duvarı, yedekleme ve izleme sizin sorumluluğunuzdadır. Bunu yapacak kişinin zamanı da bir maliyettir.
- **Kontrol paneli lisansı:** cPanel, Plesk ya da benzeri bir panel kullanacaksanız ayrıca lisans ücreti ödenir.
- **Yedekleme:** Sunucunun anlık görüntüsü (snapshot) yedek sayılmaz. Farklı bir konumda tutulan düzenli yedek için ek alan gerekir.
- **Kesinti maliyeti:** Satış yapan bir site için bir saatlik kesintinin kaybı, yıllık sunucu farkından fazla olabilir. Bu hesap bazen daha güçlü bir sunucuyu ucuz hale getirir.

## Geçiş sürecinde dikkat edilmesi gerekenler

Hangi yöne geçerseniz geçin, taşıma sürecini şu sırayla yürütmek kesinti riskini en aza indirir:

1. Geçişten en az bir gün önce alan adınızın DNS kayıtlarındaki TTL değerini 300 saniye gibi düşük bir değere çekin.
2. Yeni sunucuyu hazırlayın ve siteyi, veritabanını ve e-posta hesaplarını kopyalayın.
3. Bilgisayarınızdaki hosts dosyasını düzenleyerek siteyi yeni sunucuda test edin. Formlar, ödeme adımları ve yönetim paneli dahil her şeyi deneyin.
4. Eski sitede içerik değişikliğini kısa bir süre durdurun ve son veritabanı kopyasını alın.
5. DNS kayıtlarını yeni sunucuya yönlendirin. Yayılımı [DNS kontrol aracımızla](/araclar/dns) farklı ülkelerdeki sunuculardan takip edebilirsiniz.
6. Eski sunucuyu en az bir hafta kapatmayın. Geç güncellenen DNS önbellekleri ve e-postalar için bir güvenlik payı bırakın.

## Sonuç

Doğru sunucu, sitenizin bugünkü ihtiyacını karşılayan ve yarınki büyümesine yer bırakan sunucudur. Paylaşımlı hosting küçük ve orta siteler için hâlâ en verimli başlangıç. Kaynak limitlerine düzenli takılmaya başladığınızda ya da özel yazılım ihtiyacı doğduğunda [sanal sunucu](/sanal-sunucu), sürekli yüksek yük ve tutarlı performans gerektiğinde ise [dedicated sunucu](/dedicated-sunucu) mantıklı hale gelir.

Hangisinin size uygun olduğundan emin değilseniz, mevcut kaynak kullanım grafiklerinizi ve aylık ziyaretçi sayınızı [bizimle paylaşın](/iletisim). Sitenizi inceleyip gereğinden büyük ya da küçük bir paket almanızın önüne geçelim.
