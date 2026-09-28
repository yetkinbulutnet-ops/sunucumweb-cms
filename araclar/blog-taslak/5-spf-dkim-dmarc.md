baslik: E-postalarınız neden spama düşüyor? SPF, DKIM ve DMARC'ı sade bir dille anlattık
slug: spf-dkim-dmarc-nedir
kategori: guvenlik
seoBaslik: E-postalar Neden Spama Düşer? SPF, DKIM ve DMARC Rehberi
seoAciklama: Kurumsal e-postalarınızın spama düşmemesi için SPF, DKIM ve DMARC kayıtlarının ne işe yaradığını, nasıl kurulduğunu ve sık yapılan hataları anlattık.
ozet: Müşterinize gönderdiğiniz teklif e-postası spam klasörüne mi düşüyor? Çoğu zaman sebep içerik değil, alan adınızda eksik ya da hatalı kurulmuş üç DNS kaydı. SPF, DKIM ve DMARC'ın ne işe yaradığını ve nasıl kurulacağını anlattık.
etiketler: SPF|DKIM|DMARC|e-posta güvenliği|spam|kurumsal e-posta
S: SPF kaydında ~all mı, -all mı kullanmalıyım?
C: E-posta gönderen tüm servislerinizi SPF kaydına eklediğinizden eminseniz -all daha katı ve daha güvenlidir. Emin değilseniz ~all ile başlayıp DMARC raporlarını birkaç hafta izlemek, ardından -all'a geçmek daha güvenli bir yoldur. Günümüzde asıl kararı DMARC politikası verdiği için ~all ile -all arasındaki fark eskisi kadar büyük değildir.
S: Birden fazla SPF kaydı ekleyebilir miyim?
C: Hayır. Bir alan adında yalnızca bir SPF kaydı olmalıdır. İki ayrı v=spf1 kaydı bulunursa, alıcı sunucular SPF'yi geçersiz sayar. Farklı servisleri tek bir kayıt içinde include ifadeleriyle birleştirmeniz gerekir.
S: DMARC'ı doğrudan p=reject ile başlatabilir miyim?
C: Başlatabilirsiniz ama önerilmez. Adınıza e-posta gönderen ve unuttuğunuz bir servis varsa (fatura sistemi, form eklentisi, CRM gibi), o servisin e-postaları anında reddedilir. p=none ile başlayıp raporları inceledikten sonra kademeli olarak sıkılaştırmak daha doğrudur.
---
Önemli bir teklifi e-postayla gönderdiniz, karşı taraf günlerce yanıt vermedi. Sonra telefonda "spam klasörüne düşmüş" dediler. Bu durum kurumsal e-posta kullanan neredeyse her işletmenin başına gelmiştir ve çoğu zaman sebep e-postanın içeriği değil, alan adınızın DNS ayarlarıdır.

Gmail, Outlook ve Yahoo gibi büyük e-posta sağlayıcıları, bir e-postanın gerçekten sizin alan adınızdan gelip gelmediğini üç kayda bakarak anlamaya çalışır: SPF, DKIM ve DMARC. Bu yazıda üçünün ne işe yaradığını, nasıl kurulduğunu ve en sık yapılan hataları anlatıyoruz.

## Neden bu kadar önemli hale geldi?

E-posta protokolü, ilk tasarlandığında kimlik doğrulama düşünülerek yazılmadı. Herhangi bir sunucu, gönderen adresine istediği alan adını yazabilir. Oltalama (phishing) saldırılarının büyük kısmı da tam olarak bunu kullanır: bankanızdan, kargo firmasından ya da sizin şirketinizden geliyormuş gibi görünen sahte e-postalar.

Büyük e-posta sağlayıcıları bu yüzden kuralları her yıl biraz daha sıkılaştırıyor. Gmail ve Yahoo, 2024'ten itibaren günde yüksek hacimde e-posta gönderen alan adları için SPF, DKIM ve DMARC'ın üçünü de zorunlu tuttu. Daha az e-posta gönderenler için de en azından SPF ya da DKIM şartı var. Kısacası, bu kayıtlar artık "olsa iyi olur" değil, e-postalarınızın ulaşması için temel gereksinim.

