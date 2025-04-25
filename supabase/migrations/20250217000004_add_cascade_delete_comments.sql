-- Drop the existing foreign key constraint for parent_id
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_parent_id_fkey; -- Use the actual constraint name if different

-- Add the foreign key constraint back with ON DELETE CASCADE
ALTER TABLE public.comments
ADD CONSTRAINT comments_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES public.comments(id)
ON DELETE CASCADE; -- Add this cascade behavior 