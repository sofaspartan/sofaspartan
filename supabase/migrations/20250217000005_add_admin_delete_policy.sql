-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Create new delete policy that allows both owners and admins to delete comments
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

-- Add comment to explain the policy
COMMENT ON POLICY "Users can delete their own comments or admins can delete any" ON comments IS 'Allows users to delete their own comments and admins to delete any comment'; 