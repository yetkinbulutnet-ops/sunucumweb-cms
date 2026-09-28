baslik: Alan adı transferi nasıl yapılır? Adım adım rehber ve sık yapılan hatalar
slug: alan-adi-transferi-nasil-yapilir
kategori: alan-adi
seoBaslik: Alan Adı Transferi Nasıl Yapılır? Adım Adım Rehber
seoAciklama: Alan adınızı başka bir firmaya kesintisiz taşımak için transfer kodu, kilit, 60 gün kuralı ve DNS ayarlarında dikkat etmeniz gerekenleri anlattık.
ozet: Alan adını başka bir firmaya taşımak aslında birkaç dakikalık bir iş. Ama kilidi açmayı unutmak, yanlış e-posta adresi ya da DNS ayarlarını gözden kaçırmak, süreci günlerce uzatabiliyor ve sitenin kapanmasına yol açabiliyor. Adım adım anlattık.
etiketler: alan adı transferi|domain transfer|EPP kodu|DNS|alan adı
S: Transfer sırasında sitem ve e-postalarım kapanır mı?
C: Alan adının DNS kayıtları transfer öncesinde de sonrasında da aynı sunucuları gösterdiği sürece kapanmaz. Transfer sadece alan adının hangi kayıt firmasında tutulduğunu değiştirir. Sorun genellikle eski firmanın DNS hizmetini transferle birlikte kapatmasından kaynaklanır, bu yüzden DNS kayıtlarınızı önceden not almanız önemlidir.
S: Transfer ücreti ödediğimde alan adımın süresi uzar mı?
C: .com, .net, .org gibi uzantılarda transfer işlemi genellikle alan adının bitiş tarihine bir yıl ekler ve mevcut süreniz kaybolmaz. Uzantıya göre kurallar değişebildiği için işlem öncesinde yeni firmanıza sormanız en doğrusudur.
S: Süresi dolmak üzere olan bir alan adını transfer edebilir miyim?
C: Edebilirsiniz ama risklidir. Transfer birkaç gün sürebilir ve bu sırada süre dolarsa işlem aksayabilir. Bitiş tarihine 15 günden az kaldıysa, önce mevcut firmada yenileyip ardından transfer etmek daha güvenlidir.
---
Alan adınızı başka bir firmaya taşımak isteyebilirsiniz. Belki fiyatlar arttı, belki destek sizi yormaya başladı, belki de hosting ve alan adını tek bir yerden yönetmek istiyorsunuz. Sebep ne olursa olsun, alan adı transferi doğru sırayla yapıldığında sitenizde ya da e-postalarınızda hiçbir kesinti yaşamadan tamamlanabilir.

Bu rehberde .com, .net, .org gibi genel uzantılar için transfer sürecini adım adım anlatıyoruz. En sonda da en sık gördüğümüz hataları topladık.

## Transfer ne demek, ne değişir?

Alan adı transferi, alan adınızın kayıtlı olduğu firmanın (registrar) değiştirilmesidir. Alan adının sahibi değişmez, sadece yönetildiği yer değişir.

Burada önemli bir ayrım var: alan adının kayıt firması ile sitenizin barındırıldığı hosting firması aynı olmak zorunda değildir. Alan adınızı A firmasında tutup sitenizi B firmasının sunucusunda barındırabilirsiniz. Bu ikisini birbirine bağlayan şey DNS kayıtlarıdır. Transfer sırasında yaşanan kesintilerin neredeyse tamamı, bu ayrımın gözden kaçırılmasından kaynaklanır.

## Transferden önce: hazırlık

### 1. Transfer yapılabilir mi, kontrol edin

Çoğu uzantıda, alan adı ilk kayıttan ya da bir önceki transferden sonraki 60 gün içinde başka bir firmaya taşınamaz. Aynı kural, sahiplik bilgilerinde önemli bir değişiklik yapıldıktan sonra da uygulanabilir. Alan adınızı yakın zamanda aldıysanız ya da iletişim bilgilerinizi yeni değiştirdiyseniz, bu süreyi beklemeniz gerekebilir.

Ayrıca alan adının süresinin dolmamış olması gerekir. Bitiş tarihine çok az kaldıysa, önce mevcut firmada yenilemek daha güvenlidir.

### 2. İletişim e-posta adresinizi kontrol edin

Alan adının kayıtlı sahip e-posta adresi, transfer onayı ve bildirimler için kullanılır. Bu adres artık kullanmadığınız ya da taşımak istediğiniz alan adına bağlı bir adresse, sorun yaşayabilirsiniz. Örneğin info@alanadiniz.com adresine gelen onay e-postası, e-posta hizmetiniz tam o sırada kesintiye uğrarsa elinize ulaşmaz. Transferden önce, alan adından bağımsız bir adres (örneğin kişisel bir Gmail adresi) tanımlamak işleri kolaylaştırır.

### 3. DNS kayıtlarınızı yedekleyin

Bu adım, kesintisiz bir transferin en önemli parçasıdır. Mevcut firmanızın DNS yönetim ekranına girin ve tüm kayıtları bir yere not edin: A, AAAA, CNAME, MX, TXT (özellikle SPF, DKIM ve doğrulama kayıtları) ve varsa SRV kayıtları.

Kayıtlarınızı dışarıdan görmek için [DNS kontrol aracımızı](/araclar/dns) kullanabilirsiniz. Alan adınızı yazıp her kayıt tipini tek tek sorgulayın ve sonuçları kaydedin.

