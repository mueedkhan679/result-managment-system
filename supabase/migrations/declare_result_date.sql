-- Migration: Auto result declaration date (declared_at)
-- Run this in Supabase SQL Editor

-- 1) Add column
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS declared_at timestamp with time zone;

-- 2) Drop existing functions so we can change their return types
DROP FUNCTION IF EXISTS public.admin_approve_results_bulk(jsonb);
DROP FUNCTION IF EXISTS public.admin_approve_result(uuid);
DROP FUNCTION IF EXISTS public.admin_list_results(text);
DROP FUNCTION IF EXISTS public.portal_get_results(uuid);

-- 3) Recreate functions with declared_at support

CREATE FUNCTION public.admin_approve_results_bulk(ids jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE rid uuid; BEGIN FOR rid IN SELECT jsonb_array_elements_text(ids)::uuid LOOP UPDATE public.results SET status = 'published', declared_at = timezone('utc', now()) WHERE id = rid; END LOOP; END; $$;
GRANT EXECUTE ON FUNCTION public.admin_approve_results_bulk(jsonb) TO anon, authenticated;

CREATE FUNCTION public.admin_approve_result(result_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE public.results SET status = 'published', declared_at = timezone('utc', now()) WHERE id = result_id $$;
GRANT EXECUTE ON FUNCTION public.admin_approve_result(uuid) TO anon, authenticated;

CREATE FUNCTION public.admin_list_results(status text) RETURNS TABLE(id uuid, student_id uuid, student_name text, roll_no int, class text, subject_id uuid, subject_name text, total_marks int, obtained_marks int, declared_at timestamp with time zone) LANGUAGE sql SECURITY DEFINER AS $$ SELECT r.id, r.student_id, s.student_name, s.roll_no, r.class, r.subject_id, subj.subject_name, r.total_marks, r.obtained_marks, r.declared_at FROM public.results r JOIN public.students s ON s.id = r.student_id JOIN public.subjects subj ON subj.id = r.subject_id WHERE r.status = lower(status) OR r.status = status ORDER BY r.created_at DESC $$;
GRANT EXECUTE ON FUNCTION public.admin_list_results(text) TO anon, authenticated;

CREATE FUNCTION public.portal_get_results(p_student_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE s record; res record; arr jsonb := '[]'::jsonb; BEGIN SELECT * INTO s FROM public.students WHERE id = p_student_id; IF NOT FOUND THEN RETURN NULL; END IF; FOR res IN SELECT r.*, subj.subject_name, CASE WHEN r.total_marks = 0 THEN 'F' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 90 THEN 'A+' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 80 THEN 'A' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 70 THEN 'B' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 60 THEN 'C' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 50 THEN 'D' WHEN (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 40 THEN 'E' ELSE 'F' END AS grade FROM public.results r JOIN public.subjects subj ON subj.id = r.subject_id WHERE r.student_id = p_student_id AND r.status = 'published' LOOP arr := arr || jsonb_build_object('id', res.id, 'subject_name', res.subject_name, 'total_marks', res.total_marks, 'obtained_marks', res.obtained_marks, 'grade', res.grade, 'declared_at', res.declared_at); END LOOP; RETURN jsonb_build_object('student', to_jsonb(s), 'results', arr); END; $$;
GRANT EXECUTE ON FUNCTION public.portal_get_results(uuid) TO anon, authenticated;
