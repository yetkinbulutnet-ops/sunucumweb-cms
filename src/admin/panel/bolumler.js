import { House, Images, Information, Phone, Paragraph, Layout, Globe, Book, Briefcase, Star, Store, PriceTag, Sparkle, Folder, Server, Code, Feather, Hashtag, User, Bell, Gift, Key, Crown, Mail, Cog, Paperclip, Message, Pencil } from '@strapi/icons';

const liste = (ad) => `/content-manager/collection-types/api::${ad}.${ad}`;
const tekil = (ad) => `/content-manager/single-types/api::${ad}.${ad}`;

export const BOLUMLER = [
  {
    ad: 'Sayfalar',
    aciklama: 'Sitedeki sayfaların yazıları, görselleri ve bölümleri',
    ikon: Layout,
    renk: '#2dd4bf',
    ogeler: [
      { ad: 'Ana sayfa', aciklama: 'Rakamlar, özellikler, paketler, SSS', ikon: House, yol: tekil('anasayfa') },
      { ad: 'Ana sayfa slaytları', aciklama: 'En üstteki büyük görseller', ikon: Images, yol: liste('anasayfa-slayti'), uid: 'api::anasayfa-slayti.anasayfa-slayti' },
      { ad: 'Hakkımızda', aciklama: 'Hikâye, fotoğraflar, veri merkezi', ikon: Information, yol: tekil('hakkimizda') },
      { ad: 'İletişim sayfası', aciklama: 'Kanallar ve form konuları', ikon: Phone, yol: tekil('iletisim') },
      { ad: 'Sayfa başlıkları', aciklama: 'Kampanyalar, legal, markalar sayfaları', ikon: Paragraph, yol: tekil('sayfa-metni') },
      { ad: 'Ürün sayfası ortak', aciklama: 'Tüm ürünlerde görünen bölümler', ikon: Layout, yol: tekil('urun-sayfasi') },
      { ad: 'Alan adı sayfası', aciklama: 'Uzantı fiyatları, adımlar, SSS', ikon: Globe, yol: tekil('alan-adi-sayfasi') },
      { ad: 'Yasal belgeler', aciklama: 'Sözleşmeler ve politikalar', ikon: Book, yol: liste('yasal-belge'), uid: 'api::yasal-belge.yasal-belge' },
      { ad: 'Ticari bilgiler', aciklama: 'Şirket bilgileri, resmî kayıtlar', ikon: Briefcase, yol: tekil('ticari-bilgi') },
      { ad: 'Markalar', aciklama: 'Referans ve altyapı logoları', ikon: Star, yol: liste('marka'), uid: 'api::marka.marka' },
    ],
  },
  {
    ad: 'Ürünler ve satış',
    aciklama: 'Hizmetler, paketler, fiyatlar ve kampanyalar',
    ikon: Store,
    renk: '#60a5fa',
    ogeler: [
      { ad: 'Ürünler', aciklama: 'Hosting, sunucu ve diğer hizmetler', ikon: Store, yol: liste('urun'), uid: 'api::urun.urun' },
      { ad: 'Paketler', aciklama: 'Ürünlerin fiyatlı planları', ikon: PriceTag, yol: liste('plan'), uid: 'api::plan.plan' },
      { ad: 'Kampanyalar', aciklama: 'Süreli indirimler', ikon: Sparkle, yol: liste('kampanya'), uid: 'api::kampanya.kampanya' },
      { ad: 'Hazır yazılımlar', aciklama: 'Satıştaki hazır yazılımlar', ikon: Code, yol: liste('hazir-yazilim'), uid: 'api::hazir-yazilim.hazir-yazilim' },
      { ad: 'Yazılım kategorileri', aciklama: 'Hazır yazılım grupları', ikon: Folder, yol: liste('yazilim-kategorisi'), uid: 'api::yazilim-kategorisi.yazilim-kategorisi' },
      { ad: 'Araçlar', aciklama: 'WHOIS, DNS, SSL vb. araç sayfaları', ikon: Server, yol: liste('arac'), uid: 'api::arac.arac' },
      { ad: 'DNS kayıt tipleri', aciklama: 'DNS aracının açıklamaları', ikon: Hashtag, yol: liste('dns-kayit-tipi'), uid: 'api::dns-kayit-tipi.dns-kayit-tipi' },
    ],
  },
  {
    ad: 'Blog',
    aciklama: 'Yazılar, kategoriler ve yazarlar',
    ikon: Feather,
    renk: '#a78bfa',
    ogeler: [
      { ad: 'Blog yazıları', aciklama: 'Yeni yazı ekle, düzenle, yayınla', ikon: Pencil, yol: liste('blog-yazisi'), uid: 'api::blog-yazisi.blog-yazisi' },
      { ad: 'Kategoriler', aciklama: 'Blog kategorileri', ikon: Folder, yol: liste('blog-kategorisi'), uid: 'api::blog-kategorisi.blog-kategorisi' },
      { ad: 'Yazarlar', aciklama: 'Yazar adı ve bilgisi', ikon: User, yol: liste('blog-yazari'), uid: 'api::blog-yazari.blog-yazari' },
    ],
  },
  {
    ad: 'Pazarlama',
    aciklama: 'Duyuru bandı, çark ve bülten',
    ikon: Gift,
    renk: '#f59e0b',
    ogeler: [
      { ad: 'Duyurular', aciklama: 'Sitenin üstündeki duyuru bandı', ikon: Bell, yol: liste('duyuru'), uid: 'api::duyuru.duyuru' },
      { ad: 'Çark ayarları', aciklama: 'Aç/kapat, dönem, tekrar hakkı, şans özeti', ikon: Cog, yol: tekil('cark-ayari') },
      { ad: 'Çark ödülleri', aciklama: 'Dilimler ve şans puanları', ikon: Gift, yol: liste('cark-odulu'), uid: 'api::cark-odulu.cark-odulu' },
      { ad: 'Çark kuponları', aciklama: 'Kupon havuzu, verilenler', ikon: Key, yol: liste('cark-kuponu'), uid: 'api::cark-kuponu.cark-kuponu' },
      { ad: 'Çark katılımları', aciklama: 'Çarkı çevirenler', ikon: Crown, yol: liste('cark-katilimi'), uid: 'api::cark-katilimi.cark-katilimi' },
      { ad: 'Bülten ayarları', aciklama: 'Formları aç/kapat, çift onay', ikon: Cog, yol: tekil('bulten-ayari') },
      { ad: 'Bülten aboneleri', aciklama: 'Tüm formlardan gelen aboneler', ikon: Mail, yol: liste('abone'), uid: 'api::abone.abone' },
    ],
  },
  {
    ad: 'Site ayarları',
    aciklama: 'Menü, alt bilgi, firma bilgileri, metinler',
    ikon: Cog,
    renk: '#f472b6',
    ogeler: [
      { ad: 'Genel ayarlar', aciklama: 'Menü, alt bilgi, firma, sosyal medya', ikon: Cog, yol: tekil('site-ayari') },
      { ad: 'Sitedeki yazılar', aciklama: 'Buton, uyarı ve arayüz metinleri', ikon: Paragraph, yol: liste('arayuz-metni'), uid: 'api::arayuz-metni.arayuz-metni' },
      { ad: 'Yapay zekâ ayarları', aciklama: 'Alan adı bulucunun talimatları', ikon: Code, yol: '/yonetim/yapay-zeka' },
      { ad: 'Medya kütüphanesi', aciklama: 'Görseller ve dosyalar', ikon: Paperclip, yol: '/plugins/upload' },
      { ad: 'Gelen mesajlar', aciklama: 'İletişim formu mesajları', ikon: Message, yol: '/mesajlar', uid: 'api::iletisim-mesaji.iletisim-mesaji' },
    ],
  },
];

export const KISAYOLLAR = [
  { ad: 'Blog yazısı ekle', ikon: Pencil, yol: `${liste('blog-yazisi')}/create`, renk: '#a78bfa' },
  { ad: 'Ana sayfa', ikon: House, yol: tekil('anasayfa'), renk: '#2dd4bf' },
  { ad: 'Ürünler', ikon: Store, yol: liste('urun'), renk: '#60a5fa' },
  { ad: 'Kampanyalar', ikon: Sparkle, yol: liste('kampanya'), renk: '#f59e0b' },
  { ad: 'Duyuru bandı', ikon: Bell, yol: liste('duyuru'), renk: '#fb7185' },
  { ad: 'Çark', ikon: Gift, yol: tekil('cark-ayari'), renk: '#f472b6' },
  { ad: 'Genel ayarlar', ikon: Cog, yol: tekil('site-ayari'), renk: '#38bdf8' },
  { ad: 'Medya', ikon: Paperclip, yol: '/plugins/upload', renk: '#34d399' },
];

