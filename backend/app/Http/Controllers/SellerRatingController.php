<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\SellerRating;
use App\Models\Message;
use App\Models\User;
use App\Helpers\AuditLogger;
use Illuminate\Support\Facades\Auth;

class SellerRatingController extends Controller
{
    // ── BUYER — Submit / update a star rating for a seller ─────
    public function store(Request $request, $sellerId)
    {
        $buyerId = Auth::id();

        // Business rule: cannot rate yourself
        if ((int) $sellerId === (int) $buyerId) {
            return response()->json(['error' => 'You cannot rate yourself.'], 400);
        }

        // Seller must exist
        if (!User::where('id', $sellerId)->exists()) {
            return response()->json(['error' => 'Seller not found.'], 404);
        }

        // Business rule: only buyers who have contacted the seller may rate them
        if (!$this->hasContactedSeller($buyerId, $sellerId)) {
            return response()->json([
                'error' => 'You can only rate a seller you have contacted about a listing.',
            ], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $rating = SellerRating::updateOrCreate(
            ['seller_id' => $sellerId, 'buyer_id' => $buyerId],
            ['rating' => $validated['rating']]
        );

        AuditLogger::log('seller_ratings', $rating->rating_id, 'rated', null, $rating->toArray());

        return response()->json([
            'message'   => 'Thank you for rating this seller.',
            'my_rating' => $rating->rating,
            'summary'   => self::summaryFor($sellerId),
        ], 200);
    }

    // ── BUYER — Own rating status for a seller ─────────────────
    public function myStatus($sellerId)
    {
        $buyerId = Auth::id();

        $canRate = (int) $sellerId !== (int) $buyerId
            && $this->hasContactedSeller($buyerId, $sellerId);

        $myRating = SellerRating::where('seller_id', $sellerId)
            ->where('buyer_id', $buyerId)
            ->value('rating');

        return response()->json([
            'can_rate'  => $canRate,
            'my_rating' => $myRating, // null if not yet rated
            'summary'   => self::summaryFor($sellerId),
        ], 200);
    }

    // Has the buyer sent at least one message to this seller?
    private function hasContactedSeller($buyerId, $sellerId): bool
    {
        return Message::where('sender_id', $buyerId)
            ->where('recipient_id', $sellerId)
            ->exists();
    }

    // Aggregate rating for a single seller
    public static function summaryFor($sellerId): array
    {
        $agg = SellerRating::where('seller_id', $sellerId)
            ->selectRaw('AVG(rating) as average, COUNT(*) as count')
            ->first();

        $count = $agg ? (int) $agg->count : 0;

        return [
            'average' => $count > 0 ? round((float) $agg->average, 1) : 0,
            'count'   => $count,
        ];
    }

    // Aggregate ratings for many sellers at once (avoids N+1)
    public static function summariesFor($sellerIds): array
    {
        $ids = collect($sellerIds)->filter()->unique()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        return SellerRating::whereIn('seller_id', $ids)
            ->selectRaw('seller_id, AVG(rating) as average, COUNT(*) as count')
            ->groupBy('seller_id')
            ->get()
            ->mapWithKeys(fn ($row) => [
                (int) $row->seller_id => [
                    'average' => round((float) $row->average, 1),
                    'count'   => (int) $row->count,
                ],
            ])
            ->toArray();
    }
}
