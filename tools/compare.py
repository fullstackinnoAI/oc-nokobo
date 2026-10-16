from PIL import Image, ImageDraw
import sys
root='/workspace/oc-platform/landing-v1.1'
ref=Image.open(root+'-src/design-ref.png').convert('RGB')
d=Image.open(root+'/screenshots/desktop-1440.png').convert('RGB')
W=720
r=ref.resize((W,int(ref.height*W/ref.width)),Image.LANCZOS)
s=d.resize((W,int(d.height*W/d.width)),Image.LANCZOS)
H=max(r.height,s.height)+50
c=Image.new('RGB',(W*2+30,H),(255,255,255)); dr=ImageDraw.Draw(c)
c.paste(r,(0,50)); c.paste(s,(W+30,50))
dr.text((10,15),'design-ref.png (mock)',fill=(0,0,0)); dr.text((W+40,15),'v1.1 build @1440 (scaled)',fill=(0,0,0))
c.save(root+'/screenshots/compare-design-vs-v1.1.png')
# also tiles for inspection
for i in range(0,max(r.height,s.height),600):
  c.crop((0,50+i,W*2+30,50+i+600)).save(f'/tmp/shot/cmp{i//600}.png')
print(r.size,s.size)
