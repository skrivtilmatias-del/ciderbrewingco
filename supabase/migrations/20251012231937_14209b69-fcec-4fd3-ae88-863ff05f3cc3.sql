-- Enable public read access for blend batches
CREATE POLICY "Allow public read access to blend batches"
ON public.blend_batches
FOR SELECT
USING (true);

-- Enable public read access for blend components
CREATE POLICY "Allow public read access to blend components"
ON public.blend_components
FOR SELECT
USING (true);

-- Enable public read access to tasting analysis
CREATE POLICY "Allow public read access to tasting analysis"
ON public.tasting_analysis
FOR SELECT
USING (true);

-- Enable public read access to profiles (for taster names)
CREATE POLICY "Allow public read access to profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Enable public read access to batches (for component batch details)
CREATE POLICY "Allow public read access to batches"
ON public.batches
FOR SELECT
USING (true);