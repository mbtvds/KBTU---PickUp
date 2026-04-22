# KBTU PickUp 🍽️

A full-stack web application for pre-ordering food at KBTU cafeterias — skip the queue, order ahead, pick up when ready.

## Description
KBTU PickUp allows students to browse cafeteria menus, place orders online, and pick up their food without waiting in line. Kitchen staff can manage incoming orders and update statuses in real time.

## Features

- 🔐 JWT-based authentication (login & registration)
- 🍕 Browse menu by cafe and category
- 🛒 Cart with multi-cafe blocking
- 📦 Order management (place, cancel, reorder)
- 👨‍🍳 Kitchen panel with real-time order tracking
- ⭐ Reviews & Ratings system
- 📱 Responsive design

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21, TypeScript |
| Backend | Django 6, Django REST Framework |
| Auth | SimpleJWT |
| Database | SQLite |
| Styling | CSS (custom) |

## Project Structure

KBTU-PickUp/
├── frontend/kbtu-food/        # Angular SPA
│   └── src/app/
│       ├── pages/             # menu, cart, orders, kitchen, admin
│       ├── services/          # auth, menu, cart, order, kitchen, review
│       ├── guards/            # auth guard
│       └── interceptors/      # JWT interceptor
└── kbtu_food_backend/         # Django REST API
└── api/
├── models.py          # CustomUser, Cafe, MenuItem, Order, Review
├── views.py           # FBV + CBV endpoints
├── serializers.py
└── urls.py

## Getting Started

### Backend
```bash
cd kbtu_food_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend/kbtu-food
npm install
ng serve
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/register/` | Register |
| GET | `/api/menu-items/` | Public menu |
| GET/POST | `/api/orders/` | Student orders |
| PATCH | `/api/orders/{id}/cancel/` | Cancel order |
| POST | `/api/orders/{id}/reorder/` | Reorder |
| GET | `/api/kitchen/orders/` | Kitchen orders |
| PATCH | `/api/kitchen/orders/{id}/` | Update order status |
| GET/POST | `/api/kitchen/menu/` | Kitchen menu CRUD |
| GET/POST | `/api/menu-items/{id}/reviews/` | Reviews |

## Group Members

- **Akzhigitov Abilkaiyr** — Backend Developer
- **Umbetov Dias** — Frontend Developer  
- **Kairbek Abulkhair** — Full-stack, Bug Fixes & Reviews
