<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Product;
use App\Models\Settings;
use App\Models\User;
use App\Helpers\AuditLogger;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
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

    // ── All conversations for logged in user ──────────────────
    public function index()
    {
        if (!$this->user->can('message-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view messages.'], 403);
        }

        // Get all unique conversations grouped by product
        $messages = Message::with([
            'sender:id,name,email',
            'recipient:id,name,email',
            'product:product_id,title',
        ])
        ->where(function($q) {
            $q->where('sender_id',    Auth::id())
              ->orWhere('recipient_id', Auth::id());
        })
        ->latest()
        ->get()
        ->groupBy('product_id')
        ->map(function($group) {
            $latest = $group->first();
            return [
                'product_id'    => $latest->product_id,
                'product_title' => $latest->product?->title,
                'last_message'  => $latest->message_text,
                'last_message_at' => $latest->created_at,
                'unread_count'  => $group->where('recipient_id', Auth::id())
                                         ->where('is_read', false)
                                         ->count(),
                'other_person'  => $latest->sender_id === Auth::id()
                                    ? $latest->recipient
                                    : $latest->sender,
            ];
        })->values();

        return response()->json([
            'conversations' => $messages,
            'count'         => $messages->count(),
        ], 200);
    }

    // ── Messages on a specific product ────────────────────────
    public function show(int $productId)
    {
        if (!$this->user->can('message-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view messages.'], 403);
        }

        $product = Product::findOrFail($productId);

        $messages = Message::with([
            'sender:id,name,email',
            'recipient:id,name,email',
        ])
        ->where('product_id', $product->product_id)
        ->where(function($q) {
            $q->where('sender_id',    Auth::id())
              ->orWhere('recipient_id', Auth::id());
        })
        ->oldest()
        ->get();

        // Mark messages as read
        Message::where('product_id',   $product->product_id)
               ->where('recipient_id', Auth::id())
               ->where('is_read',      false)
               ->update(['is_read' => true]);

        return response()->json([
            'product'  => [
                'id'    => $product->product_id,
                'title' => $product->title,
            ],
            'messages' => $messages,
            'count'    => $messages->count(),
        ], 200);
    }

    // ── Send a message ────────────────────────────────────────
    public function send(Request $request)
    {
        if (!$this->user->can('message-send')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to send messages.'], 403);
        }

        $validated = $request->validate([
            'product_id'   => 'required|exists:products,product_id',
            'message_text' => 'required|string|min:1|max:2000',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Business rule: Determine recipient
        if (Auth::id() !== $product->seller_id) {
            // Buyer messaging — recipient is always the seller
            $recipientId = $product->seller_id;
        } else {
            // Seller replying — find the buyer who last messaged them
            $lastMessage = Message::where('product_id', $product->product_id)
                ->where('sender_id', '!=', Auth::id())
                ->latest()
                ->first();

            if (!$lastMessage) {
                return response()->json([
                    'error' => 'No one has messaged you about this listing yet.'
                ], 400);
            }

            $recipientId = $lastMessage->sender_id;
        }

        $message = Message::create([
            'product_id'   => $validated['product_id'],
            'sender_id'    => Auth::id(),
            'recipient_id' => $recipientId,
            'message_text' => $validated['message_text'],
            'is_read'      => false,
        ]);

        // Notify recipient
        Notification::create([
            'user_id'      => $recipientId,
            'type'         => 'new_message',
            'reference_id' => $validated['product_id'],
            'message'      => "You have a new message regarding \"{$product->title}\".",
            'is_read'      => false,
        ]);

        // Optional oversight ping — lets Admins/Super Admins keep an eye on
        // buyer-seller conversations without joining every thread.
        if (Settings::current()->notify_admins_on_new_message) {
            User::role(['Admin', 'Super-Admin'])->get()->each(function ($admin) use ($product) {
                Notification::create([
                    'user_id'      => $admin->id,
                    'type'         => 'new_message_oversight',
                    'reference_id' => $product->product_id,
                    'message'      => "New message activity on \"{$product->title}\".",
                    'is_read'      => false,
                ]);
            });
        }

        return response()->json([
            'message'      => 'Message sent successfully.',
            'sent_message' => $message->load([
                'sender:id,name,email',
                'recipient:id,name,email',
            ]),
        ], 201);
    }

    // ── Unread message count ──────────────────────────────────
    public function unreadCount()
    {
        if (!$this->user->can('message-view')) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to view messages.'], 403);
        }

        $count = Message::where('recipient_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $count
        ], 200);
    }
}