## SPF: Benim adıma kimler e-posta gönderebilir?

SPF (Sender Policy Framework), alan adınız adına e-posta göndermeye yetkili sunucuların listesidir. Alan adınızın DNS'ine TXT kaydı olarak eklenir. Alıcı sunucu, gelen e-postanın hangi IP adresinden geldiğine bakar ve bu IP'nin sizin SPF listenizde olup olmadığını kontrol eder.

Örnek bir SPF kaydı:

```
v=spf1 mx a ip4:203.0.113.10 include:_spf.google.com ~all
```

Bu kayıt şunu söyler:

- **mx:** Alan adının MX kayıtlarında görünen sunucular e-posta gönderebilir.
- **a:** Alan adının A kaydının gösterdiği sunucu e-posta gönderebilir.
- **ip4:203.0.113.10:** Bu IP adresi e-posta gönderebilir.
- **include:_spf.google.com:** Google Workspace'in sunucuları da e-posta gönderebilir.
- **~all:** Bunların dışındaki her kaynak şüphelidir (soft fail).

### SPF'de sık yapılan hatalar

**İki ayrı SPF kaydı:** Yeni bir servis eklerken mevcut kaydı düzenlemek yerine ikinci bir v=spf1 kaydı eklemek çok yaygın bir hatadır. Bu durumda SPF tamamen geçersiz sayılır. Her zaman tek kayıt olmalı.

**10 sorgu sınırı:** SPF kaydı değerlendirilirken en fazla 10 DNS sorgusu yapılabilir. include, a, mx gibi her ifade bu sayıya dahildir ve bir include'un içindeki include'lar da sayılır. Çok sayıda servis kullanıyorsanız bu sınır kolayca aşılır ve SPF hata verir.

**Unutulan servisler:** Web sitenizin iletişim formu, fatura programınız, CRM ya da toplu e-posta servisiniz de sizin adınıza e-posta gönderiyor olabilir. Bunlar SPF'de yoksa, gönderdikleri e-postalar doğrulamadan geçemez.

## DKIM: Bu e-posta yolda değiştirildi mi?

DKIM (DomainKeys Identified Mail), e-postaya dijital bir imza ekler. Gönderen sunucu, e-postanın başlıklarını ve içeriğini gizli bir anahtarla imzalar. Bu imzayı doğrulamak için gereken açık anahtar ise alan adınızın DNS'inde TXT kaydı olarak yayınlanır.

DKIM kaydı, seçici (selector) adı verilen bir önekle yayınlanır. Örneğin seçici adı "default" ise kayıt default._domainkey.alanadiniz.com adresinde durur ve şuna benzer:

