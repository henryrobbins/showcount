import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSupabaseServerClient } from "~/utils/supabase.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { username } = params;
  const headers = new Headers();
  const supabase = getSupabaseServerClient(request, headers);

  // 1. Get the user's UUID from `profiles`
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_public")
    .eq("username", username)
    .single();

  if (!profile || profileError) {
    throw new Response("User not found", { status: 404 });
  }

  if (!profile.is_public) {
    throw new Response("User profile is private", { status: 403 });
  }

  // 2. Get shows the user attended
  const { data: userShows, error: userShowsError } = await supabase.rpc(
    "get_user_show_table",
    {
      uid: profile.id,
    }
  );

  if (userShowsError) {
    throw new Response("Could not load shows", { status: 500 });
  }

  return json({ username, shows: userShows }, { headers });
}

export default function UserShowList() {
  const { username, shows } = useLoaderData<typeof loader>();

  return (
    <div className="flex justify-center items-start min-h-screen p-8 bg-white text-black font-mono">
      <div className="w-full max-w-4xl">
        <h1 className="text-xl font-bold mb-4">@{username}</h1>
        <table className="border-collapse text-sm w-auto">
          <thead>
            <tr className="border-b border-black">
              <th className="px-2 pb-1 text-left">Date</th>
              <th className="px-2 pb-1 text-left">Venue</th>
              <th className="px-2 pb-1 text-left">Location</th>
              <th className="px-2 pb-1 text-left">Artists</th>
              <th className="px-2 pb-1 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {shows.map((entry: any) => {
              return (
                <tr
                  key={entry.show_id}
                  className="border-b border-gray-300 align-top"
                >
                  <td className="px-2 py-1 whitespace-nowrap">{entry.date}</td>
                  <td className="px-2 py-1">{entry.venue_name}</td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {entry.city}, {entry.state}
                  </td>
                  <td className="px-2 py-1">{entry.artist_name}</td>
                  <td className="px-2 py-1">{entry.notes ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
