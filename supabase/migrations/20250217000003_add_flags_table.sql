-- Create flag_type enum (optional but good practice)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_type_enum') THEN
        CREATE TYPE public.flag_type_enum AS ENUM ('inappropriate', 'spam');
    END IF;
END$$;

-- Create flags table
CREATE TABLE IF NOT EXISTS public.flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    flag_type public.flag_type_enum NOT NULL, -- Use the enum type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, comment_id) -- Prevent multiple flags per user per comment
);

-- Enable RLS
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Policies for flags table
CREATE POLICY "Authenticated users can insert their own flags" 
    ON public.flags FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own flags" 
    ON public.flags FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own flags" 
    ON public.flags FOR SELECT 
    USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS flags_comment_id_idx ON public.flags(comment_id);
CREATE INDEX IF NOT EXISTS flags_user_id_idx ON public.flags(user_id); 