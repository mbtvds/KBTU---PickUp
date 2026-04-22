from django.contrib.auth.models import AbstractUser
from django.db import models

from django.contrib.auth.models import UserManager   

class CustomUserManager(UserManager):
    """Менеджер для CustomUser"""
    def students(self):
        return self.filter(role='student')

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('kitchen', 'Kitchen Staff'),
        ('admin', 'Administrator'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    
    objects = CustomUserManager()          

    def __str__(self):
        return f"{self.username} ({self.role})"

class Cafe(models.Model):
    kitchen_user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='cafe')
    name = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10, default='🍽️')
    floor = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    image = models.ImageField(upload_to='menu_images/', blank=True, null=True)
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='menu_items')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    emoji = models.CharField(max_length=10, default='🍽️')
    price = models.DecimalField(max_digits=6, decimal_places=2)
    category = models.CharField(max_length=20, choices=[
        ('hot', 'Горячее'), ('drinks', 'Напитки'),
        ('snacks', 'Закуски'), ('desserts', 'Десерты')
    ])
    tags = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.emoji} {self.name}"

class Order(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'), ('cooking', 'Cooking'),
        ('ready', 'Ready'), ('picked', 'Picked'), ('cancelled', 'Cancelled')
    ], default='pending')
    pickup_time = models.DateTimeField()
    note = models.TextField(blank=True)
    pay_method = models.CharField(max_length=20, default='cash')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"
    
class Review(models.Model):
    """Отзыв студента о блюде с рейтингом от 1 до 5"""
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text='Рейтинг от 1 до 5 звёзд'
    )
    comment = models.TextField(blank=True, help_text='Комментарий к отзыву')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('menu_item', 'student')

    def __str__(self):
        return f"{self.student.username} → {self.menu_item.name}: {self.rating}⭐"