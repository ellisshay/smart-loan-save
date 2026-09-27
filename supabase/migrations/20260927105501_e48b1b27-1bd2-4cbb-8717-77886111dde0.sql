REVOKE EXECUTE ON FUNCTION public.audit_case_status() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_roles() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_documents() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_privacy_viewer() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_privacy_viewer() TO authenticated;