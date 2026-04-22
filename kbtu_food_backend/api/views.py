from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Cafe, MenuItem, Order, OrderItem, Review
from .serializers import LoginSerializer, CafeSerializer, MenuItemSerializer, OrderSerializer, ReviewSerializer

# ==================== AUTH ====================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(email=serializer.validated_data['email'],
                            password=serializer.validated_data['password'])
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': user.role
            })
    return Response({'detail': 'Invalid credentials'}, status=401)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    email = request.data.get('email')
    if CustomUser.objects.filter(email=email).exists():
        return Response({'email': 'User already exists'}, status=400)

    user = CustomUser.objects.create_user(
        username=email.split('@')[0],
        email=email,
        password=request.data['password'],
        first_name=request.data.get('name', ''),
        role='student'
    )
    refresh = RefreshToken.for_user(user)
    return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})

# ==================== VIEWS ====================
class CafeListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        cafes = Cafe.objects.all()
        serializer = CafeSerializer(cafes, many=True)
        return Response(serializer.data)

class KitchenOrdersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'kitchen':
            return Response({'detail': 'Forbidden'}, status=403)
        orders = Order.objects.filter(cafe=request.user.cafe)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

# Kitchen Menu CRUD
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def kitchen_menu_view(request):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)
    if request.method == 'GET':
        items = MenuItem.objects.filter(cafe=request.user.cafe)
        serializer = MenuItemSerializer(items, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(cafe=request.user.cafe, is_available=True)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def kitchen_menu_detail_view(request, pk):
    try:
        item = MenuItem.objects.get(pk=pk, cafe=request.user.cafe)
    except MenuItem.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = MenuItemSerializer(item)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=204)

# Student Orders
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders_view(request):
    if request.method == 'GET':
        orders = Order.objects.filter(student=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    
    # POST - создать заказ
    if request.user.role != 'student':
        return Response({'detail': 'Forbidden'}, status=403)

    cafe = Cafe.objects.get(pk=request.data['cafe'])
    from datetime import datetime, date

    cafe = Cafe.objects.get(pk=request.data['cafe'])
    pickup_time_str = request.data['pickup_time']
    today = date.today()
    pickup_time = datetime.strptime(f"{today} {pickup_time_str}", "%Y-%m-%d %H:%M")

    order = Order.objects.create(
        student=request.user,
        cafe=cafe,
        pickup_time=pickup_time,
        note=request.data.get('note', ''),
        pay_method=request.data.get('pay_method', 'cash')
    )

    for item in request.data['items']:
        OrderItem.objects.create(
            order=order,
            menu_item_id=item['menu_item'],
            quantity=item['quantity'],
            note=item.get('note', '')
        )

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_view(request):
    if request.user.role != 'student':
        return Response({'detail': 'Forbidden'}, status=403)

    cafe = Cafe.objects.get(pk=request.data['cafe'])
    from datetime import datetime, date

    cafe = Cafe.objects.get(pk=request.data['cafe'])
    pickup_time_str = request.data['pickup_time']
    today = date.today()
    pickup_time = datetime.strptime(f"{today} {pickup_time_str}", "%Y-%m-%d %H:%M")

    order = Order.objects.create(
        student=request.user,
        cafe=cafe,
        pickup_time=pickup_time,
        note=request.data.get('note', ''),
        pay_method=request.data.get('pay_method', 'cash')
    )
    for item in request.data['items']:
        OrderItem.objects.create(
            order=order,
            menu_item_id=item['menu_item'],
            quantity=item['quantity'],
            note=item.get('note', '')
        )

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=201)

# Kitchen status update
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def kitchen_order_status_view(request, pk):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)
    try:
        order = Order.objects.get(pk=pk, cafe=request.user.cafe)
    except Order.DoesNotExist:
        return Response(status=404)
    order.status = request.data.get('status')
    order.save()
    return Response(OrderSerializer(order).data)

class AdminKitchenView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin':
            return Response(status=403)
        cafes = Cafe.objects.all()
        return Response(CafeSerializer(cafes, many=True).data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response(status=403)
        user = CustomUser.objects.create_user(
            username=request.data['email'].split('@')[0],
            email=request.data['email'],
            password=request.data['password'],
            role='kitchen'
        )
        cafe = Cafe.objects.create(
            kitchen_user=user,
            name=request.data['name'],
            emoji=request.data.get('emoji', '🍽️'),
            floor=request.data.get('floor', '1')
        )
        return Response(CafeSerializer(cafe).data, status=201)
    

# Публичное меню для студентов (только чтение, без role check)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_menu_view(request):
    items = MenuItem.objects.filter(is_available=True)

    cafe_id = request.query_params.get('cafe')
    category = request.query_params.get('category')

    if cafe_id:
        items = items.filter(cafe_id=cafe_id)
    if category:
        items = items.filter(category=category)

    serializer = MenuItemSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def kitchen_profile_view(request):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)

    try:
        cafe = request.user.cafe
    except Cafe.DoesNotExist:
        return Response({'detail': 'Cafe not assigned'}, status=404)

    if request.method == 'GET':
        return Response({
            'name': cafe.name,
            'emoji': cafe.emoji,
            'floor': cafe.floor
        })

    cafe.name = request.data.get('name', cafe.name)
    cafe.emoji = request.data.get('emoji', cafe.emoji)
    cafe.floor = request.data.get('floor', cafe.floor)
    cafe.save()

    return Response({
        'name': cafe.name,
        'emoji': cafe.emoji,
        'floor': cafe.floor
    })


# ==================== REVIEWS ====================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_item_reviews_view(request, pk):
    """Получить все отзывы конкретного блюда"""
    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)

    reviews = menu_item.reviews.all()
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review_view(request, pk):
    """Оставить отзыв на блюдо (только студенты)"""
    if request.user.role != 'student':
        return Response({'detail': 'Only students can leave reviews'}, status=403)

    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)

    if Review.objects.filter(menu_item=menu_item, student=request.user).exists():
        return Response({'detail': 'You already reviewed this item'}, status=400)

    rating = request.data.get('rating')
    comment = request.data.get('comment', '')

    if not rating or int(rating) < 1 or int(rating) > 5:
        return Response({'detail': 'Rating must be between 1 and 5'}, status=400)

    review = Review.objects.create(
        menu_item=menu_item,
        student=request.user,
        rating=rating,
        comment=comment,
    )
    serializer = ReviewSerializer(review)
    return Response(serializer.data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review_view(request, pk):
    """Удалить свой отзыв"""
    try:
        review = Review.objects.get(pk=pk, student=request.user)
    except Review.DoesNotExist:
        return Response({'detail': 'Review not found'}, status=404)
    review.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_item_rating_view(request, pk):
    """Получить средний рейтинг блюда и количество отзывов"""
    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)

    reviews = menu_item.reviews.all()
    count = reviews.count()

    if count == 0:
        return Response({'rating': 0, 'count': 0})

    avg = sum(r.rating for r in reviews) / count
    return Response({'rating': round(avg, 1), 'count': count})