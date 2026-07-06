<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Notification;
use App\Models\Message;
use App\Models\ProductManagerAssignment;
use App\Helpers\AuditLogger;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\ProductApprovedMail;
use App\Mail\ProductRejectedMail;

class ProductManagerController extends Controller
{
    /**
     * @var \App\Models\User|null
     */
    protected $user;

    /**
     * Constructor – set the authenticated user once.
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            /** @var \App\Models\User $user */
            $this->user = $request->user();
            return $next($request);
        });
    }

    // ── HELPER — Get assigned category IDs for this PM ────────
    private function assignedCategoryIds()
    {
        return ProductManagerAssignment::where('product_manager_id', Auth::id())
            ->pluck('category_id')
            ->toArray();
    }

    // ── STATS ─────────────────────────────────────────────────
    public function stats()
    {
        // Check if user has permission to view dashboard
        if (!$this->user->can('dashboard-view') && !$this->user->can('product-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view dashboard stats.'], 403);
        }

        $categoryIds = $this->assignedCategoryIds();

        return response()->json([
            'stats' => [
                'assigned_categories' => count($categoryIds),
                'total_products'      => Product::whereIn('category_id', $categoryIds)->count(),
                'pending_products'    => Product::whereIn('category_id', $categoryIds)->where('status', 'pending')->count(),
                'approved_products'   => Product::whereIn('category_id', $categoryIds)->where('status', 'approved')->count(),
                'rejected_products'   => Product::whereIn('category_id', $categoryIds)->where('status', 'rejected')->count(),
            ],
        ], 200);
    }

    // ── LIST PRODUCTS IN ASSIGNED CATEGORIES ──────────────────
    public function listProducts(Request $request)
    {
        if (!$this->user->can('product-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view products.'], 403);
        }

        $categoryIds = $this->assignedCategoryIds();

        if (empty($categoryIds)) {
            return response()->json([
                'message'  => 'You have no categories assigned yet.',
                'products' => [],
                'count'    => 0,
            ], 200);
        }

        $query = Product::with([
            'seller:id,name,email,phone',
            'category:category_id,name',
            'images',
        ])->whereIn('category_id', $categoryIds);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $products = $query->latest()->get();

        return response()->json([
            'products' => $products,
            'count'    => $products->count(),
        ], 200);
    }

    // ── VIEW SINGLE PRODUCT ───────────────────────────────────
    public function viewProduct($id)
    {
        if (!$this->user->can('product-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view product details.'], 403);
        }

        $categoryIds = $this->assignedCategoryIds();

        $product = Product::with([
            'seller:id,name,email,phone',
            'category:category_id,name',
            'images',
        ])->findOrFail($id);

        // Business rule: PM can only view products in their assigned categories
        if (!in_array($product->category_id, $categoryIds)) {
            return response()->json([
                'error' => 'You are not assigned to this product\'s category.'
            ], 403);
        }

        return response()->json([
            'product' => $product
        ], 200);
    }

    // ── APPROVE PRODUCT ───────────────────────────────────────
    public function approveProduct(Request $request, $id)
    {
        if (!$this->user->can('product-approve')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to approve products.'], 403);
        }

        $categoryIds = $this->assignedCategoryIds();

        $product = Product::findOrFail($id);

        // Business rule: PM can only approve products in their assigned categories
        if (!in_array($product->category_id, $categoryIds)) {
            return response()->json([
                'error' => 'You are not assigned to this product\'s category.'
            ], 403);
        }

        if ($product->status === 'approved') {
            return response()->json([
                'error' => 'This product is already approved.'
            ], 400);
        }

        $oldValue = $product->toArray();

        $product->status           = 'approved';
        $product->reviewed_by      = Auth::id();
        $product->reviewed_at      = now();
        $product->rejection_reason = null;
        $product->save();

        AuditLogger::log('products', $product->product_id, 'updated', $oldValue, $product->toArray());

        // Notify seller
        Notification::create([
            'user_id'      => $product->seller_id,
            'type'         => 'product_approved',
            'reference_id' => $product->product_id,
            'message'      => "Your product listing \"{$product->title}\" has been approved and is now live.",
            'is_read'      => false,
        ]);

        if ($product->seller?->email) {
            Mail::to($product->seller->email)->send(new ProductApprovedMail($product));
        }

        return response()->json([
            'message' => 'Product approved successfully.',
            'product' => $product,
        ], 200);
    }

    // ── REJECT PRODUCT ────────────────────────────────────────
    public function rejectProduct(Request $request, $id)
    {
        if (!$this->user->can('product-reject')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to reject products.'], 403);
        }

        $categoryIds = $this->assignedCategoryIds();

        $product = Product::findOrFail($id);

        // Business rule: PM can only reject products in their assigned categories
        if (!in_array($product->category_id, $categoryIds)) {
            return response()->json([
                'error' => 'You are not assigned to this product\'s category.'
            ], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:10',
        ]);

        if ($product->status === 'rejected') {
            return response()->json([
                'error' => 'This product is already rejected.'
            ], 400);
        }

        $oldValue = $product->toArray();

        $product->status           = 'rejected';
        $product->reviewed_by      = Auth::id();
        $product->reviewed_at      = now();
        $product->rejection_reason = $validated['rejection_reason'];
        $product->save();

        AuditLogger::log('products', $product->product_id, 'updated', $oldValue, $product->toArray());

        // Notify seller
        Notification::create([
            'user_id'      => $product->seller_id,
            'type'         => 'product_rejected',
            'reference_id' => $product->product_id,
            'message'      => "Your product listing \"{$product->title}\" has been rejected.",
            'is_read'      => false,
        ]);

        // Send rejection message to seller
        Message::create([
            'product_id'   => $product->product_id,
            'sender_id'    => Auth::id(),
            'recipient_id' => $product->seller_id,
            'message_text' => "Your listing \"{$product->title}\" was rejected for the following reason: {$validated['rejection_reason']}",
            'is_read'      => false,
        ]);

        if ($product->seller?->email) {
            Mail::to($product->seller->email)->send(new ProductRejectedMail($product));
        }

        return response()->json([
            'message' => 'Product rejected and seller has been notified.',
            'product' => $product,
        ], 200);
    }

    // ── VIEW MESSAGES ─────────────────────────────────────────
    public function listMessages()
    {
        if (!$this->user->can('message-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view messages.'], 403);
        }

        $messages = Message::with([
            'sender:id,name,email',
            'recipient:id,name,email',
        ])
        ->where(function($q) {
            $q->where('sender_id',    Auth::id())
              ->orWhere('recipient_id', Auth::id());
        })
        ->latest()
        ->get();

        return response()->json([
            'messages' => $messages,
            'count'    => $messages->count(),
        ], 200);
    }

    // ── VIEW NOTIFICATIONS ────────────────────────────────────
    public function listNotifications()
    {
        if (!$this->user->can('notification-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view notifications.'], 403);
        }

        $notifications = Notification::where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'notifications'  => $notifications,
            'unread_count'   => $notifications->where('is_read', false)->count(),
        ], 200);
    }

    // ── MARK NOTIFICATION AS READ ─────────────────────────────
    public function markNotificationRead($id)
    {
        if (!$this->user->can('notification-mark-read')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to mark notifications as read.'], 403);
        }

        $notification = Notification::where('notification_id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'message' => 'Notification marked as read.'
        ], 200);
    }

    // ── MARK ALL NOTIFICATIONS AS READ ───────────────────────
    public function markAllNotificationsRead()
    {
        if (!$this->user->can('notification-mark-read')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to mark notifications as read.'], 403);
        }

        Notification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read.'
        ], 200);
    }

    // ── GET PROFILE ───────────────────────────────────────────
    public function getProfile(Request $request)
    {
        // No permission check – users always see their own profile
        return response()->json([
            'user' => $request->user(),
        ], 200);
    }

    // ── UPDATE PROFILE ────────────────────────────────────────
    public function updateProfile(Request $request)
    {
        // No permission check – users always update their own profile
        $user = $request->user();

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'sometimes|string|max:20',
            'location' => 'sometimes|string|max:100',
            'password' => 'sometimes|string|min:8|confirmed',
            'avatar'   => 'sometimes|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if (isset($validated['name']))     $user->name     = $validated['name'];
        if (isset($validated['phone']))    $user->phone    = $validated['phone'];
        if (isset($validated['location'])) $user->location = $validated['location'];

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();

        AuditLogger::log('users', $user->id, 'updated', [], $user->toArray());

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $user,
        ], 200);
    }
}