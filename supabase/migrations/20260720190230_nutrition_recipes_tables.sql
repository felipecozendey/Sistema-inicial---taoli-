ALTER TABLE custom_foods ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS nutrition_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES nutrition_recipes(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES custom_foods(id) ON DELETE CASCADE NOT NULL,
  amount TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_recipes_user_id ON nutrition_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

ALTER TABLE nutrition_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "nutrition_recipes_select" ON nutrition_recipes;
  CREATE POLICY "nutrition_recipes_select" ON nutrition_recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_recipes_insert" ON nutrition_recipes;
  CREATE POLICY "nutrition_recipes_insert" ON nutrition_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_recipes_update" ON nutrition_recipes;
  CREATE POLICY "nutrition_recipes_update" ON nutrition_recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_recipes_delete" ON nutrition_recipes;
  CREATE POLICY "nutrition_recipes_delete" ON nutrition_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "recipe_ingredients_select" ON recipe_ingredients;
  CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM nutrition_recipes WHERE nutrition_recipes.id = recipe_ingredients.recipe_id AND nutrition_recipes.user_id = auth.uid()));
  DROP POLICY IF EXISTS "recipe_ingredients_insert" ON recipe_ingredients;
  CREATE POLICY "recipe_ingredients_insert" ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM nutrition_recipes WHERE nutrition_recipes.id = recipe_ingredients.recipe_id AND nutrition_recipes.user_id = auth.uid()));
  DROP POLICY IF EXISTS "recipe_ingredients_update" ON recipe_ingredients;
  CREATE POLICY "recipe_ingredients_update" ON recipe_ingredients FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM nutrition_recipes WHERE nutrition_recipes.id = recipe_ingredients.recipe_id AND nutrition_recipes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM nutrition_recipes WHERE nutrition_recipes.id = recipe_ingredients.recipe_id AND nutrition_recipes.user_id = auth.uid()));
  DROP POLICY IF EXISTS "recipe_ingredients_delete" ON recipe_ingredients;
  CREATE POLICY "recipe_ingredients_delete" ON recipe_ingredients FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM nutrition_recipes WHERE nutrition_recipes.id = recipe_ingredients.recipe_id AND nutrition_recipes.user_id = auth.uid()));
END $$;
