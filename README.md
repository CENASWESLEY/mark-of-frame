# MARK OF FRAME

A personal hall of fame for the stories that stay with you.

MARK OF FRAME คือเว็บบันทึกภาพยนตร์ อนิเมะ ซีรีส์ และแอนิเมชันที่เคยดู เก็บทั้งคะแนน ความรู้สึกในแต่ละรอบ จำนวนครั้งที่ดู และความคืบหน้าของแต่ละซีซัน พร้อมนำเรื่องโปรดมาจัดแสดงในบรรยากาศโรงภาพยนตร์สีดำและทอง

โปรเจกต์มีสองเวอร์ชันที่ใช้ UI และกติกาทางธุรกิจร่วมกัน: แอป Next.js สำหรับใช้ในเครื่องพร้อม SQLite และเว็บ static สำหรับ ChatGPT Sites ที่เก็บข้อมูล JSON ในเบราว์เซอร์ ชื่อภายในบางส่วนยังเป็น `afterframe` เพื่อรองรับข้อมูลจากเวอร์ชันแรก

## Features

| Page               | What it does                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **The Hall**       | สไลด์เรื่องเด่นทุก 5 วินาที พร้อมปุ่มพัก Top 3 และ All-Time Top 10 แยกหมวด สลับ Poster/List และเปิดป็อปอัปดู Top 10 พร้อมกดเข้ารายละเอียด |
| **Library**        | คลังแบบโปสเตอร์หรือรายการ จัดอันดับแยกภาค/ซีซัน พร้อม sidebar ค้นหา กรอง และเรียงข้อมูล                                             |
| **Title details**  | ปก ชื่อดั้งเดิม ปีฉาย เรื่องย่อ metadata คะแนน Rank จำนวนรอบที่ดู การ์ดสลับภาค และป็อปอัปเพิ่มหรือแก้ไขรีวิวแต่ละรอบ รวมถึงรีวิวเก่า              |
| **Memories**       | อ่านความรู้สึกและคะแนนจากรอบการดูต่าง ๆ เรียงตามเวลา พร้อมลิงก์กลับไปยังรายละเอียดเรื่องหรือภาคนั้น                                      |
| **Year in Review** | สรุปจากปีที่ดูจริง แสดงเรื่องเด่นรายหมวด กิจกรรมรายเดือน การดูซ้ำ แนวเรื่อง และเวลาของภาพยนตร์ที่ทราบความยาว                             |
| **Manage**         | จัดการรายการทุกหมวด เพิ่ม/แก้ไขเรื่องและซีซัน กำหนดปกของแต่ละภาคอย่างอิสระ และแก้จำนวนรอบที่ดู                                         |
| **Settings**       | Export JSON, ตรวจสอบตัวอย่างก่อน import, เลือกอัปเดต metadata และนำเข้าไฟล์จัดระเบียบซีซันที่ผ่านการตรวจสอบ                          |

รองรับหมวดภาพยนตร์ ซีรีส์ อนิเมะ หนังอนิเมะ หนังแอนิเมชัน ซีรีส์แอนิเมชัน สารคดีภาพยนตร์ สารคดีแบบตอน และหนังสั้น ส่วนแนวเรื่อง ประเทศ ภาษา และปีฉายเป็น metadata สำหรับค้นหาและกรอง

ธีมใช้พื้นหลังมืด สีทองสำหรับจุดเด่น สีม่วงสำหรับจำนวนรอบที่ดู และตัวอักษร Rank แบบมีมิติ รองรับหน้าจอมือถือ การใช้คีย์บอร์ด และการลดการเคลื่อนไหวตามค่าระบบ

## Scoring and ranking

