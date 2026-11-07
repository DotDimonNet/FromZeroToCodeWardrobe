"""Download the openly licensed sample photographs and retain source provenance."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
import json, io, re, html
from urllib.request import Request, urlopen
from PIL import Image

root=Path(__file__).resolve().parents[1]
assets=[
 ('white-tee','White-tshirt.jpg','Paulinaela'),
 ('black-tee','T-shirt mocup.jpg','EdaBojci'),
 ('gray-tee','T-shirt mocup gray.jpg','EdaBojci'),
 ('denim-shirt','Chemise en jean.JPG','Dinkum'),
 ('jeans','Pantalones jeans (versión 2).jpg','El Nuevo Doge'),
 ('dark-jeans','Pantalones jeans (versión 4).jpg','El Nuevo Doge'),
 ('striped-knit','Marinière sweater close-up.jpg','DimiTalen'),
 ('sneakers','New Balance 550.jpg','LeDroider'),
 ('retro-shoes','Adidas Gazelle Indoor.jpg','LeDroider'),
 ('high-tops','Nike Terminator.jpg','LeDroider'),
 ('coat','Modern-Civilian-Peacoat.png','CommieKarlovy'),
]
def fetch(a):
 key,title,author=a
 page='https://commons.wikimedia.org/wiki/File:'+quote(title.replace(' ','_'))
 def get(url):
  with urlopen(Request(url,headers={'User-Agent':'WardrobeCourse/1.0 (educational image attribution)'}),timeout=120) as r: return r.read()
 page_html=get(page).decode()
 if 'CC0 1.0' not in page_html: raise RuntimeError('CC0 not found: '+title)
 match=re.search(r'class="fullImageLink"[^>]*>\s*<a href="([^"]+)"',page_html)
 if not match: raise RuntimeError('Original missing: '+title)
 original=html.unescape(match.group(1))
 im=Image.open(io.BytesIO(get(original))).convert('RGB'); im.thumbnail((960,960))
 destination=root/'client/public/images'/f'{key}.webp'
 im.save(destination,'WEBP',quality=86)
 return dict(id=key,title=title,author=author,source=page,original=original,
             license='CC0 1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',
             imageUrl=f'/images/{key}.webp',changes='Resized and converted to WebP',checked='2026-11-07')

if __name__=='__main__':
 records=[]
 with ThreadPoolExecutor(max_workers=4) as pool:
  for r in pool.map(fetch,assets): records.append(r); print(r['id'],flush=True)
 (root/'client/public/image-credits.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
