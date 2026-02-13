import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { validateRatingSystemConfig } from '@/lib/rating-validation';
import type { RatingSystemType } from '@/types/rating';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validate rating system configuration if ratings are enabled
  if (body.ratings_enabled) {
    if (!body.rating_system_type || !body.rating_system_config) {
      return NextResponse.json(
        { error: 'Rating system type and configuration are required when ratings are enabled' },
        { status: 400 }
      );
    }

    // Validate the rating system config structure
    const configToValidate = body.rating_system_config.config || body.rating_system_config;
    if (!validateRatingSystemConfig(body.rating_system_type as RatingSystemType, configToValidate)) {
      return NextResponse.json(
        { error: 'Invalid rating system configuration' },
        { status: 400 }
      );
    }

    // Ensure the rating_system_config is in the correct format
    if (!body.rating_system_config.type) {
      body.rating_system_config = {
        type: body.rating_system_type,
        config: body.rating_system_config,
      };
    }
  }

  const supabase = await createClient();

  // Upsert (insert or update)
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        clerk_user_id: userId,
        ...body,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json(data);
}
