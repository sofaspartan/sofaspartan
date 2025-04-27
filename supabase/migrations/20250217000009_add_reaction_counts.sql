-- Add new reaction count columns to comments table
ALTER TABLE public.comments
  ADD COLUMN love_count INTEGER DEFAULT 0,
  ADD COLUMN laugh_count INTEGER DEFAULT 0,
  ADD COLUMN surprise_count INTEGER DEFAULT 0,
  ADD COLUMN sad_count INTEGER DEFAULT 0,
  ADD COLUMN mad_count INTEGER DEFAULT 0;

-- Update vote_type check constraint in votes table
ALTER TABLE public.votes
  DROP CONSTRAINT votes_vote_type_check,
  ADD CONSTRAINT votes_vote_type_check 
  CHECK (vote_type IN ('like', 'dislike', 'love', 'laugh', 'surprise', 'sad', 'mad')); 