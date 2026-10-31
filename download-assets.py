import concurrent.futures
import html
import io
import json
import pathlib
import re
import requests
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).parent
FILES = {
    'bernabeu': 'File:Santiagobernabeupanorama.jpg',
    'campnou': 'File:Camp Nou - Interior (2005).jpg',
    'anfield': 'File:Anfield stadium (Liverpool) panorama view from main stand.jpg',
    'oldtrafford': 'File:Old Trafford inside 20060726 1.jpg',
    'allianz': 'File:Allianz arena rojo.jpeg',
    'dortmund': 'File:Dortmund Signal Iduna Park 5.jpg',
    'sansiro': 'File:San Siro Stadium (Meazza) panorama empty.jpg',
    'paris': 'File:Paris Parc des Princes 3.jpg',
    'emirates': 'File:London Emirates Stadium arsenal.jpg',
    'juventus': 'File:Turin Juventus Stadium 1.jpg',
}
HEADERS = {'User-Agent': 'StadiumJournal/1.0 (educational showcase)'}
r = requests.get('https://commons.wikimedia.org/w/api.php', params={
    'action': 'query', 'format': 'json', 'titles': '|'.join(FILES.values()),
    'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1920,
}, headers=HEADERS, timeout=40)
r.raise_for_status()
pages = {p['title']: p for p in r.json()['query']['pages'].values()}
(ROOT / 'image-metadata.json').write_text(json.dumps(pages, ensure_ascii=False), encoding='utf8')
credits = {}

def clean(s):
    return html.unescape(re.sub('<[^>]+>', '', s)).strip()

def download(item):
    key, title = item
    p = pages[title]
    x = p['imageinfo'][0]
    m = x.get('extmetadata', {})
    credits[key] = {
        'title': title[5:], 'author': clean(m.get('Artist', {}).get('value', 'Wikimedia Commons contributor')),
        'license': clean(m.get('LicenseShortName', {}).get('value', '')),
        'licenseUrl': m.get('LicenseUrl', {}).get('value', ''),
        'source': x.get('descriptionurl'),
        'date': clean(m.get('DateTimeOriginal', {}).get('value', '')),
    }
    target = ROOT / 'dist/assets' / f'{key}.jpg'
    if target.exists():
        return key, Image.open(target).size
    original = x['url'].split('?')[0]
    subpath = original.split('/commons/')[1]
    filename = subpath.split('/')[-1]
    url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/' + subpath + '/1280px-' + filename
    resp = requests.get(url, headers=HEADERS, timeout=50)
    if not resp.ok:
        resp = requests.get(x['url'].split('?')[0], headers=HEADERS, timeout=50)
    resp.raise_for_status()
    im = Image.open(io.BytesIO(resp.content)).convert('RGB')
    im.thumbnail((1920, 1920))
    im.save(target, quality=88, optimize=True)
    return key, im.size

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    futures = [pool.submit(download, item) for item in FILES.items()]
    for task in concurrent.futures.as_completed(futures):
        try: print(task.result())
        except Exception as e: print(type(e).__name__, str(e))
(ROOT / 'dist/assets/credits.json').write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding='utf8')
sheet = Image.new('RGB', (1000, 220 * 5), '#f7f6f2')
draw = ImageDraw.Draw(sheet)
for i, key in enumerate(FILES):
    if not (ROOT / 'dist/assets' / f'{key}.jpg').exists():
        continue
    im = Image.open(ROOT / 'dist/assets' / f'{key}.jpg')
    im.thumbnail((480, 185))
    x, y = (i % 2) * 500, (i // 2) * 220
    sheet.paste(im, (x, y))
    draw.text((x + 5, y + 190), key, fill='#142d3c')
sheet.save(ROOT / 'docs/contact-sheet.jpg')
