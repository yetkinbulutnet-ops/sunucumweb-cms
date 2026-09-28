baslik: Web sitesi yedekleme: hosting firmasının yedeği neden tek başına yetmez?
slug: web-sitesi-yedekleme-rehberi
kategori: sunucu-yonetimi
seoBaslik: Web Sitesi Yedekleme Rehberi: 3-2-1 Kuralı ve Geri Yükleme
seoAciklama: Web sitenizi ve e-postalarınızı kaybetmemek için 3-2-1 yedekleme kuralını, yedek sıklığını belirlemeyi ve yedeğin gerçekten çalıştığını test etmeyi anlattık.
ozet: Çoğu site sahibi yedeğin önemini ancak bir şeyler ters gittiğinde anlıyor. Hosting firmasının aldığı yedek iyi bir güvence ama tek başına yeterli değil. 3-2-1 kuralını, doğru yedek sıklığını ve en çok atlanan adımı, yani geri yükleme testini anlattık.
etiketler: yedekleme|backup|3-2-1 kuralı|veri güvenliği|felaket kurtarma
S: Hosting firmam zaten yedek alıyor, benim ayrıca yedek almam gerekir mi?
C: Önerilir. Hosting firmasının yedeği genellikle sunucu arızalarına karşı bir güvencedir ve saklama süresi sınırlıdır. Fark etmeden bozulan ya da virüs bulaşan bir siteyi, sorun yedekleme süresinden önce başladıysa firmanın yedeğiyle kurtaramayabilirsiniz. Kendi kontrolünüzde, farklı bir yerde tutulan ek bir yedek bu riski ortadan kaldırır.
S: Yedekler ne kadar süre saklanmalı?
C: Çoğu site için son 7 günün günlük yedekleri ile son birkaç ayın haftalık ya da aylık yedeklerini saklamak iyi bir dengedir. Kötü amaçlı yazılım bulaşmaları bazen haftalar sonra fark edildiği için yalnızca son birkaç günün yedeğini tutmak yeterli olmayabilir.
S: Sunucu anlık görüntüsü (snapshot) yedek yerine geçer mi?
C: Tam olarak geçmez. Snapshot genellikle sunucuyla aynı altyapıda tutulur ve bir güncelleme öncesi hızlı geri dönüş için idealdir. Ancak altyapının kendisinde bir sorun olursa snapshot da etkilenebilir. Farklı bir konumda tutulan bağımsız bir yedek her zaman gereklidir.
---
Web sitesi yedeği, sigortaya benzer: ihtiyaç duymadığınız sürece gereksiz bir masraf gibi görünür, ihtiyaç duyduğunuz gün ise her şeydir. Bir eklenti güncellemesi siteyi bozabilir, bir çalışan yanlışlıkla bir klasörü silebilir, zayıf bir şifre yüzünden siteye zararlı kod bulaşabilir. Bu durumların hepsinde sizi kurtaracak tek şey, çalışan ve güncel bir yedektir.

Bu yazıda yedeklemenin temel kurallarını, ne sıklıkla yedek alınması gerektiğini ve çoğu zaman atlanan en önemli adımı anlatıyoruz.

## Hosting firmasının yedeği neden yetmeyebilir?

Hemen her hosting firması belirli aralıklarla yedek alır ve bu gerçekten değerli bir güvencedir. Ama bu yedeğin amacını ve sınırlarını bilmek gerekir:

- **Saklama süresi sınırlıdır.** Firmanın yedekleri genellikle birkaç gün ile birkaç hafta arası saklanır. Siteye bulaşan zararlı bir kod üç hafta sonra fark edilirse, temiz bir yedeğe ulaşmak mümkün olmayabilir.
- **Kontrol sizde değildir.** Geri yükleme için destek talebi açmanız, belirli bir yedeği istemeniz ve beklemeniz gerekebilir.
- **Kapsam her zaman aynı değildir.** Bazı paketlerde sadece dosyalar, bazılarında dosyalar ve veritabanları yedeklenir. E-postaların yedeklenip yedeklenmediğini ayrıca sormak gerekir.
- **Hesap sorunlarında erişim kaybolabilir.** Ödeme sorunu, hesap askıya alınması ya da firmayla yaşanan bir anlaşmazlık durumunda yedeklere erişemeyebilirsiniz.

Kısacası, hosting firmasının yedeği sunucu tarafındaki arızalara karşı bir güvencedir. Sizin verinizin son güvencesi ise sizin kontrolünüzde olan bir yedek olmalıdır.

## 3-2-1 kuralı

Yedekleme dünyasında en çok bilinen kural basittir ve web siteleri için de geçerlidir:

- **3 kopya:** Verinizin canlı hali dahil en az üç kopyası olsun.
- **2 farklı ortam:** Bu kopyalar en az iki farklı depolama ortamında dursun. Örneğin sunucunun kendi diski ve ayrı bir yedekleme sunucusu.
- **1 farklı konum:** En az bir kopya fiziksel olarak başka bir yerde, farklı bir veri merkezinde ya da bulut depolamada bulunsun.

Bir web sitesi için bunun pratikteki karşılığı şöyle olabilir: canlı site sunucuda çalışır, hosting firması günlük yedek alır ve siz de haftada bir tam yedeği bulut depolamaya ya da kendi bilgisayarınıza indirirsiniz.

