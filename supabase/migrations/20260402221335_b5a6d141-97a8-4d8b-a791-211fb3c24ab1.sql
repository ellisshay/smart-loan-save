
-- Add explicit INSERT policy to prevent non-admins from inserting roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
