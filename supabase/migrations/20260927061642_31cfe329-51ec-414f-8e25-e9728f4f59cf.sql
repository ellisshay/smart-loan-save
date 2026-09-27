CREATE POLICY "Admins can update case docs" ON public.case_documents FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT UPDATE ON public.case_documents TO authenticated;
CREATE POLICY "Admins can read all case files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'case-documents' AND public.is_admin());