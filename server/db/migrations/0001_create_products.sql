CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spf', 'moisturizer', 'cleanser', 'serum')),
  price_czk INTEGER NOT NULL CHECK (price_czk >= 0),
  skin_types TEXT[] NOT NULL DEFAULT '{}',
  concerns TEXT[] NOT NULL DEFAULT '{}',
  spf INTEGER CHECK (spf IS NULL OR spf > 0),
  fragrance_free BOOLEAN NOT NULL,
  texture TEXT CHECK (texture IN ('fluid', 'cream', 'gel', 'stick')),
  in_stock BOOLEAN NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price_czk ON products(price_czk);
CREATE INDEX idx_products_in_stock ON products(in_stock);
