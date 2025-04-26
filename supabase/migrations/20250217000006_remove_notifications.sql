-- Drop the notification trigger
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;

-- Drop the notification function
DROP FUNCTION IF EXISTS public.handle_comment_notification(); 