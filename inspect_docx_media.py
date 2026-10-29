import os, zipfile
path = r'C:\Users\aleem\Downloads\EHS SOFTWARE SCREENSHOTS_18.06.2026.docx'
print('exists:', os.path.exists(path))
if not os.path.exists(path):
    raise SystemExit
with zipfile.ZipFile(path) as z:
    names = z.namelist()
    media = [n for n in names if n.startswith('word/media/')]
    print('total_entries:', len(names))
    print('media_count:', len(media))
    for n in media[:50]:
        info = z.getinfo(n)
        print(n, info.file_size)