Son yıllarda bu kurala bir ekleme daha yapılıyor: yedeklerden en az birinin değiştirilemez (immutable) ya da çevrim dışı olması. Fidye yazılımları ve sunucuya erişim sağlayan saldırganlar, bağlı oldukları yedekleri de silmeye çalışır. Sunucudan erişilemeyen bir yedek, bu senaryoda sizi kurtaran tek kopya olur.

## Neyi yedeklemelisiniz?

Bir web sitesinin yedeği sadece dosyalardan oluşmaz. Tam bir yedek şunları içermelidir:

- **Site dosyaları:** Yazılımın kendisi, temalar, eklentiler ve yüklenen görseller ile belgeler.
- **Veritabanları:** WordPress, e-ticaret altyapıları ve çoğu modern site, içeriğin büyük kısmını veritabanında tutar. Dosyaları olup veritabanı olmayan bir yedek çoğu zaman işe yaramaz.
- **E-postalar:** Kurumsal e-posta aynı hosting hesabındaysa, posta kutuları da yedek kapsamında olmalı.
- **Yapılandırmalar:** DNS kayıtları, cron görevleri, özel PHP ayarları ve SSL yapılandırması. Bunlar kaybolduğunda siteyi geri kurmak saatler alabilir.

cPanel kullanıyorsanız, Yedekleme (Backup) bölümünden tam hesap yedeği alarak bunların büyük kısmını tek dosyada indirebilirsiniz.

## Ne sıklıkla yedek almalısınız?

Doğru yedek sıklığını belirlemek için kendinize şu soruyu sorun: "En fazla kaç saatlik veriyi kaybetmeyi göze alabilirim?" Bu süreye teknik dilde RPO (kurtarma noktası hedefi) denir.

- **Nadiren güncellenen kurumsal siteler:** Haftalık yedek ve her önemli değişiklikten önce bir elle yedek genellikle yeterlidir.
- **Blog ve haber siteleri:** Her gün içerik ekleniyorsa, günlük yedek gerekir.
- **E-ticaret siteleri:** Siparişler, müşteri kayıtları ve stok bilgileri sürekli değiştiği için veritabanının günde birkaç kez yedeklenmesi önerilir. Bir günlük sipariş kaybı, çoğu işletme için kabul edilemez.

Bir de kurtarma süresi (RTO) vardır: bir sorun olduğunda sitenin ne kadar sürede yeniden çalışır hale gelmesi gerektiği. Yedeğin nerede durduğu ve ne kadar büyük olduğu bu süreyi doğrudan etkiler. 20 GB'lık bir yedeği yavaş bir bağlantı üzerinden geri yüklemek saatler sürebilir.

## En çok atlanan adım: geri yükleme testi

Yedek almak işin yarısıdır. Test edilmemiş bir yedek, çalışıp çalışmayacağını bilmediğiniz bir yedektir. Gerçek bir sorun anında yedeğin bozuk olduğunu, veritabanının eksik olduğunu ya da şifreli arşivin şifresinin bilinmediğini fark etmek, sık rastlanan ve çok can sıkan bir durumdur.

Birkaç ayda bir şu testi yapmanızı öneririz:

1. Yedeklerinizden birini seçin.
2. Canlı siteye dokunmadan, bir alt alan adına ya da yerel bilgisayarınıza geri yükleyin.
3. Sitenin açıldığını, yönetim paneline girilebildiğini ve son içeriklerin yerinde olduğunu kontrol edin.
4. Geri yüklemenin ne kadar sürdüğünü not edin. Bu, gerçek bir sorunda ne kadar süre kapalı kalacağınızı gösterir.
5. Karşılaştığınız her sorunu ve çözümünü kısa bir not olarak yazın.

## Güncelleme öncesi yedek alışkanlığı

Sitelerin bozulmasının en yaygın sebeplerinden biri güncellemelerdir. Tema, eklenti ya da ana yazılım güncellemesinden önce elle bir yedek almak, olası bir sorunda dakikalar içinde geri dönmenizi sağlar. Büyük güncellemeleri önce sitenin bir kopyası üzerinde denemek ise daha da güvenli bir yoldur.

## Yedeklerin güvenliği

Yedekler, sitenizin tüm verisini içerir: müşteri bilgileri, sipariş kayıtları, veritabanı şifreleri. Bu yüzden yedeklerin de korunması gerekir:

- Yedek dosyalarını web sitesinin herkese açık klasörlerinde bırakmayın. public_html içinde unutulan bir yedek.zip dosyası, herkesin indirebileceği bir veri sızıntısıdır.
- Bulut depolamaya gönderilen yedekleri mümkünse şifreleyin.
- Yedek hesaplarınızın şifrelerini site şifrelerinizden farklı tutun ve iki adımlı doğrulama kullanın.
- Kişisel veri içeren yedekleri gereğinden uzun saklamayın. KVKK açısından da verinin saklama süresi önemlidir.

## Sonuç

İyi bir yedekleme düzeni üç şeye dayanır: yeterli sıklıkta alınan yedekler, bunların en az birinin farklı bir konumda tutulması ve düzenli yapılan geri yükleme testleri. Hosting firmasının yedeği bu düzenin önemli bir parçası ama tek parçası olmamalı.

SunucumWEB altyapısında site verileri düzenli olarak farklı bir konumdaki yedekleme deposuna gönderiliyor. Yine de kendi yedeklerinizi almanızı, özellikle büyük değişikliklerden önce bu alışkanlığı sürdürmenizi öneriyoruz. Yedekleme ya da geri yükleme konusunda yardıma ihtiyacınız olursa, [destek ekibimize](/iletisim) ulaşabilirsiniz.
