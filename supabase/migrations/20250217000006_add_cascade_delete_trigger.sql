-- Create a function to handle cascading deletes when a user's profile is deleted
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all votes by this user
    DELETE FROM public.votes WHERE user_id = OLD.id;
    
    -- Delete all votes on comments by this user
    DELETE FROM public.votes 
    WHERE comment_id IN (
        SELECT id FROM public.comments WHERE user_id = OLD.id
    );
    
    -- Delete all flags by this user
    DELETE FROM public.flags WHERE user_id = OLD.id;
    
    -- Delete all flags on comments by this user
    DELETE FROM public.flags 
    WHERE comment_id IN (
        SELECT id FROM public.comments WHERE user_id = OLD.id
    );
    
    -- Delete all replies to this user's comments
    DELETE FROM public.comments 
    WHERE parent_id IN (
        SELECT id FROM public.comments WHERE user_id = OLD.id
    );
    
    -- Delete all replies by this user to other people's comments
    DELETE FROM public.comments 
    WHERE user_id = OLD.id AND parent_id IS NOT NULL;
    
    -- Delete all comments by this user
    DELETE FROM public.comments WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to execute the function before deleting a profile
DROP TRIGGER IF EXISTS on_profile_delete ON public.profiles;
CREATE TRIGGER on_profile_delete
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();

-- Add comment to explain the trigger
COMMENT ON TRIGGER on_profile_delete ON public.profiles IS 'Handles cascading deletion of all user-related data when a profile is deleted'; 