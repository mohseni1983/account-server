# راهنمای Docker

این پروژه شامل فایل‌های Docker برای اجرای برنامه در محیط‌های مختلف است.

## فایل‌های Docker

- `Dockerfile` - برای production
- `Dockerfile.dev` - برای development
- `docker-compose.yml` - برای production
- `docker-compose.dev.yml` - برای development
- `.dockerignore` - فایل‌های نادیده گرفته شده در build

## استفاده

### Production

#### ساخت و اجرای با Docker Compose:
```bash
# ساخت و اجرای container
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f

# توقف
docker-compose down
```

#### ساخت و اجرای با Docker:
```bash
# ساخت image
docker build -t vpn-share .

# اجرای container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-secret-key \
  --name vpn-share \
  vpn-share
```

### Development

```bash
# اجرای با Docker Compose
docker-compose -f docker-compose.dev.yml up

# یا با Docker
docker build -f Dockerfile.dev -t vpn-share-dev .
docker run -d \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v $(pwd)/data:/app/data \
  --name vpn-share-dev \
  vpn-share-dev
```

## متغیرهای محیطی

می‌توانید متغیرهای محیطی را از طریق فایل `.env` یا در `docker-compose.yml` تنظیم کنید:

```yaml
environment:
  - JWT_SECRET=your-secret-key-change-in-production
  - NODE_ENV=production
```

## Volume ها

دیتابیس و فایل‌ها در پوشه `data` ذخیره می‌شوند که به عنوان volume به container متصل می‌شود:

```yaml
volumes:
  - ./data:/app/data
```

این باعث می‌شود که داده‌ها حتی پس از حذف container حفظ شوند.

## پورت‌ها

برنامه به صورت پیش‌فرض روی پورت 3000 اجرا می‌شود. می‌توانید آن را تغییر دهید:

```yaml
ports:
  - "8080:3000"  # پورت خارجی:پورت داخلی
```

## Health Check

Container شامل health check است که هر 30 ثانیه وضعیت را بررسی می‌کند.

## نکات

1. **اولین اجرا**: مطمئن شوید که فایل `data/master-profile.ovpn` وجود دارد
2. **امنیت**: حتماً `JWT_SECRET` را تغییر دهید
3. **Backup**: پوشه `data` را به صورت منظم backup کنید
4. **Logs**: برای مشاهده لاگ‌ها از `docker-compose logs` استفاده کنید