Neden önemli? Bazı firmalar, alan adı başka yere taşındığında kendi DNS hizmetlerini de kapatır. Alan adınız hâlâ eski firmanın ad sunucularını gösteriyorsa, transfer tamamlandığı anda siteniz ve e-postalarınız çalışmayı durdurabilir.

### 4. Ad sunucularını önceden taşıyın (önerilen)

En güvenli yöntem, transfere başlamadan önce DNS yönetimini taşımaktır. Yeni firmanızda ya da kullandığınız bir DNS hizmetinde (örneğin Cloudflare) tüm kayıtlarınızı birebir oluşturun, ardından alan adının ad sunucularını bu yeni adreslere yönlendirin. Değişikliğin yayılmasını bekleyin, her şeyin çalıştığını kontrol edin. Bundan sonra transfer ne zaman tamamlanırsa tamamlansın, DNS tarafında hiçbir şey değişmeyeceği için kesinti yaşanmaz.

## Transfer adımları

### 1. Transfer kilidini kaldırın

Alan adları varsayılan olarak yetkisiz transferlere karşı kilitli tutulur. Bu kilit, alan adının durumunda clientTransferProhibited olarak görünür. Mevcut firmanızın panelinde "Transfer kilidi", "Registrar Lock" ya da "Domain Lock" gibi bir seçenek bulunur. Bunu kapatın.

Alan adının güncel durumunu [WHOIS sorgulama aracımızla](/araclar/whois) görebilirsiniz. Kilit kaldırıldıktan sonra durum alanında clientTransferProhibited ifadesinin görünmemesi gerekir.

### 2. Transfer kodunu (EPP kodu) alın

Transfer kodu, alan adının sahibi olduğunuzu kanıtlayan bir şifredir. Farklı firmalarda EPP kodu, yetki kodu, Auth Code ya da AuthInfo gibi isimlerle geçer. Genellikle alan adı yönetim ekranından görüntülenebilir ya da kayıtlı e-posta adresinize gönderilir.

Bu kod bir şifre gibi korunmalıdır. Kodu ele geçiren biri, kilit açıksa alan adınızı başka bir firmaya taşımayı deneyebilir.

### 3. Yeni firmada transfer siparişi verin

Yeni firmanızın transfer sayfasında alan adınızı yazın, transfer kodunu girin ve siparişi tamamlayın. Genel uzantılarda transfer ücreti, genellikle alan adına bir yıllık uzatma olarak yansır.

SunucumWEB'de bu işlemi [alan adı transfer sayfamızdan](/transfer) başlatabilirsiniz.

### 4. Onayları takip edin

Sipariş verildikten sonra kayıtlı e-posta adresinize bir bilgilendirme ya da onay e-postası gelebilir. Bazı durumlarda eski firma da transferi onaylama ya da reddetme hakkına sahiptir. Hiçbir işlem yapılmazsa, genel uzantılarda transfer genellikle 5 gün içinde kendiliğinden tamamlanır. Eski firmanızın panelinden transferi onaylama seçeneği varsa kullanarak bu süreyi kısaltabilirsiniz.

### 5. Transfer sonrası kontroller

Transfer tamamlandığında şunları kontrol edin:

- Alan adının yeni firmanızın panelinde göründüğünü ve bitiş tarihinin doğru olduğunu.
- Transfer kilidinin yeniden açık olduğunu.
- Ad sunucularının ve DNS kayıtlarının beklediğiniz gibi olduğunu.
- Sitenizin açıldığını ve e-postaların hem gelip hem gittiğini.
- Otomatik yenilemenin açık olduğunu, ödeme bilgilerinizin güncel olduğunu.

## .tr uzantılı alan adları

.com.tr, .net.tr gibi uzantılar, genel uzantılardan farklı olarak Türkiye'de TRABİS sistemi üzerinden yönetilir ve bazı kuralları farklıdır. Transfer mantığı benzer olsa da süreç ve gerekli belgeler değişebilir. .tr uzantılı bir alan adını taşıyacaksanız, işlem öncesinde yeni firmanızdan güncel adımları öğrenmenizi öneririz.

## En sık yapılan hatalar

- **Kilidi açmayı unutmak:** Transfer kodu doğru girilse bile kilit açık değilse işlem reddedilir.
- **Kodu yanlış kopyalamak:** Transfer kodları büyük küçük harfe duyarlıdır ve sonunda boşluk kalması işlemin başarısız olmasına yeter.
- **DNS kayıtlarını yedeklememek:** En pahalıya mal olan hata budur. Transfer biter, eski firmanın DNS hizmeti kapanır ve MX kayıtları kaybolduğu için e-postalar günlerce gelmez.
- **Erişilemeyen bir e-posta adresi:** Onay e-postası artık kullanılmayan bir adrese gider ve transfer beklemede kalır.
- **Son güne bırakmak:** Bitiş tarihine birkaç gün kala başlatılan transferler, süre dolduğunda karmaşık bir hal alabilir.
- **Transfer sırasında bilgi değiştirmek:** İşlem sürerken alan adı sahibi bilgilerini güncellemek, bazı durumlarda yeni bir 60 günlük kilide yol açabilir.

## Sonuç

Alan adı transferi, hazırlığı doğru yapıldığında sade bir işlemdir: kilidi açın, transfer kodunu alın, yeni firmada sipariş verin ve onayları takip edin. Asıl dikkat edilmesi gereken nokta, transferin kendisinden çok DNS kayıtlarınızın korunmasıdır.

Transfer sırasında takıldığınız bir nokta olursa ya da DNS kayıtlarınızın taşınmasında yardım isterseniz, [destek ekibimize](/iletisim) yazabilirsiniz.
