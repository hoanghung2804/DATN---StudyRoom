# Huong dan cai dat va chay du an Study Room Booking

Tai lieu nay dung de chuyen code sang mot may khac va chay lai du an tu dau.

## 1. Cong nghe su dung

- Frontend: ReactJS, Vite, Bootstrap
- Backend: NodeJS, ExpressJS
- Database: MySQL
- Cong cu khuyen dung: Visual Studio Code, MySQL Workbench hoac phpMyAdmin

## 2. Phan mem can cai truoc

May moi can cai:

- Node.js ban LTS
- MySQL Server
- Visual Studio Code
- MySQL Workbench/phpMyAdmin de import file SQL

Kiem tra Node.js:

```bash
node -v
npm -v
```

## 3. Cau truc thu muc can gui

Khi gui code cho may khac, can gui:

```text
StudyRoomBooking/
  backend/
  frontend/
  docs/
hh.sql
```

Luu y: file database `hh.sql` hien dang nam ngoai thu muc `StudyRoomBooking`, o duong dan:

```text
C:\Users\Admin\OneDrive\Desktop\DATN\hh.sql
```

Khi gui cho ban khac, hay gui kem file `hh.sql` nay.

Khong bat buoc gui cac thu muc sau vi co the cai lai bang `npm install`:

```text
backend/node_modules/
frontend/node_modules/
frontend/dist/
```

## 4. Tao database va import du lieu

Mo MySQL Workbench hoac phpMyAdmin, tao database:

```sql
CREATE DATABASE study_room_booking
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Sau do import file:

```text
hh.sql
```

Neu dung MySQL command line:

```bash
mysql -u root -p study_room_booking < hh.sql
```

## 5. Cau hinh backend

Sao chep file mau:

```text
backend/.env.example
```

thanh:

```text
backend/.env
```

Noi dung mau:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_may_moi
DB_NAME=study_room_booking
DB_PORT=3306
JWT_SECRET=studyroom_secret
GOOGLE_CLIENT_ID=your_google_client_id
ALLOWED_EMAIL_DOMAIN=
```

Neu may moi dung user/password MySQL khac, sua cac dong `DB_USER` va `DB_PASSWORD`.

Voi frontend, sao chep file:

```text
frontend/.env.example
```

thanh:

```text
frontend/.env
```

Noi dung mau:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Ghi chu:

- `JWT_SECRET`: khoa ky token dang nhap.
- `GOOGLE_CLIENT_ID`: dung cho dang nhap Google.
- `VITE_API_BASE_URL`: dia chi API backend ma frontend se goi.
- `VITE_GOOGLE_CLIENT_ID`: Client ID Google dung o frontend.
- `ALLOWED_EMAIL_DOMAIN`: de trong neu cho moi email dang nhap Google. Neu muon chi cho email truong, dien domain, vi du `student.edu.vn`.

## 6. Cai dat va chay backend

Mo terminal trong thu muc:

```text
StudyRoomBooking/backend
```

Chay:

```bash
npm install
npm run dev
```

Neu khong muon dung nodemon:

```bash
npm start
```

Backend chay tai:

```text
http://localhost:5000
```

Neu thanh cong, terminal se hien:

```text
MySQL Connected Successfully!
Server running on port 5000
```

Co the mo trinh duyet vao:

```text
http://localhost:5000
```

Neu hien `Study Room Booking API Running` la backend da chay.

## 7. Cai dat va chay frontend

Mo terminal moi trong thu muc:

```text
StudyRoomBooking/frontend
```

Chay:

```bash
npm install
npm run dev
```

Frontend thuong chay tai:

```text
http://localhost:5173
```

Neu Vite bao port khac, vi du `5174`, hay mo dung link Vite hien tren terminal.

## 8. Ket noi frontend voi backend

Frontend dang goi API tai:

```text
http://localhost:5000/api
```

File cau hinh:

```text
frontend/.env
```

Neu backend doi port, sua dong `VITE_API_BASE_URL`.

## 9. Tai khoan mau de dang nhap

Tai khoan mau trong database co mat khau khac nhau theo vai tro.

Tai khoan admin:

```text
Email: admin@gmail.com
Mat khau: 123456
```

Tai khoan sinh vien mau:

```text
Email: hungn28@gmail.com
Mat khau: Student@123
```

Mot so tai khoan sinh vien co du lieu test lich dat, check-in, huy lich, tu choi, danh gia:

```text
sv001.studyroom@gmail.com
sv002.studyroom@gmail.com
sv003.studyroom@gmail.com
sv004.studyroom@gmail.com
sv005.studyroom@gmail.com
```

Mat khau sinh vien deu la:

```text
Student@123
```

Quy tac mat khau sinh vien khi dang ky, doi mat khau hoac yeu cau dat lai mat khau:

```text
Toi thieu 8 ky tu, co it nhat 1 chu viet hoa va 1 ky tu dac biet.
```

Tai khoan admin van giu quy tac toi thieu 6 ky tu.

## 10. Cac chuc nang chinh

Phia sinh vien:

- Xem trang chu va danh sach phong.
- Tim phong theo ngay, gio, suc chua, toa nha, loai phong, thiet bi.
- Xem anh phong, trang thai phong, so sao va nhan xet.
- Dang nhap/dang ky.
- Dat phong.
- Xem lich cua toi.
- Check-in lich da duyet.
- Huy lich neu con hop le.
- Danh gia phong sau khi da check-in va su dung xong.
- Sua danh gia da gui.
- Xem lich phong theo tuan.
- Xem thong bao.
- Cap nhat ho so, anh dai dien, doi mat khau.
- Gui yeu cau dat lai mat khau de admin duyet.
- Dang nhap bang Google.

Phia admin:

- Dashboard thong ke.
- Quan ly phong hoc.
- Them/sua/xoa phong.
- Upload anh phong tu may.
- Duyet hoac tu choi lich dat phong.
- Xem lich phong dang calendar.
- Quan ly hoc sinh.
- Tao tai khoan hoc sinh/admin.
- Sua tai khoan, reset mat khau, xoa hoc sinh.
- Quan ly bao tri phong.
- Duyet yeu cau dat lai mat khau.
- Cap nhat ho so admin, anh dai dien, doi mat khau.

## 11. Dang nhap Google tren may khac

Neu dang nhap Google bi loi, can kiem tra Google Cloud Console.

Trong OAuth Client ID, them cac URL sau:

Authorized JavaScript origins:

```text
http://localhost:5173
```

Neu Vite chay port khac, them port do, vi du:

```text
http://localhost:5174
```

Voi cach dang nhap Google hien tai, frontend dung Google Identity Services nen thuong khong can redirect URI rieng. Neu Google Console bat buoc nhap redirect URI, co the them:

```text
http://localhost:5173
```

Sau khi sua Google Cloud, cho vai phut de cau hinh co hieu luc.

## 12. Loi thuong gap

### Loi backend khong ket noi MySQL

Kiem tra:

- MySQL Server da chay chua.
- Database `study_room_booking` da tao/import chua.
- `backend/config/db.js` dung user/password MySQL chua.

### Loi frontend khong load du lieu

Kiem tra:

- Backend da chay tai `http://localhost:5000`.
- File `frontend/src/api/axiosClient.js` dung port backend.
- Trinh duyet khong bi loi CORS/cache. Thu reload lai trang.

### Loi dang nhap sai mat khau

Tai khoan demo mac dinh:

```text
Admin: 123456
Sinh vien: Student@123
```

Neu da doi mat khau trong luc test, co the import lai `hh.sql` de reset du lieu.

### Loi port 5173 hoac 5000 da duoc dung

Vite co the tu chuyen sang port khac. Neu frontend chay port moi, hay mo dung URL terminal hien ra.

Neu backend port `5000` bi trung, can sua `PORT` trong:

```text
backend/server.js
```

va sua lai `baseURL` trong:

```text
frontend/src/api/axiosClient.js
```

## 13. Lenh kiem tra truoc khi nop/demo

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
node --check server.js
```

Chay demo:

```bash
cd backend
npm run dev
```

Mo terminal khac:

```bash
cd frontend
npm run dev
```

Sau do mo:

```text
http://localhost:5173
```

## 14. Ghi chu khi chuyen code qua may khac

- Nho gui kem file `hh.sql`.
- Nen xoa `node_modules` truoc khi nen/gửi code de nhe hon.
- May nhan code chi can chay `npm install` trong `backend` va `frontend`.
- Neu MySQL tren may moi co mat khau khac, sua `backend/config/db.js`.
- Neu dang nhap Google khong can thiet khi demo, co the dung dang nhap email/mat khau bang tai khoan mau.
