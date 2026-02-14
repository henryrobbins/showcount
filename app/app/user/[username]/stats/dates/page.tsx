import { clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import StatsTable from "@/components/StatsTable";
import { createClient } from "@/lib/supabase/server";

interface DateStatsPageProps {
  params: Promise<{ username: string }>;
}

async function DateStatsPage({ params }: DateStatsPageProps) {
  const { username } = await params;

  // Fetch user by username from Clerk
  const client = await clerkClient();
  const users = await client.users.getUserList({ username: [username] });

  if (users.data.length === 0) {
    notFound();
  }

  const user = users.data[0];

  // Fetch user_shows with joined central_shows
  const supabase = await createClient();
  const { data: userShows } = await supabase
    .from("user_shows")
    .select("show_ids")
    .eq("clerk_user_id", user.id);

  if (!userShows || userShows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Date Statistics</h1>
        <StatsTable title="Years" headers={["Year", "Shows"]} rows={[]} />
        <StatsTable title="Months" headers={["Month", "Shows"]} rows={[]} />
        <StatsTable title="Days of Week" headers={["Day", "Shows"]} rows={[]} />
      </div>
    );
  }

  // Collect all show_ids
  const allShowIds = userShows.flatMap((us: any) => us.show_ids || []);

  if (allShowIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono mb-6">Date Statistics</h1>
        <StatsTable title="Years" headers={["Year", "Shows"]} rows={[]} />
        <StatsTable title="Months" headers={["Month", "Shows"]} rows={[]} />
        <StatsTable title="Days of Week" headers={["Day", "Shows"]} rows={[]} />
      </div>
    );
  }

  // Fetch all central shows with dates in batches to avoid URI too long errors
  const BATCH_SIZE = 100;
  const allCentralShows: Array<{ date: string }> = [];
  
  for (let i = 0; i < allShowIds.length; i += BATCH_SIZE) {
    const batch = allShowIds.slice(i, i + BATCH_SIZE);
    const { data: centralShows } = await supabase
      .from("central_shows")
      .select("date")
      .in("id", batch);
    
    if (centralShows) {
      allCentralShows.push(...centralShows);
    }
  }

  // Count by year, month, and day of week
  const yearCounts = new Map<string, number>();
  const monthCounts = new Map<number, number>();
  const dayOfWeekCounts = new Map<number, number>();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (const show of allCentralShows) {
    if (!show.date) continue;

    const date = new Date(show.date);
    const year = date.getFullYear().toString();
    const month = date.getMonth(); // 0-11
    const dayOfWeek = date.getDay(); // 0-6

    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
  }

  // Convert to sorted arrays
  const sortedYears = Array.from(yearCounts.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort by year descending
    .map(([year, count]) => [year, count]);

  // Months in calendar order
  const sortedMonths = Array.from({ length: 12 }, (_, i) => i)
    .filter((month) => monthCounts.has(month))
    .map((month) => [monthNames[month], monthCounts.get(month)!]);

  // Days of week in calendar order (Sunday first)
  const sortedDays = Array.from({ length: 7 }, (_, i) => i)
    .filter((day) => dayOfWeekCounts.has(day))
    .map((day) => [dayNames[day], dayOfWeekCounts.get(day)!]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono mb-6">Date Statistics</h1>
      <StatsTable
        title="Years"
        headers={["Year", "Shows"]}
        rows={sortedYears}
      />
      <StatsTable
        title="Months"
        headers={["Month", "Shows"]}
        rows={sortedMonths}
      />
      <StatsTable
        title="Days of Week"
        headers={["Day", "Shows"]}
        rows={sortedDays}
      />
    </div>
  );
}

export default DateStatsPage;
