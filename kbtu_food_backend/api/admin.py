from django.contrib import admin
from .models import CustomUser, Cafe, MenuItem, Order, OrderItem


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role',)
    search_fields = ('username', 'email')


@admin.register(Cafe)
class CafeAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'floor', 'kitchen_user', 'created_at')
    search_fields = ('name',)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'cafe', 'category', 'price', 'is_available')
    list_filter = ('category', 'cafe', 'is_available')
    search_fields = ('name', 'description')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'cafe', 'status', 'pickup_time', 'created_at')
    list_filter = ('status', 'cafe')
    inlines = [OrderItemInline]