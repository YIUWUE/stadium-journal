import requests, pathlib, json, io, re, html, concurrent.futures
from PIL import Image, ImageDraw
root=pathlib.Path(__file__).parent
data=json.loads((root/'expanded-candidates.json').read_text(encoding='utf8'))
exact=json.loads((root/'extra-exact.json').read_text(encoding='utf8'))['query']['pages']
galata=json.loads((root/'galatasaray-candidates.json').read_text(encoding='utf8'))['query']['pages']
selection={'etihad':'City of Manchester Stadium, October 2015 - 01.JPG','tottenham':'Tottenham Hotspur Stadium.jpg','stamfordbridge':'London Stamford Bridge 2.jpg','metropolitano':'Estadio Metropolitano - Madrid 008.jpg','dragao':'Estadio do Dragao 20050805.jpg','luz':'Estádio da Luz - Lisboa2.jpg','galatasaray':'Ali Sami Yen Spor Kompleksi Türk Telekom Arena.jpg','cruyff':'Johan Cruijff Arena.jpg','feyenoord':"Feyenoord Rotterdam's De Kuip stadium in 2022 before a match against FC Emmen.jpg",'celtic':'Celtic park panorama.jpg','bombonera':'La Bombonera - Buenos Aires - Argentina.jpg','monumental':'River Plate FC Monumental Stadium panorama.jpg','maracana':'Maracanã stadium.jpg','napoli':'Stadio Diego Armando Maradona 2022 (1).jpg'}
allpages={p['title'][5:]:p for pages in data.values() for p in pages.values() if isinstance(p,dict) and 'title' in p}
allpages.update({p['title'][5:]:p for p in exact.values() if 'imageinfo' in p})
allpages.update({p['title'][5:]:p for p in galata.values() if 'imageinfo' in p})
credits=json.loads((root/'dist/assets/credits.json').read_text(encoding='utf8'))
def job(item):
 key,title=item;p=allpages[title];x=p['imageinfo'][0];m=x.get('extmetadata',{});target=root/'dist/assets'/f'{key}.jpg'
 if not target.exists():
  sub=x['url'].split('?')[0].split('/commons/')[1];name=sub.split('/')[-1]
  url='https://thumb.wikimedia.org/wikipedia/commons/thumb/'+sub+'/1280px-'+name
  r=requests.get(url,headers={'User-Agent':'StadiumJournal/2.0 (cultural showcase)'},timeout=25);r.raise_for_status()
  im=Image.open(io.BytesIO(r.content)).convert('RGB');im.save(target,quality=87,optimize=True)
 clean=lambda v:html.unescape(re.sub('<[^>]+>','',v)).strip()
 credits[key]={'title':title,'author':clean(m.get('Artist',{}).get('value','Wikimedia Commons contributor')),'license':clean(m.get('LicenseShortName',{}).get('value','')),'licenseUrl':m.get('LicenseUrl',{}).get('value',''),'source':x['descriptionurl'],'date':clean(m.get('DateTimeOriginal',{}).get('value',''))}
 return key,Image.open(target).size
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
 for t in concurrent.futures.as_completed([ex.submit(job,it) for it in selection.items()]):
  try: print(t.result())
  except Exception as e:print(type(e).__name__,str(e)[:180])
(root/'dist/assets/credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2),encoding='utf8')
sheet=Image.new('RGB',(1000,220*7),'#101719');d=ImageDraw.Draw(sheet)
for i,k in enumerate(selection):
 p=root/'dist/assets'/f'{k}.jpg'
 if not p.exists():continue
 im=Image.open(p);im.thumbnail((480,185));x,y=i%2*500,i//2*220;sheet.paste(im,(x,y));d.text((x+5,y+190),k,fill='#d4ff62')
sheet.save(root/'docs/expanded-contact-sheet.jpg')
