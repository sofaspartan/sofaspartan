-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a function to handle comment notifications
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple test that will definitely show in logs
    RAISE EXCEPTION 'TRIGGER TEST - This should show in logs for comment ID: %', NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to send notifications on new comments
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_comment_notification(); 