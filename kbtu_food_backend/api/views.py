from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Cafe, MenuItem, Order, OrderItem
from .serializers import LoginSerializer, CafeSerializer, MenuItemSerializer, OrderSerializer

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
                'refresh': str(refresh)
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
            serializer.save(cafe=request.user.cafe)
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders_view(request):
    orders = Order.objects.filter(student=request.user)
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_view(request):
    if request.user.role != 'student':
        return Response({'detail': 'Forbidden'}, status=403)

    cafe = Cafe.objects.get(pk=request.data['cafe'])
    order = Order.objects.create(
        student=request.user,
        cafe=cafe,
        pickup_time=request.data['pickup_time'],
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