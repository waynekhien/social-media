# Social Media App - Docker Setup

## Chạy Backend với Docker

### 1. Chuẩn bị

Đảm bảo đã cài đặt Docker và Docker Compose:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/`:
```bash
cp .env.example .env
```

Sửa các giá trị trong `.env`:
```env
MONGO_URI=mongodb://admin:password123@mongodb:27017/social_media?authSource=admin
JWT_SECRET=your-actual-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=5000
NODE_ENV=production
```

### 3. Chạy Backend

Từ thư mục `backend/`, chạy:
```bash
cd backend
docker-compose up
```

Hoặc chỉ MongoDB + Backend:
```bash
docker-compose up mongodb backend
```

### 4. Các lệnh hữu ích

```bash
# Chạy ở background
docker-compose up -d

# Xem logs
docker-compose logs backend
docker-compose logs mongodb

# Stop services
docker-compose down

# Rebuild images
docker-compose build

# Remove volumes (xóa data)
docker-compose down -v
```

### 5. Ports

- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 6. Health Check

Kiểm tra backend health:
```bash
curl http://localhost:5000/api/auth/me
```

### 7. Troubleshooting

**MongoDB connection issues:**
- Kiểm tra MongoDB container đã chạy: `docker-compose ps`
- Xem logs: `docker-compose logs mongodb`

**Backend không start:**
- Kiểm tra .env file
- Xem logs: `docker-compose logs backend`
- Kiểm tra port 5000 không bị chiếm: `netstat -ano | findstr :5000`

**Build lỗi:**
- Clean build: `docker-compose build --no-cache backend`
- Remove old images: `docker image prune -f`