- ให้คะแนน `0–10` ได้ไม่เกินสองตำแหน่งทศนิยม ภายในเก็บเป็นจำนวนเต็ม `0–1000` เช่น `8.35` เก็บเป็น `835` แล้วคำนวณ Rank และอันดับเมื่อต้องแสดงผล
- ใช้คะแนน **รอบล่าสุดของเรื่องหรือภาคนั้น** เก็บประวัติรอบก่อนหน้าไว้ หากรอบล่าสุดไม่มีคะแนน จะไม่ดึงคะแนนเก่ามาแทน คะแนน `0` ถือเป็นคะแนนที่มีอยู่จริง
- เลือกรอบล่าสุดจากวันที่ดูจบ หรือวันเริ่มดูเมื่อไม่มีวันจบ แล้วใช้เวลาสร้างและ ID ตัดสินเมื่อวันที่เท่ากัน การเพิ่มรีวิวที่ดูมานานแล้วจึงไม่แย่งสถานะรอบล่าสุดเพียงเพราะเพิ่งบันทึก
- **Library** จัดอันดับแต่ละภาค/ซีซันแยกกันภายในหมวด ส่วน **The Hall** แสดงหนึ่งรายการต่อเรื่อง โดยเรื่องหลายภาคใช้ค่าเฉลี่ยน้ำหนักเท่ากันของคะแนนรอบล่าสุดจากภาคที่มีคะแนน ภาคที่รอบล่าสุดไม่มีคะแนนจะไม่รวมในการคำนวณ
- คะแนนเท่ากันได้อันดับร่วม เช่น `1, 2, 2, 4` ชื่อเรื่องและ ID กำหนดลำดับแสดงที่แน่นอนเมื่อรายการตัดที่ Top 10 การกรอง Library ไม่เปลี่ยนอันดับเดิมภายในหมวด
- จำนวนรอบที่ดูเป็นค่าที่แก้ไขเองได้ แยกจากจำนวนรีวิว การเพิ่มหรือแก้รีวิวไม่เพิ่มจำนวนครั้งที่ดูโดยอัตโนมัติ

| Rank | Score      |
| ---- | ---------- |
| S    | 9.00–10.00 |
| A+   | 8.50–8.99  |
| A    | 8.00–8.49  |
| B+   | 7.50–7.99  |
| B    | 7.00–7.49  |
| C+   | 6.00–6.99  |
| C    | 5.00–5.99  |
| D+   | 4.00–4.99  |
| D    | 0.00–3.99  |

Rank สูงสุดคือ **S** ไม่มี S+ รายการที่ยังไม่มีคะแนนแสดงเป็นไม่มีอันดับ

Year in Review ใช้วันที่ดู ไม่ใช่ปีฉาย และใช้รอบล่าสุดภายในปีที่เลือก รายการที่ไม่ทราบวันที่จะแยกนับไว้โดยไม่กำหนดปีให้เอง ยอดเวลารวมใช้เฉพาะรอบที่ดูจบของสื่อที่ไม่ใช่แบบตอนและทราบความยาว

## Technology

| Area                | Stack                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| Language            | TypeScript with strict checking                                            |
| Local application   | Next.js 16 App Router, React 19, Node.js 24                                |
| Static application  | Vite 8, React, browser adapters และ hash routing                           |
| Local persistence   | SQLite ผ่าน `node:sqlite`, versioned migrations และ transactions            |
| Browser persistence | JSON snapshot ใน `localStorage`, Web Locks และ storage events สำหรับหลายแท็บ |
| Validation          | Zod 4 ใช้ร่วมกันใน domain และตรวจซ้ำที่ขอบเขต server/browser mutation            |
| Interface           | CSS Modules, design tokens, Lucide icons และฟอนต์ที่โฮสต์ในโปรเจกต์             |
| Quality             | Vitest, ESLint, Prettier และ TypeScript                                    |

เวอร์ชันแพ็กเกจที่ใช้งานจริงระบุใน [package.json](package.json) และ [pnpm-lock.yaml](pnpm-lock.yaml)

## Run locally

ต้องมี **Node.js 24.x** และ **pnpm 11.25.0** ไม่ต้องติดตั้งเซิร์ฟเวอร์ฐานข้อมูลหรือสร้างบัญชีผู้ใช้

```sh
git clone https://github.com/CENASWESLEY/mark-of-frame.git
cd mark-of-frame
pnpm install --frozen-lockfile
pnpm dev
```

