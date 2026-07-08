import { useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { getSellerRatingStatus, rateSeller } from '../api/ratings';

/**
 * Seller reputation widget.
 * - Always shows the seller's average stars + count.
 * - If the current user is a signed-in buyer (not the seller) who has the
 *   `rating-create` permission, it fetches their eligibility and lets them
 *   submit / update a 1–5 star rating (only if they've contacted the seller).
 */
export default function SellerRating({ sellerId, isSeller = false, initialAverage = 0, initialCount = 0 }) {
  const { user, permissions } = useAuth();
  const { toast } = useToast();

  const [summary, setSummary] = useState({ average: Number(initialAverage) || 0, count: Number(initialCount) || 0 });
  const [myRating, setMyRating] = useState(null);
  const [canRate, setCanRate] = useState(false);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  const canCreate = permissions?.includes('rating-create') || false;
  const showSubmit = !!user && !isSeller && canCreate;

  // Keep the average in sync if the parent re-supplies it
  useEffect(() => {
    setSummary({ average: Number(initialAverage) || 0, count: Number(initialCount) || 0 });
  }, [initialAverage, initialCount]);

  // Fetch this buyer's rating status (eligibility + existing rating)
  useEffect(() => {
    if (!showSubmit || !sellerId) return;
    getSellerRatingStatus(sellerId)
      .then(res => {
        setCanRate(!!res.data.can_rate);
        setMyRating(res.data.my_rating ?? null);
        if (res.data.summary) setSummary(res.data.summary);
      })
      .catch(() => {});
  }, [sellerId, showSubmit]);

  const submit = async (value) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await rateSeller(sellerId, value);
      setMyRating(res.data.my_rating);
      if (res.data.summary) setSummary(res.data.summary);
      toast(res.data.message || 'Rating submitted', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Could not submit rating', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Stars = ({ value, interactive = false, size = 'w-4 h-4' }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = interactive ? n <= (hover || value) : n <= Math.round(value);
        const star = (
          <FiStar
            className={`${size} ${filled ? 'text-amber-400' : 'text-slate-300'}`}
            fill={filled ? 'currentColor' : 'none'}
          />
        );
        if (!interactive) return <span key={n} aria-hidden>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            disabled={saving}
            title={`${n} star${n !== 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(n)}
            className="transition-transform hover:scale-110 disabled:opacity-60"
          >
            {star}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mt-3 flex flex-col gap-2">
      {/* Average / count */}
      <div className="flex items-center gap-2">
        <Stars value={summary.average} />
        <span className="text-xs text-slate-500 dark:text-gray-400">
          {summary.count > 0
            ? `${Number(summary.average).toFixed(1)} · ${summary.count} rating${summary.count !== 1 ? 's' : ''}`
            : 'No ratings yet'}
        </span>
      </div>

      {/* Submit / eligibility */}
      {showSubmit && (
        canRate ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-gray-400">{myRating ? 'Your rating:' : 'Rate this seller:'}</span>
            <Stars value={myRating || 0} interactive />
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-gray-500">
            This account isn't rateable.
          </p>
        )
      )}
    </div>
  );
}
