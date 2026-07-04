# JLPT N3 Grammar Lab

เว็บสรุปไวยกรณ์ JLPT N3 จากไฟล์ `รวมไวยกรณ์ภาษาญี่ปุ่นN3.pdf` พร้อมแบบฝึกหัดเติมคำ เลือกตอบ และจับคู่

## เปิดใช้งานในเครื่อง

เปิดไฟล์ `index.html` ได้โดยตรง หรือรัน local server:

```powershell
python -m http.server 5173
```

แล้วเข้า:

```text
http://localhost:5173
```

## Deploy บน Cloudflare Pages

ใช้เป็น static site ได้เลย ถ้า deploy ผ่าน GitHub:

- Build command: `npm run build`
- Build output directory: `dist`
- ไฟล์ที่ต้องใช้: `index.html`, `styles.css`, `app.js`, `grammar-data.js`, `examples-data.js`, `assets/`

ถ้า deploy ด้วย Wrangler:

```powershell
npm run build
npx wrangler pages deploy dist --project-name jlpt-n3-grammar-lab --branch main
```

## หมายเหตุการตรวจคำแปล

ข้อมูลใน `grammar-data.js` เรียบเรียงจาก PDF และแก้จุดที่ extraction หรือข้อความต้นฉบับทำให้คลาดเคลื่อน เช่น `Vずに`, `Nにおいて`, `といっても`, และความหมายของ `Vてごらん（なさい）`
