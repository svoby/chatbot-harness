import type { ProductRecommendation } from "@/shared/types/product";

interface Props {
  recommendation: ProductRecommendation;
}

export default function ProductCard({ recommendation }: Props) {
  const { product, reasons, score } = recommendation;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            {product.brand}
          </p>
          <h3 className="text-base font-semibold text-gray-900 leading-snug mt-0.5">
            {product.name}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-gray-900">
            {product.priceCzk} CZK
          </span>
          <div className="mt-0.5 flex justify-end gap-1 flex-wrap">
            {product.spf && (
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                SPF {product.spf}
              </span>
            )}
            {product.fragranceFree && (
              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Fragrance-free
              </span>
            )}
            {product.texture && (
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                {product.texture}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 leading-relaxed">{product.description}</div>

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1.5">Why this?</p>
        <ul className="space-y-1">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-0.5 text-indigo-400 shrink-0">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2 mt-1">
        <span>
          {product.inStock ? (
            <span className="text-green-600 font-medium">In stock</span>
          ) : (
            <span className="text-red-500 font-medium">Out of stock</span>
          )}
        </span>
        <span>Match score: {Math.round(score * 100)}%</span>
      </div>
    </div>
  );
}
