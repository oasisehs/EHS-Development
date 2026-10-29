import os, zipfile, xml.etree.ElementTree as ET
path = r'C:\Users\aleem\Downloads\EHS SOFTWARE SCREENSHOTS_18.06.2026.docx'
print('exists:', os.path.exists(path))
if not os.path.exists(path):
    raise SystemExit(1)
with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml')
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = ET.fromstring(xml)
paragraphs = []
for p in root.findall('.//w:p', ns):
    texts = []
    for t in p.findall('.//w:t', ns):
        texts.append(t.text or '')
    s = ''.join(texts).strip()
    if s:
        paragraphs.append(s)
print('---PARAGRAPHS---')
for i, para in enumerate(paragraphs, 1):
    print(f'{i}: {para}')
