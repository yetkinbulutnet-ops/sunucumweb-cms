const fs=require('fs'),p=require('path');
const map={admin:'', 'content-manager':'content-manager','content-releases':'content-releases','content-type-builder':'content-type-builder',email:'email',i18n:'i18n','plugin-users-permissions':'users-permissions','review-workflows':'review-workflows',upload:'upload'};
const load=f=>{try{const m=require(p.resolve(f));return m.default||m}catch{return {}}};
const eksik={},strapi={};let tot=0,tr_tot=0;
for(const [dir,pre] of Object.entries(map)){
  const base=dir==='admin'?'admin/dist/admin/admin/src/translations':dir+'/dist/admin/translations';
  const en=load(base+'/en.json.js'),tr=load(base+'/tr.json.js');
  let n=0;
  for(const [k,v] of Object.entries(en)){ if(typeof v!=='string')continue; const K=pre?pre+'.'+k:k; tot++;
    if(!tr[k]||tr[k]===v){eksik[K]=v;n++} else tr_tot++;
    const t=tr[k]&&tr[k]!==v?tr[k]:null; if(/strapi/i.test(t||v)) strapi[K]={en:v,tr:t};
  }
  console.log(dir,Object.keys(en).length,'eksik',n);
}
console.log('toplam',tot,'tr-var',tr_tot,'eksik',Object.keys(eksik).length,'strapi-gecen',Object.keys(strapi).length);
fs.writeFileSync('eksik.json',JSON.stringify(eksik,null,1));
const trAll={};for(const [dir,pre] of Object.entries(map)){const base=dir==='admin'?'admin/dist/admin/admin/src/translations':dir+'/dist/admin/translations';const en=load(base+'/en.json.js'),tr=load(base+'/tr.json.js');for(const [k,v] of Object.entries(tr)){if(typeof v==='string'&&en[k]!==undefined&&en[k]!==v)trAll[pre?pre+'.'+k:k]=v}}
fs.writeFileSync('mevcut-tr.json',JSON.stringify(trAll,null,1));
fs.writeFileSync('strapi.json',JSON.stringify(strapi,null,1));
