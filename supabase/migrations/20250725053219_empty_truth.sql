/*
  # Restaurant Management System Schema

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text, menu item name in Arabic)
      - `price` (decimal, price in dirhams)
      - `category` (text, food category)
      - `sold_today` (integer, daily sales counter)
      - `is_active` (boolean, whether item is available)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `total` (decimal, total order amount)
      - `created_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `menu_item_id` (uuid, foreign key to menu_items)
      - `quantity` (integer, quantity ordered)
      - `price_at_time` (decimal, price when ordered)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a single restaurant system)
    
  3. Initial Data
    - Insert sample menu items for pizza, tacos, cosmia, etc.
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  sold_today integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price_at_time decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single restaurant system)
CREATE POLICY "Allow public access to menu_items"
  ON menu_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to orders"
  ON orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to order_items"
  ON order_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert initial menu items
INSERT INTO menu_items (name, price, category) VALUES
  ('بيتزا مارغريتا', 45.00, 'بيتزا'),
  ('بيتزا بيبروني', 55.00, 'بيتزا'),
  ('بيتزا مشكلة', 60.00, 'بيتزا'),
  ('تاكوس دجاج', 25.00, 'تاكوس'),
  ('تاكوس لحم', 30.00, 'تاكوس'),
  ('تاكوس مشكل', 35.00, 'تاكوس'),
  ('كوزميا عادية', 15.00, 'ساندويتش'),
  ('كوزميا بالجبن', 20.00, 'ساندويتش'),
  ('كوزميا مشكلة', 25.00, 'ساندويتش'),
  ('برجر دجاج', 35.00, 'برجر'),
  ('برجر لحم', 40.00, 'برجر'),
  ('برجر مشكل', 45.00, 'برجر'),
  ('سلطة مشكلة', 20.00, 'سلطات'),
  ('سلطة دجاج', 25.00, 'سلطات'),
  ('عصير طبيعي', 12.00, 'مشروبات'),
  ('مشروب غازي', 8.00, 'مشروبات');

-- Create function to update sold_today counter
CREATE OR REPLACE FUNCTION update_sold_today()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE menu_items 
  SET sold_today = sold_today + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.menu_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sold_today when order_items are inserted
CREATE TRIGGER update_menu_item_sold_today
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sold_today();

-- Create function to reset daily counters (can be called manually or scheduled)
CREATE OR REPLACE FUNCTION reset_daily_counters()
RETURNS void AS $$
BEGIN
  UPDATE menu_items SET sold_today = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql;