<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Notification;
use App\Models\Message;
use App\Models\ProductManagerAssignment;
use App\Helpers\AuditLogger;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
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

    // ── PUBLIC — Browse approved listings ─────────────────────
    // No permission check – public route
    public function browse(Request $request)
    {
        $query = Product::with([
            'seller:id,name,location',
            'category:category_id,name',
            'subCategory:subcategory_id,sub_category_name',
            'images',
        ])->where('status', 'approved');

        // Search by title
        if ($request->has('search') && $request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by subcategory
        if ($request->has('subcategory_id')) {
            $query->where('subcategory_id', $request->subcategory_id);
        }

        // Filter by condition
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $products = $query->latest()->paginate(12);

        // Seller rating summaries for this page (avoids N+1)
        $ratingMap = SellerRatingController::summariesFor(
            $products->getCollection()->pluck('seller_id')
        );

        // FIX: Transform the response to include slug and hash_id
        $products->getCollection()->transform(function ($product) use ($ratingMap) {
            $seller = $product->seller ? $product->seller->toArray() : null;
            if ($seller) {
                $summary = $ratingMap[(int) $product->seller_id] ?? ['average' => 0, 'count' => 0];
                $seller['rating_average'] = $summary['average'];
                $seller['rating_count']   = $summary['count'];
            }

            return [
                'product_id' => $product->product_id,
                'seller_id' => $product->seller_id,
                'slug' => $product->slug,
                'hash_id' => $product->hash_id,
                'title' => $product->title,
                'description' => $product->description,
                'price' => $product->price,
                'condition' => $product->condition,
                'specification' => $product->specification,
                'status' => $product->status,
                'created_at' => $product->created_at,
                'seller' => $seller,
                'category' => $product->category,
                'subCategory' => $product->subCategory,
                'images' => $product->images,
            ];
        });

        return response()->json($products, 200);
    }

    // ── PUBLIC — View single approved listing ──────────────────
    // No permission check – public route
    public function show($slug, $hashId)
    {
        // Find product by hash_id
        $product = Product::with([
            'seller:id,name,location,phone',
            'category:category_id,name',
            'subCategory:subcategory_id,sub_category_name',
            'images',
        ])->where('hash_id', $hashId)
          ->where('status', 'approved')
          ->firstOrFail();

        // If slug doesn't match current title, redirect to correct slug
        $expectedSlug = Str::slug($product->title);
        if ($slug !== $expectedSlug) {
            return redirect()->route('product.show', [
                'slug' => $expectedSlug,
                'hashId' => $product->hash_id
            ], 301);
        }

        // Attach the seller's rating summary
        $seller = $product->seller ? $product->seller->toArray() : null;
        if ($seller) {
            $summary = SellerRatingController::summaryFor($product->seller_id);
            $seller['rating_average'] = $summary['average'];
            $seller['rating_count']   = $summary['count'];
        }

        // FIX: Include slug and hash_id in the response
        return response()->json([
            'product' => [
                'product_id' => $product->product_id,
                'seller_id' => $product->seller_id,
                'slug' => $product->slug,
                'hash_id' => $product->hash_id,
                'title' => $product->title,
                'description' => $product->description,
                'price' => $product->price,
                'condition' => $product->condition,
                'specification' => $product->specification,
                'status' => $product->status,
                'created_at' => $product->created_at,
                'seller' => $seller,
                'category' => $product->category,
                'subCategory' => $product->subCategory,
                'images' => $product->images,
            ]
        ], 200);
    }

    // ── PUBLIC — Browse categories ─────────────────────────────
    // No permission check – public route
    public function categories()
    {
        $categories = Category::with('subcategories')
            ->orderBy('name')
            ->get();

        return response()->json([
            'categories' => $categories
        ], 200);
    }

    // ── SELLER — Create a listing ──────────────────────────────
    public function store(Request $request)
    {
        if (!$this->user->can('product-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to create products.'], 403);
        }

        if (!$this->user->email_verified_at) {
            return response()->json([
                'message'          => 'Please verify your email address before creating a listing.',
                'email_unverified' => true,
            ], 403);
        }

        $validated = $request->validate([
            'category_id'    => 'required|exists:categories,category_id',
            'subcategory_id' => 'required|exists:sub_categories,subcategory_id',
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'condition'      => 'required|in:New,Good,Fair,Poor',
            'price'          => 'required|numeric|min:0',
            'specification'  => 'nullable|string',
            'images'         => 'nullable|array|max:5',
            'images.*'       => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $product = Product::create([
            'seller_id'      => Auth::id(),
            'category_id'    => $validated['category_id'],
            'subcategory_id' => $validated['subcategory_id'],
            'title'          => $validated['title'],
            'description'    => $validated['description'],
            'condition'      => $validated['condition'],
            'price'          => $validated['price'],
            'specification'  => $validated['specification'] ?? null,
            'status'         => 'pending',
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->product_id,
                    'image_path' => $path,
                ]);
            }
        }

        AuditLogger::log('products', $product->product_id, 'created', null, $product->toArray());

        // Notify the assigned PM for this category
        $assignment = ProductManagerAssignment::where('category_id', $product->category_id)->first();
        if ($assignment) {
            Notification::create([
                'user_id'      => $assignment->product_manager_id,
                'type'         => 'new_listing',
                'reference_id' => $product->product_id,
                'message'      => "A new listing \"{$product->title}\" has been submitted for review in your category.",
                'is_read'      => false,
            ]);
        }

        // FIX: Include slug and hash_id in the response
        $productData = $product->load(['category', 'subCategory', 'images']);
        $responseProduct = [
            'product_id' => $productData->product_id,
            'slug' => $productData->slug,
            'hash_id' => $productData->hash_id,
            'title' => $productData->title,
            'description' => $productData->description,
            'price' => $productData->price,
            'condition' => $productData->condition,
            'specification' => $productData->specification,
            'status' => $productData->status,
            'created_at' => $productData->created_at,
            'category' => $productData->category,
            'subCategory' => $productData->subCategory,
            'images' => $productData->images,
        ];

        return response()->json([
            'message' => 'Listing created successfully and submitted for approval.',
            'product' => $responseProduct,
        ], 201);
    }

    // ── SELLER — Edit own listing ──────────────────────────────
    public function update(Request $request, $hashId)
    {
        if (!$this->user->can('product-edit')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to edit products.'], 403);
        }

        $product = Product::where('hash_id', $hashId)->firstOrFail();

        // Business rule: Only the seller can edit their own listing
        if ($product->seller_id !== Auth::id()) {
            return response()->json([
                'error' => 'You can only edit your own listings.'
            ], 403);
        }

        // Business rule: Cannot edit an approved listing
        if ($product->status === 'approved') {
            return response()->json([
                'error' => 'Approved listings cannot be edited.'
            ], 400);
        }

        $validated = $request->validate([
            'category_id'    => 'sometimes|exists:categories,category_id',
            'subcategory_id' => 'sometimes|exists:sub_categories,subcategory_id',
            'title'          => 'sometimes|string|max:255',
            'description'    => 'sometimes|string',
            'condition'      => 'sometimes|in:New,Good,Fair,Poor',
            'price'          => 'sometimes|numeric|min:0',
            'specification'  => 'nullable|string',
        ]);

        $oldValue = $product->toArray();
        $product->update($validated);

        AuditLogger::log('products', $product->product_id, 'updated', $oldValue, $product->toArray());

        // FIX: Include slug and hash_id in the response
        $productData = $product->load(['category', 'subCategory', 'images']);
        $responseProduct = [
            'product_id' => $productData->product_id,
            'slug' => $productData->slug,
            'hash_id' => $productData->hash_id,
            'title' => $productData->title,
            'description' => $productData->description,
            'price' => $productData->price,
            'condition' => $productData->condition,
            'specification' => $productData->specification,
            'status' => $productData->status,
            'created_at' => $productData->created_at,
            'category' => $productData->category,
            'subCategory' => $productData->subCategory,
            'images' => $productData->images,
        ];

        return response()->json([
            'message' => 'Listing updated successfully.',
            'product' => $responseProduct,
        ], 200);
    }

    // ── SELLER — Delete own listing ────────────────────────────
    public function destroy($hashId)
    {
        if (!$this->user->can('product-delete')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete products.'], 403);
        }

        $product = Product::where('hash_id', $hashId)->firstOrFail();

        // Business rule: Only the seller can delete their own listing
        if ($product->seller_id !== Auth::id()) {
            return response()->json([
                'error' => 'You can only delete your own listings.'
            ], 403);
        }

        // Business rule: Cannot delete an approved listing
        if ($product->status === 'approved') {
            return response()->json([
                'error' => 'Approved listings cannot be deleted. Contact support.'
            ], 400);
        }

        $oldValue = $product->toArray();

        // Delete images from storage
        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->image_path);
            $image->delete();
        }

        $product->delete();

        AuditLogger::log('products', $product->product_id, 'deleted', $oldValue, null);

        return response()->json([
            'message' => 'Listing deleted successfully.'
        ], 200);
    }

    // ── SELLER — View own listings ─────────────────────────────
    public function myListings(Request $request)
    {
        if (!$this->user->can('product-list')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view your listings.'], 403);
        }

        $query = Product::with([
            'category:category_id,name',
            'subCategory:subcategory_id,sub_category_name',
            'images',
        ])->where('seller_id', Auth::id());

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $products = $query->latest()->get();

        // FIX: Transform the response to include slug and hash_id
        $transformedProducts = $products->map(function ($product) {
            return [
                'product_id' => $product->product_id,
                'slug' => $product->slug,
                'hash_id' => $product->hash_id,
                'title' => $product->title,
                'description' => $product->description,
                'price' => $product->price,
                'condition' => $product->condition,
                'specification' => $product->specification,
                'status' => $product->status,
                'rejection_reason' => $product->rejection_reason,
                'created_at' => $product->created_at,
                'category' => $product->category,
                'subCategory' => $product->subCategory,
                'images' => $product->images,
            ];
        });

        return response()->json([
            'products' => $transformedProducts,
            'count'    => $transformedProducts->count(),
        ], 200);
    }

    // ── SELLER — Resubmit after rejection ─────────────────────
    public function resubmit(Request $request, $hashId)
    {
        if (!$this->user->can('product-create')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to resubmit products.'], 403);
        }

        $product = Product::where('hash_id', $hashId)->firstOrFail();

        // Business rule: Only the seller can resubmit their own listing
        if ($product->seller_id !== Auth::id()) {
            return response()->json(['error' => 'You can only resubmit your own listings.'], 403);
        }

        // Business rule: Only rejected listings can be resubmitted
        if ($product->status !== 'rejected') {
            return response()->json(['error' => 'Only rejected listings can be resubmitted.'], 400);
        }

        $validated = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'description'    => 'sometimes|string',
            'condition'      => 'sometimes|in:New,Good,Fair,Poor',
            'price'          => 'sometimes|numeric|min:0',
            'specification'  => 'nullable|string',
            'images'         => 'nullable|array|max:5',
            'images.*'       => 'image|mimes:jpeg,png,jpg|max:2048',
            'remove_images'  => 'nullable|array',
            'remove_images.*' => 'integer',
        ]);

        $oldValue = $product->toArray();

        if (!empty($validated)) {
            $product->fill(collect($validated)->except(['images', 'remove_images'])->toArray());
        }

        $product->status           = 'pending';
        $product->rejection_reason = null;
        $product->reviewed_by      = null;
        $product->reviewed_at      = null;
        $product->resubmitted_at   = now();
        $product->save();

        // Remove selected old images
        if ($request->has('remove_images')) {
            $imagesToRemove = ProductImage::whereIn('productImage_id', $request->remove_images)
                ->where('product_id', $product->product_id)
                ->get();

            foreach ($imagesToRemove as $img) {
                Storage::disk('public')->delete($img->image_path);
                $img->delete();
            }
        }

        // Add new images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->product_id,
                    'image_path' => $path,
                ]);
            }
        }

        AuditLogger::log('products', $product->product_id, 'updated', $oldValue, $product->toArray());

        // Notify PM
        $assignment = ProductManagerAssignment::where('category_id', $product->category_id)->first();
        if ($assignment) {
            Notification::create([
                'user_id'      => $assignment->product_manager_id,
                'type'         => 'listing_resubmitted',
                'reference_id' => $product->product_id,
                'message'      => "The listing \"{$product->title}\" has been corrected and resubmitted for review.",
                'is_read'      => false,
            ]);
        }

        // Notify all Admins
        $admins = \App\Models\User::role('Admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id'      => $admin->id,
                'type'         => 'listing_resubmitted',
                'reference_id' => $product->product_id,
                'message'      => "Listing \"{$product->title}\" has been corrected and resubmitted for review.",
                'is_read'      => false,
            ]);
        }

        // FIX: Include slug and hash_id in the response
        $productData = $product->load(['category', 'subCategory', 'images']);
        $responseProduct = [
            'product_id' => $productData->product_id,
            'slug' => $productData->slug,
            'hash_id' => $productData->hash_id,
            'title' => $productData->title,
            'description' => $productData->description,
            'price' => $productData->price,
            'condition' => $productData->condition,
            'specification' => $productData->specification,
            'status' => $productData->status,
            'created_at' => $productData->created_at,
            'category' => $productData->category,
            'subCategory' => $productData->subCategory,
            'images' => $productData->images,
        ];

        return response()->json([
            'message' => 'Listing resubmitted successfully. No additional fee required.',
            'product' => $responseProduct,
        ], 200);
    }

    // ── SELLER/BUYER — Send a message about a product ─────────
    public function sendMessage(Request $request, $hashId)
    {
        if (!$this->user->can('message-send')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to send messages.'], 403);
        }

        $product = Product::where('hash_id', $hashId)->firstOrFail();

        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'message_text' => 'required|string|min:1',
        ]);

        // Business rule: Cannot message yourself
        if ($validated['recipient_id'] == Auth::id()) {
            return response()->json([
                'error' => 'You cannot send a message to yourself.'
            ], 400);
        }

        $message = Message::create([
            'product_id'   => $product->product_id,
            'sender_id'    => Auth::id(),
            'recipient_id' => $validated['recipient_id'],
            'message_text' => $validated['message_text'],
            'is_read'      => false,
        ]);

        // Notify recipient
        Notification::create([
            'user_id'      => $validated['recipient_id'],
            'type'         => 'new_message',
            'reference_id' => $product->product_id,
            'message'      => "You have a new message regarding \"{$product->title}\".",
            'is_read'      => false,
        ]);

        return response()->json([
            'message'      => 'Message sent successfully.',
            'sent_message' => $message,
        ], 201);
    }

    // ── SELLER/BUYER — View messages on a product ──────────────
    public function getMessages($hashId)
    {
        if (!$this->user->can('message-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view messages.'], 403);
        }

        $product = Product::where('hash_id', $hashId)->firstOrFail();

        $messages = Message::with([
            'sender:id,name',
            'recipient:id,name',
        ])
        ->where('product_id', $product->product_id)
        ->where(function($q) {
            $q->where('sender_id',    Auth::id())
              ->orWhere('recipient_id', Auth::id());
        })
        ->oldest()
        ->get();

        // Mark messages as read
        Message::where('product_id',    $product->product_id)
               ->where('recipient_id',  Auth::id())
               ->where('is_read',       false)
               ->update(['is_read' => true]);

        return response()->json([
            'messages' => $messages,
            'count'    => $messages->count(),
        ], 200);
    }

    // ── SELLER/BUYER — View all notifications ─────────────────
    public function notifications()
    {
        if (!$this->user->can('notification-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view notifications.'], 403);
        }

        $notifications = Notification::where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $notifications->where('is_read', false)->count(),
        ], 200);
    }

    // ── SELLER/BUYER — Mark notification as read ──────────────
    public function markNotificationRead(int $id)
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

    // ── GET PROFILE ───────────────────────────────────────────
    // No permission check – users always see their own profile
    public function getProfile(Request $request)
    {
        return response()->json(['user' => $request->user()], 200);
    }

    // ── UPDATE PROFILE ────────────────────────────────────────
    // No permission check – users always update their own profile
    public function updateProfile(Request $request)
    {
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
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();
        AuditLogger::log('users', $user->id, 'updated', [], $user->toArray());

        return response()->json(['message' => 'Profile updated successfully.', 'user' => $user], 200);
    }
}