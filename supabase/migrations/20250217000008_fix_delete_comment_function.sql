-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.delete_comment(UUID);

-- Create the function with proper permissions
CREATE OR REPLACE FUNCTION public.delete_comment(comment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reply_ids UUID[];
BEGIN
    -- Get all replies to this comment
    SELECT array_agg(id) INTO reply_ids
    FROM public.comments 
    WHERE parent_id = delete_comment.comment_id;
    
    -- Delete all votes on this comment
    DELETE FROM public.votes WHERE votes.comment_id = delete_comment.comment_id;
    
    -- Delete all flags on this comment
    DELETE FROM public.flags WHERE flags.comment_id = delete_comment.comment_id;
    
    -- Delete all votes on replies
    IF reply_ids IS NOT NULL THEN
        DELETE FROM public.votes 
        WHERE votes.comment_id = ANY(reply_ids);
        
        -- Delete all flags on replies
        DELETE FROM public.flags 
        WHERE flags.comment_id = ANY(reply_ids);
        
        -- Delete all replies
        DELETE FROM public.comments 
        WHERE comments.id = ANY(reply_ids);
    END IF;
    
    -- Finally delete the comment
    DELETE FROM public.comments 
    WHERE comments.id = delete_comment.comment_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_comment(UUID) TO authenticated;

-- Add comment to explain the function
COMMENT ON FUNCTION public.delete_comment(UUID) IS 'Deletes a comment and all its related data (votes, flags, replies)'; 