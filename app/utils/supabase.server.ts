import { createServerClient } from "@supabase/auth-helpers-remix";

export const getSupabaseServerClient = (
  request: Request,
  responseHeaders: Headers
) =>
  createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { request, response: new Response(null, { headers: responseHeaders }) }
  );
