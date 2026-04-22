from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Count
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
    if not email:
        return Response({'email': 'Email is required'}, status=400)
    if CustomUser.objects.filter(email=email).exists():
        return Response({'email': 'User already exists'}, status=400)
    user = CustomUser.objects.create_user(
        username=email.split('@')[0],
        email=email,
        password=request.data.get('password', ''),
        first_name=request.data.get('name', ''),
        role='student'
    )
    refresh = RefreshToken.for_user(user)
    return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})


# ==================== CAFES ====================

class CafeListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(CafeSerializer(Cafe.objects.all(), many=True).data)


# ==================== KITCHEN ====================

class KitchenOrdersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'kitchen':
            return Response({'detail': 'Forbidden'}, status=403)
        orders = Order.objects.exclude(status='picked').order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def kitchen_menu_view(request):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)
    if request.method == 'GET':
        items = MenuItem.objects.all()
        return Response(MenuItemSerializer(items, many=True).data)
    
    # POST
    cafe_id = request.data.get('cafe_id')
    if cafe_id:
        try:
            cafe = Cafe.objects.get(pk=cafe_id)
        except Cafe.DoesNotExist:
            return Response({'detail': 'Cafe not found'}, status=404)
    else:
        try:
            cafe = request.user.cafe
        except Cafe.DoesNotExist:
            return Response({'detail': 'Cafe not assigned'}, status=400)

    serializer = MenuItemSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(cafe=cafe)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def kitchen_menu_detail_view(request, pk):
    try:
        item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response(status=404)
    if request.method == 'GET':
        return Response(MenuItemSerializer(item).data)
    elif request.method == 'PUT':
        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=204)



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def kitchen_order_status_view(request, pk):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response(status=404)
    new_status = request.data.get('status')
    if new_status not in ['pending', 'cooking', 'ready', 'picked', 'cancelled']:
        return Response({'detail': 'Invalid status'}, status=400)
    order.status = new_status
    order.save()
    return Response(OrderSerializer(order).data)
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def kitchen_profile_view(request):
    if request.user.role != 'kitchen':
        return Response({'detail': 'Forbidden'}, status=403)
    if request.method == 'GET':
        return Response({
            'name': 'KBTU Kitchen',
            'emoji': '🍽️',
            'floor': '1'
        })
    return Response({'name': 'KBTU Kitchen', 'emoji': '🍽️', 'floor': '1'})


# ==================== STUDENT ORDERS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def orders_view(request):
    if request.method == 'GET':
        orders = Order.objects.filter(student=request.user).order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    # POST
    if request.user.role != 'student':
        return Response({'detail': 'Forbidden'}, status=403)

    items_data = request.data.get('items', [])
    if not items_data:
        return Response({'detail': 'No items in order'}, status=400)

    pickup_time = request.data.get('pickup_time')
    if not pickup_time:
        return Response({'detail': 'pickup_time is required'}, status=400)

    # Если cafe не передан — берём из первого блюда
    cafe_id = request.data.get('cafe')
    if not cafe_id:
        try:
            first_item = MenuItem.objects.get(pk=items_data[0]['menu_item'])
            cafe_id = first_item.cafe_id
        except (MenuItem.DoesNotExist, KeyError, IndexError):
            return Response({'detail': 'Cannot determine cafe'}, status=400)

    try:
        cafe = Cafe.objects.get(pk=cafe_id)
    except Cafe.DoesNotExist:
        return Response({'detail': 'Cafe not found'}, status=404)

    order = Order.objects.create(
        student=request.user,
        cafe=cafe,
        pickup_time=pickup_time,
        note=request.data.get('note', ''),
        pay_method=request.data.get('pay_method', 'cash')
    )

    for item in items_data:
        try:
            OrderItem.objects.create(
                order=order,
                menu_item_id=item['menu_item'],
                quantity=item.get('quantity', 1),
                note=item.get('note', '')
            )
        except Exception:
            order.delete()
            return Response({'detail': f"Invalid menu item: {item.get('menu_item')}"}, status=400)

    return Response(OrderSerializer(order).data, status=201)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancel_order_view(request, pk):
    try:
        order = Order.objects.get(pk=pk, student=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=404)
    if order.status != 'pending':
        return Response({'detail': 'Cannot cancel order in current status'}, status=400)
    order.status = 'cancelled'
    order.save()
    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_view(request, pk):
    try:
        original = Order.objects.get(pk=pk, student=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=404)

    new_order = Order.objects.create(
        student=request.user,
        cafe=original.cafe,
        pickup_time=request.data.get('pickup_time', original.pickup_time),
        note=original.note,
        pay_method=original.pay_method
    )

    for item in original.items.all():
        if item.menu_item.is_available:
            OrderItem.objects.create(
                order=new_order,
                menu_item=item.menu_item,
                quantity=item.quantity,
                note=item.note
            )

    return Response(OrderSerializer(new_order).data, status=201)


# ==================== ADMIN ====================

class AdminKitchenView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin':
            return Response(status=403)
        return Response(CafeSerializer(Cafe.objects.all(), many=True).data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response(status=403)
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required'}, status=400)
        if CustomUser.objects.filter(email=email).exists():
            return Response({'detail': 'User with this email already exists'}, status=400)
        user = CustomUser.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=request.data.get('password', ''),
            role='kitchen'
        )
        cafe = Cafe.objects.create(
            kitchen_user=user,
            name=request.data.get('name', ''),
            emoji=request.data.get('emoji', '🍽️'),
            floor=request.data.get('floor', '1')
        )
        return Response(CafeSerializer(cafe).data, status=201)


# ==================== PUBLIC MENU ====================

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
    return Response(MenuItemSerializer(items, many=True).data)


# ==================== REVIEWS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_item_reviews_view(request, pk):
    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)
    return Response(ReviewSerializer(menu_item.reviews.all(), many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review_view(request, pk):
    if request.user.role != 'student':
        return Response({'detail': 'Only students can leave reviews'}, status=403)
    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)
    if Review.objects.filter(menu_item=menu_item, student=request.user).exists():
        return Response({'detail': 'You already reviewed this item'}, status=400)
    try:
        rating = int(request.data.get('rating', 0))
    except (TypeError, ValueError):
        return Response({'detail': 'Rating must be an integer between 1 and 5'}, status=400)
    if rating < 1 or rating > 5:
        return Response({'detail': 'Rating must be between 1 and 5'}, status=400)
    review = Review.objects.create(
        menu_item=menu_item,
        student=request.user,
        rating=rating,
        comment=request.data.get('comment', ''),
    )
    return Response(ReviewSerializer(review).data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review_view(request, pk):
    try:
        review = Review.objects.get(pk=pk, student=request.user)
    except Review.DoesNotExist:
        return Response({'detail': 'Review not found'}, status=404)
    review.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_item_rating_view(request, pk):
    try:
        menu_item = MenuItem.objects.get(pk=pk)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found'}, status=404)
    result = menu_item.reviews.aggregate(avg=Avg('rating'), count=Count('id'))
    return Response({'rating': round(result['avg'] or 0, 1), 'count': result['count'] or 0})