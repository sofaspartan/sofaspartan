-- Create a function to handle comment deletion with proper cascading
CREATE OR REPLACE FUNCTION public.delete_comment(comment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete all votes on this comment
    DELETE FROM public.votes WHERE comment_id = delete_comment.comment_id;
    
    -- Delete all flags on this comment
    DELETE FROM public.flags WHERE comment_id = delete_comment.comment_id;
    
    -- Get all replies to this comment
    WITH replies AS (
        SELECT id FROM public.comments WHERE parent_id = delete_comment.comment_id
    )
    -- Delete all votes on replies
    DELETE FROM public.votes 
    WHERE comment_id IN (SELECT id FROM replies);
    
    -- Delete all flags on replies
    DELETE FROM public.flags 
    WHERE comment_id IN (SELECT id FROM replies);
    
    -- Delete all replies
    DELETE FROM public.comments 
    WHERE parent_id = delete_comment.comment_id;
    
    -- Finally delete the comment
    DELETE FROM public.comments 
    WHERE id = delete_comment.comment_id;
END;
$$;

-- Create a policy to allow users to call this function
CREATE POLICY "Users can delete their own comments or admins can delete any"
ON comments
FOR DELETE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_metadata->>'user_type' = 'admin'
    )
); 