เปิด [http://127.0.0.1:3000](http://127.0.0.1:3000) แอปเริ่มด้วยคลังว่างและสร้างฐานข้อมูล `data/afterframe.sqlite` ให้อัตโนมัติ คำสั่ง dev/start ผูกกับ `127.0.0.1` สำหรับใช้งานในเครื่อง

หากต้องการเปลี่ยนตำแหน่งฐานข้อมูล ให้คัดลอก `.env.example` เป็น `.env.local` แล้วกำหนด:

```dotenv
AFTERFRAME_DATABASE_PATH=./data/afterframe.sqlite
```

### Build targets

```sh
# Build Next.js และเว็บ static
pnpm build

# Build และรัน Next.js เท่านั้น
pnpm build:local
pnpm start

# Build และ preview เว็บ static เท่านั้น
pnpm build:site
pnpm exec vite preview --host 127.0.0.1
```

ไฟล์ static อยู่ใน `dist/` ส่วน `.openai/hosting.json` ระบุโปรเจกต์ Sites เดิม การ build ไม่ได้ publish เว็บโดยอัตโนมัติ

### GitHub Pages

เปิดเว็บได้ที่ [cenaswesley.github.io/mark-of-frame/](https://cenaswesley.github.io/mark-of-frame/) ใน repository ให้ตั้ง **Settings → Pages → Source → GitHub Actions** โดย workflow ใน `.github/workflows/pages.yml` จะตรวจโค้ด build static application และเผยแพร่เฉพาะ `dist/` เมื่อ push เข้า `main` หรือสั่งรันเองจาก Actions

อย่าเลือกเผยแพร่จากราก branch `main` โดยตรง เพราะ `index.html` ในซอร์สยังอ้างไฟล์ TypeScript ที่ต้องผ่าน Vite ก่อน ตัว build ใช้ relative asset URLs และจัดพาธปกให้รองรับ `/mark-of-frame/` เส้นทางภายในใช้ `#/library`, `#/settings` และ hash routes อื่น ๆ

ตรวจไฟล์ที่เผยแพร่จริงได้ด้วย:

```sh
node scripts/check-static-site.mjs https://cenaswesley.github.io/mark-of-frame/
```

GitHub Pages ใช้ JSON ในเบราว์เซอร์เช่นเดียวกับเวอร์ชัน Sites แต่เป็นคนละ origin จึงต้อง import backup ของตนเองเมื่อต้องการย้ายคลัง ไม่มีการนำข้อมูลส่วนตัวขึ้นไปพร้อม workflow

### Sample collection

```sh
pnpm db:seed
```

คำสั่งนี้เพิ่มข้อมูลตัวอย่างที่ติดป้ายกำกับไว้ใน SQLite รันซ้ำได้โดยไม่เพิ่มตัวอย่างชุดเดิมซ้ำหรือแทนที่ข้อมูลจริง สำหรับเวอร์ชัน Sites ให้เลือก **Explore labeled samples** จากหน้าคลังว่าง

## Data and backups

| Target                         | Storage                                      | How to move data                |
| ------------------------------ | -------------------------------------------- | ------------------------------- |
| Local Next.js                  | ไฟล์ SQLite ในเครื่อง                           | Export/Import JSON ผ่าน Settings |
| ChatGPT Sites / static preview | `localStorage` ของ origin และเบราว์เซอร์ที่เปิดใช้ | Export/Import JSON ผ่าน Settings |

ข้อมูลของสองเวอร์ชันแยกจากกัน การเปิดผ่านอีกเบราว์เซอร์ อุปกรณ์ หรือ origin จะมีคลังข้อมูลคนละชุด ไม่มีการ sync อัตโนมัติกับบัญชี ChatGPT หรือ GitHub ควร export สำรองเป็นระยะ โดยเฉพาะก่อนล้างข้อมูลเบราว์เซอร์

### JSON workflow

1. เลือก **Settings → Download backup** เพื่อเก็บ metadata ซีซัน ประวัติการดู คะแนน ความรู้สึก และจำนวนรอบที่ดู
2. ในอุปกรณ์ปลายทาง เลือกไฟล์และตรวจ **Import preview** ก่อนนำเข้า ไฟล์รองรับขนาดสูงสุด **8 MB**
3. Import ปกติรวมรายการตาม ID โดยเก็บข้อมูลเดิมไว้ หากเลือก refresh metadata จะอัปเดตข้อมูลแค็ตตาล็อก เช่น ปก ชื่อ ปี และเรื่องย่อ พร้อมรักษาคะแนน วันที่ ความรู้สึก และจำนวนครั้งที่ดู

Export ปัจจุบันเป็น **schema version 2** และยังอ่านไฟล์ version 1 ได้ คะแนนใน JSON ใช้หน่วย `hundredths` การนำเข้าตรวจความสัมพันธ์ของ ID วันที่ และขอบเขตความคืบหน้า หากข้อมูลขัดแย้ง การเขียนทั้งชุดจะไม่เกิดขึ้น ปกและภาพพื้นหลังเก็บเป็น URL โดยไม่ฝังไฟล์ภาพใน JSON

ไฟล์จัดระเบียบซีซันเป็นขั้นตอนแยกที่มี preview และตรวจสถานะเดิมก่อนเปลี่ยนหลายรายการพร้อมกัน รายละเอียดอยู่ใน [Architecture](docs/architecture.md#installments-and-series-organization)

สำหรับสำรอง SQLite ทั้งชุด ให้หยุดแอปก่อนแล้วคัดลอกโฟลเดอร์ `data/` รวมไฟล์ WAL/SHM หากมี การสำรองระหว่างที่ฐานข้อมูลกำลังเขียนต้องไม่คัดลอกเฉพาะไฟล์ `.sqlite`

ฐานข้อมูลส่วนตัว ไฟล์ `.env.local`, JSON ที่สร้างใน `outputs/`, build output และภาพตรวจงานใน `.verification/` ถูกแยกจาก Git ผ่าน `.gitignore` ข้อมูลตัวอย่างที่อยู่ใน repository มีป้าย Sample และแยกจากข้อมูลจริง

## Project structure

```text
src/
  app/                       Next.js routes, layouts และ server composition
  modules/
    catalog/                 รายการ metadata ซีซัน และ Library
    watching/                รอบการดู รีวิว สถานะ และความคืบหน้า
    rankings/                คะแนน Rank อันดับ และ The Hall
    journal/                 การแสดงความทรงจำตามเวลา
    insights/                การวิเคราะห์รายปี
    backup/                  JSON validation, merge และจัดระเบียบซีซัน
  infrastructure/database/   SQLite connection และ migrations
  shared/                    UI และ utilities ที่ใช้ร่วมกัน
  site/                      Browser storage, routing และ action adapters
scripts/                     Build, seed และเตรียม assets
public/                      ฟอนต์ รูปภาพ และที่มาของ assets
docs/                        Architecture และบันทึกการตรวจสอบ
```

แต่ละ business module แยก `domain/`, `ui/` และ `server/` ตามหน้าที่ที่มีจริง กติกาทางธุรกิจอยู่ใน pure domain ซึ่งไม่ import React, Next.js หรือฐานข้อมูล Routes ทำหน้าที่ประกอบโมดูล ส่วน server entry ตรวจ input ด้วย Zod และใช้ parameterized SQL/transactions

Static build ใช้ adapters ใน `src/site/` แทน navigation และ server actions มี build guard ป้องกัน SQLite และ server persistence หลุดเข้า bundle ทั้งสอง target จึงใช้กติกาคะแนนและการตรวจข้อมูลร่วมกันได้

## Development checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

`pnpm check` รวม typecheck, lint และ tests ส่วน `pnpm test:watch` ใช้ระหว่างพัฒนา Tests ครอบคลุมคะแนน การเลือกรอบล่าสุด อันดับรายหมวด การแยกภาค จำนวนรอบที่ดู การตรวจข้อมูล persistence การนำเข้าแบบ atomic และการแก้ปกแยกซีซัน

เอกสารสำหรับพัฒนาต่อ:

- [PRODUCT.md](PRODUCT.md) — ข้อกำหนดและกติกาที่ตกลงแล้ว รวมประวัติการปรับฟีเจอร์
- [docs/architecture.md](docs/architecture.md) — ขอบเขตโมดูล การจัดเก็บข้อมูล และ adapters
- [DESIGN.md](DESIGN.md) — สี typography และแนวทางภาพรวมของ UI
- [AGENTS.md](AGENTS.md) — มาตรฐานการเขียนโค้ดและการตรวจงานสำหรับ coding agents
- [docs/verification.md](docs/verification.md) — บันทึกการตรวจสอบเวอร์ชันเริ่มต้น ลงวันที่ไว้ในเอกสาร

## Current scope

แอปสำหรับใช้งานส่วนตัวหนึ่งคน Local Next.js ยังไม่มีระบบ login ส่วนสิทธิ์เข้า private Site จัดการโดยแพลตฟอร์ม Sites ปัจจุบันยังไม่มี cloud sync, ระบบหลายผู้ใช้, การค้นหา metadata อัตโนมัติภายในแอป หรือการอัปโหลดไฟล์รูป ปกและรายละเอียดสามารถเพิ่มเองหรือปรับผ่าน metadata import ได้

## Assets and attribution

ที่มาของภาพประกอบระบุใน [public/images/sources.json](public/images/sources.json) URL ภาพที่ผู้ใช้เพิ่มจะถูกเรียกจากเบราว์เซอร์โดยตรง และมี placeholder เมื่อไม่พบภาพ

ฟอนต์ Cormorant Garamond, Noto Sans Thai และ Racing Sans One อยู่ภายใต้ SIL Open Font License โดยมีไฟล์สิทธิ์ใน [public/fonts/](public/fonts/) การมีภาพหรือฟอนต์ใน repository ไม่ได้เปลี่ยนสิทธิ์ของเจ้าของผลงานต้นฉบับ
