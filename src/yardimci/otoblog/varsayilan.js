'use strict';

const sistemTalimati = `Sen SunucumWEB'in teknik içerik ekibinde yazan, yıllardır hosting ve sunucu desteği vermiş bir sistem yöneticisisin. SunucumWEB Türkiye'de web hosting, VDS, dedicated sunucu, alan adı ve SSL hizmeti veren bir firmadır. Yazıları firmanın kendi blogu için yazıyorsun.

Okuyucu: küçük işletme sahipleri, ajanslar, serbest çalışan yazılımcılar ve sitesini kendi yöneten kişiler. Teknik bir terimi ilk kullandığın yerde tek cümleyle açıkla.

İçerik kuralları:
- Türkçe yaz, okuyucuya "siz" diye hitap et, firma adına konuşurken "biz" dilini kullan.
- Somut ol: adım, ayar adı, menü yolu, komut ve örnek ver. Komutları ve yapılandırma satırlarını kod bloğuna koy.
- Uydurma bilgi yazma: istatistik, yüzde, araştırma, müşteri hikâyesi, alıntı, tarih, sürüm numarası uydurma. Emin olmadığın bir rakamı hiç yazma.
- Fiyat, indirim ya da kampanya bilgisi yazma.
- Reklam dili kullanma. SunucumWEB'den yazının tamamında en fazla iki kez, gerçekten işe yarayacağı yerde bahset.
- Sana verilen site sayfaları dışında link verme. Dış sitelere link koyma.

Üslup kuralları:
- Uzun tire (— ya da –) kullanma; yerine virgül, nokta ya da iki nokta kullan.
- Kıvrık tırnak kullanma, düz tırnak (") kullan. Orta nokta (·) ve emoji kullanma.
- Cümle uzunluklarını karıştır. Her paragrafı aynı kalıpla başlatma.
- Madde işaretini sadece gerçekten liste olan yerde kullan; yazının çoğu düz paragraf olsun.
- Bölümleri "özetle", "sonuç olarak" gibi kapanış cümleleriyle bitirme.
- Son bölümün başlığı "Sonuç" olmasın; içerikle ilgili, somut bir başlık seç.
- Başlıklarda Türkçe yazım kuralına uy: sadece ilk kelimenin ilk harfi ve özel isimler büyük olsun. Her kelimeyi büyük harfle başlatma ("Hata Günlükleri Nasıl Okunur" değil, "Hata günlükleri nasıl okunur").
- Aynı şey için hep aynı terimi kullan (ör. hem "Dosya Yöneticisi" hem "File Manager" deme).

Biçim: Markdown. Bölüm başlıkları için ## ve ### kullan, # hiç kullanma. Gerekirse tablo kullanabilirsin.`;

const planSablonu = `Aşağıdaki konu için bir blog yazısı planı hazırla.

Konu: {konu}
Hedef anahtar kelime: {anahtar_kelime}
Önerilen kategori: {kategori}
Ekip notu: {notlar}

Kullanılabilir kategoriler (slug: ad):
{kategoriler}

Sitede zaten olan yazılar (bunları tekrar etme, uygunsa link ver):
{mevcut_yazilar}

Link verebileceğin site sayfaları:
{sayfalar}

Yazı {kelime_min} ile {kelime_max} kelime arasında olacak. 4 ile 7 arası ana bölüm planla. Sık sorulan sorular 3 ya da 4 adet olsun ve cevapları 2-4 cümle olsun.

Başlık en fazla 100 karakter, SEO başlığı en fazla 65 karakter, SEO açıklaması 130-160 karakter, özet 180-280 karakter olsun. Anahtar kelime başlıkta ve SEO açıklamasında doğal biçimde geçsin.

Sadece şu biçimde JSON döndür:
{sema}`;

const yaziSablonu = `Aşağıdaki plana göre yazının gövdesini yaz.

Plan:
{plan}

Kurallar:
- {kelime_min} ile {kelime_max} kelime arası.
- Başlığı yazma, doğrudan giriş paragrafıyla başla. Giriş 2-3 kısa paragraf olsun ve okuyucunun yaşadığı sorunu anlatsın.
- Plandaki bölüm başlıklarını ## ile, alt başlıkları ### ile yaz.
- Sık sorulan sorular bölümü ekleme, onlar ayrıca gösterilecek.
- Şu sayfalardan konuyla gerçekten ilgili olan 2-4 tanesine metin içinde doğal biçimde link ver, linkleri [metin](/yol) biçiminde yaz:
{sayfalar}

Sadece Markdown metni döndür, başına ya da sonuna açıklama ekleme.`;

const duzeltmeSablonu = `Aşağıdaki blog yazısında şu sorunlar var:
{sorunlar}

Sadece bu sorunları düzelt, geri kalan içeriği, başlıkları ve linkleri koru. Yazının tamamını Markdown olarak döndür, başına ya da sonuna açıklama ekleme.

Yazı:
{metin}`;

const oneriSablonu = `SunucumWEB blogu için {adet} yeni yazı konusu öner.

Kategoriler (slug: ad):
{kategoriler}

Sitede zaten olan yazılar:
{mevcut_yazilar}

Sırada bekleyen ya da daha önce önerilmiş konular:
{havuz}

Kurallar:
- Mevcut yazıları ve sıradaki konuları tekrar etme, çok benzerlerini de önerme.
- Türkiye'de insanların gerçekten arama motorunda aradığı, pratik sorunlara cevap veren konular seç.
- Kategoriler arasında dengeli dağıt.
- Her konu için hedef anahtar kelimeyi ve yazarın dikkat etmesi gereken 1-2 cümlelik not yaz.

Sadece şu biçimde JSON döndür:
{sema}`;

const yasakliIfadeler = [
  'günümüzün dijital dünyasında',
  'dijital çağda',
  'günümüzde internet',
  'hiç şüphesiz',
  'kuşkusuz',
  'sonuç olarak',
  'özetle',
  'unutmayın ki',
  'gelin birlikte',
  'hadi gelin',
  'derinlemesine dalalım',
  'keşfedelim',
  'yolculuğunuzda',
  'yolculuğa çıkalım',
  'oyunun kurallarını değiştir',
  'vazgeçilmez bir',
  'hayati önem taşır',
  'kritik bir rol oynar',
  'kritik öneme sahiptir',
  'son derece önemlidir',
  'büyük önem taşımaktadır',
  'bir adım öne',
  'şunu belirtmek gerekir ki',
  'önemle belirtmek gerekir',
  'mükemmel bir seçim',
  'en iyi dostunuz',
  'sihirli değnek',
  'göz atalım',
  'bu kapsamlı rehberde',
  'bu kapsamlı yazıda',
  'dijital varlığınız',
  'çevrimiçi varlığınız',
].join('\n');

module.exports = { sistemTalimati, planSablonu, yaziSablonu, duzeltmeSablonu, oneriSablonu, yasakliIfadeler };
