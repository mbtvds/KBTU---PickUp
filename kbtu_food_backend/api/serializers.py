from rest_framework import serializers
from .models import CustomUser, Cafe, MenuItem, Order, OrderItem, Review

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class CafeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cafe
        fields = ['id', 'name', 'emoji', 'floor']

class MenuItemSerializer(serializers.ModelSerializer):
    cafe = serializers.PrimaryKeyRelatedField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)  # добавлено

    class Meta:
        model = MenuItem
        fields = '__all__'
    

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    price = serializers.DecimalField(source='menu_item.price', max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price', 'note']

class OrderSerializer(serializers.ModelSerializer):
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)
    cafe_icon = serializers.CharField(source='cafe.emoji', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'cafe_name', 'cafe_icon', 'status', 'items',
                  'pickup_time', 'note', 'pay_method', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'menu_item', 'student', 'student_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['student', 'student_name', 'created_at']