from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
SRC=Image.open('/workspace/oc-platform/landing-v1.1-src/design-ref.png').convert('RGB')
OUT='/workspace/oc-platform/landing-v1.1/assets/img/'
def vinterp(im, box):
    a=np.array(im).astype(float); x0,y0,x1,y1=box
    T=a[y0-1,x0:x1].copy(); B=a[y1,x0:x1].copy(); h=y1-y0
    for j in range(h):
        t=(j+.5)/h; a[y0+j,x0:x1]=T*(1-t)+B*t
    return Image.fromarray(a.clip(0,255).astype('uint8'))
def hinterp(im, box):
    """inpaint rect by linear interpolation between left/right (or top/bottom) border pixels"""
    a=np.array(im).astype(float); x0,y0,x1,y1=box
    L=a[y0:y1,x0-1]; R=a[y0:y1,min(x1,a.shape[1]-1)]
    T=a[y0-1,x0:x1]; B=a[min(y1,a.shape[0]-1),x0:x1]
    w=x1-x0; h=y1-y0
    for i in range(w):
        t=(i+.5)/w; a[y0:y1,x0+i]=(L*(1-t)+R*t)*.5
    for j in range(h):
        t=(j+.5)/h; a[y0+j,x0:x1]+=(T*(1-t)+B*t)*.5
    return Image.fromarray(a.clip(0,255).astype('uint8'))
def feather(img, inset, radius):
    w,h=img.size; m=Image.new('L',(w,h),0); d=ImageDraw.Draw(m)
    d.rounded_rectangle([inset,inset,w-inset,h-inset],radius=inset*2,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(radius)); img=img.convert('RGBA'); img.putalpha(m); return img
def crop(name, box, fills=(), scale=2, inset=None, blur=None, fmt='png', alpha=True, sharpen=True):
    im=SRC.copy()
    for f in fills: im=vinterp(im,f)
    c=im.crop(box); c=c.resize((c.width*scale,c.height*scale),Image.LANCZOS)
    if sharpen: c=c.filter(ImageFilter.UnsharpMask(radius=1.6,percent=60,threshold=2))
    if alpha:
        s=min(c.size); inset=inset if inset is not None else int(s*.05); blur=blur if blur is not None else int(s*.04)
        c=feather(c,inset,blur)
    c.save(OUT+name+'.'+fmt, optimize=True) if fmt=='png' else c.convert('RGB').save(OUT+name+'.'+fmt,quality=88)
    print(name,c.size)
# hero pair: inpaint chips & caption inside crop area
crop('hero-pair',(396,34,716,372),fills=[(671,134,716,180),(660,220,716,264),(672,322,716,350),(320,198,434,284)])
crop('ip-bailion',(58,1150,198,1282))
crop('ip-teacher',(46,1284,198,1410))
crop('ip-octopus',(424,1150,584,1286))
crop('ip-pets',(420,1298,608,1408))
crop('def-octopus',(36,860,172,1046))
crop('voice-octopus',(345,855,418,912),inset=4,blur=4)
for i,b in enumerate([(648,856,708,908),(713,852,778,910),(648,912,706,964),(713,912,778,968)]):
    crop(f'anim-{i+1}',b,inset=3,blur=3,scale=3)
# device + phone; blank the phone bubble text (white bubble) -> HTML overlay
im2=SRC.copy(); d=ImageDraw.Draw(im2)
d.rounded_rectangle([579,1471,628,1506],radius=10,fill=(255,255,255))
SRC_BAK=SRC; SRC=im2
crop('device-phone',(416,1424,682,1634))
SRC=SRC_BAK
crop('cta-group',(378,1650,810,1894),inset=12,blur=28)
crop('girl',(404,36,556,372),fills=[(320,198,434,284)])
crop('boy',(546,36,716,372),fills=[(671,134,716,180),(660,220,716,264),(672,322,716,350)])
