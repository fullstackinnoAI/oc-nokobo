// 用法: (cd tools && npm i puppeteer-core) && node tools/screenshot.js $(pwd)   — 需本机 Chrome
const puppeteer = require('puppeteer-core'); const path=require('path');
const root=process.argv[2]||'/workspace/oc-platform/landing-v1.1';
(async () => {
  const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const errs=[];
  for (const [name,w,h,mobile] of [['desktop-1440',1440,900,false],['mobile-390',390,844,true]]) {
    const p = await b.newPage(); p.on('pageerror',e=>errs.push(name+': '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.setViewport({width:w,height:h,deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
    await p.goto('file://'+root+'/index.html?static',{waitUntil:'load'});
    await p.evaluate(async()=>{for(const i of document.images){i.loading='eager'; if(!i.complete) await new Promise(r=>{i.onload=i.onerror=r})}});
    await new Promise(r=>setTimeout(r,1500));
    console.log(name,'overflowX',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'H',await p.evaluate(()=>document.documentElement.scrollHeight));
    await p.screenshot({path:root+'/screenshots/'+name+'.png',fullPage:true}); await p.close();
  }
  console.log(errs.join('\n')); await b.close();
})();