```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

DKIM'in iki faydası vardır: e-postanın gerçekten sizin yetkili sunucunuzdan çıktığını kanıtlar ve e-posta yolda değiştirilirse imza bozulacağı için bunu ortaya çıkarır.

cPanel kullanıyorsanız, E-posta Teslim Edilebilirliği (Email Deliverability) bölümünde DKIM kaydının durumunu görebilir ve genellikle tek tıkla etkinleştirebilirsiniz. Alan adınızın DNS'i başka bir yerde yönetiliyorsa (örneğin Cloudflare), cPanel'in verdiği kaydı oraya elle eklemeniz gerekir. En sık karşılaştığımız DKIM sorunu budur: cPanel'de etkin görünür ama DNS başka yerde olduğu için dışarıdan hiç görünmez.

## DMARC: Doğrulamadan geçemeyen e-postalara ne olsun?

SPF ve DKIM, e-postanın doğrulanıp doğrulanamadığını söyler ama doğrulanamazsa ne yapılacağını söylemez. DMARC bu boşluğu doldurur. Alan adı sahibi olarak alıcı sunuculara şunu söylersiniz: "Benim adımla gelen ve doğrulamadan geçemeyen e-postalara şu şekilde davran ve bana rapor gönder."

DMARC kaydı _dmarc.alanadiniz.com adresinde TXT kaydı olarak yayınlanır:

```
v=DMARC1; p=none; rua=mailto:dmarc@alanadiniz.com
```

**p** değeri politikadır ve üç seçeneği vardır:

- **none:** Hiçbir işlem yapma, sadece rapor gönder. Başlangıç için idealdir.
- **quarantine:** Doğrulanamayan e-postaları spam klasörüne koy.
- **reject:** Doğrulanamayan e-postaları tamamen reddet.

**rua** adresi, alıcı sunucuların size günlük özet raporlar göndereceği adrestir. Bu raporlar, adınıza kimlerin e-posta gönderdiğini görmenizi sağlar. Hem unuttuğunuz meşru servisleri hem de alan adınızı taklit etmeye çalışanları buradan fark edersiniz.

DMARC'ın önemli bir detayı hizalamadır (alignment). E-postanın SPF ya da DKIM'den geçmesi yetmez, doğrulanan alan adının e-postanın From satırındaki alan adıyla uyuşması gerekir. Örneğin bir e-posta servisi kendi alan adıyla DKIM imzası atıyorsa, bu imza sizin DMARC'ınız için sayılmaz. Bu yüzden toplu e-posta servislerinde "kendi alan adınızla imzalama" ayarını mutlaka yapmanız gerekir.

## Kademeli geçiş planı

DMARC'ı güvenli şekilde devreye almak için şu sırayı öneriyoruz:

1. SPF kaydınızı oluşturun ve adınıza e-posta gönderen tüm servisleri ekleyin.
2. E-posta sunucunuzda ve kullandığınız diğer servislerde DKIM'i etkinleştirin.
3. DMARC'ı p=none ile yayınlayın ve rua adresi tanımlayın.
4. İki ila dört hafta boyunca raporları inceleyin. Tanımadığınız ama meşru olan kaynakları SPF ve DKIM'e ekleyin.
5. Politikayı p=quarantine'e çekin ve bir süre daha izleyin.
6. Her şey yolundaysa p=reject'e geçin.

## Kayıtlarınızı kontrol edin

Alan adınızın SPF, DKIM, DMARC ve MX kayıtlarının doğru kurulup kurulmadığını [e-posta kontrol aracımızla](/araclar/eposta) tek seferde görebilirsiniz. Sunucunuzun IP adresi bir kara listeye girdiyse, bu da e-postaların spama düşmesine yol açar. Bunu da [kara liste sorgulama aracımızla](/araclar/karaliste) kontrol edebilirsiniz.

## DNS dışında dikkat edilmesi gerekenler

Üç kayıt da doğru olsa bile e-postalarınız yine spama düşüyorsa, şu noktalara bakın:

- **Ters DNS (PTR) kaydı:** E-posta gönderen sunucunun IP adresi, anlamlı bir sunucu adına çözülmelidir. Bu kayıt hosting ya da sunucu firmanız tarafından ayarlanır.
- **Gönderim alışkanlığı:** Yeni bir alan adından bir anda binlerce e-posta göndermek, içerik ne olursa olsun şüphe uyandırır. Gönderim hacmini kademeli artırın.
- **Liste temizliği:** Geçersiz adreslere sürekli e-posta göndermek itibarınızı düşürür. Geri dönen adresleri listeden çıkarın.
- **Abonelikten çıkma bağlantısı:** Toplu gönderimlerde görünür bir abonelikten çıkma bağlantısı ve tek tıkla çıkış başlığı bulunmalıdır.

## Sonuç

SPF, adınıza kimin e-posta gönderebileceğini; DKIM, e-postanın yolda değiştirilmediğini; DMARC ise doğrulanamayan e-postalara ne olacağını belirler. Üçü birlikte kurulduğunda hem e-postalarınızın gelen kutusuna ulaşma ihtimali artar hem de alan adınızın dolandırıcılar tarafından taklit edilmesi zorlaşır.

SunucumWEB [web hosting](/web-hosting) paketlerindeki e-posta hesaplarında SPF ve DKIM kayıtları panelden yönetilebiliyor. Alan adınızın kayıtlarında emin olamadığınız bir nokta varsa, [bize yazın](/iletisim), birlikte kontrol edelim.
