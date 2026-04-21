from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view),
    path('auth/register/', views.register_view),

    # Общие
    path('cafes/', views.CafeListView.as_view()),

    # Студент
    path('orders/', views.my_orders_view, name='my-orders'),
    path('orders/', views.create_order_view, name='create-order'),   # POST

    # Кухня
    path('kitchen/orders/', views.KitchenOrdersView.as_view()),
    path('kitchen/orders/<int:pk>/', views.kitchen_order_status_view),
    path('kitchen/menu/', views.kitchen_menu_view),
    path('kitchen/menu/<int:pk>/', views.kitchen_menu_detail_view),

    # Админ
    path('admin/kitchens/', views.AdminKitchenView.as_view()),

    # Для меню (используется фронтендом)
    path('menu-items/', views.public_menu_view),
    path('menu-items/<int:pk>/', views.kitchen_menu_detail_view),

    path('kitchen/profile/', views.kitchen_profile_view),


    # Отзывы
    path('menu-items/<int:pk>/reviews/', views.menu_item_reviews_view, name='menu-item-reviews'),
    path('menu-items/<int:pk>/reviews/create/', views.create_review_view, name='create-review'),
    path('menu-items/<int:pk>/rating/', views.menu_item_rating_view, name='menu-item-rating'),
    path('reviews/<int:pk>/delete/', views.delete_review_view, name='delete-review'),
]