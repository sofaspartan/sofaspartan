-- Create track_reactions table
CREATE TABLE IF NOT EXISTS public.track_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL,
    reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'surprise', 'sad', 'mad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE public.track_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for track_reactions
CREATE POLICY "Users can view all track reactions"
    ON public.track_reactions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert track reactions"
    ON public.track_reactions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own track reactions"
    ON public.track_reactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own track reactions"
    ON public.track_reactions FOR DELETE
    USING (auth.uid() = user_id); 