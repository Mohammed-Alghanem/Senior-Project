'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * City page redirects to dashboard so Al Qatif (and any city) goes straight to the dashboard.
 */
export default function CityDetail() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) {
      router.replace(`/dashboard${id ? `?location_id=${encodeURIComponent(id)}` : ''}`);
    } else {
      router.replace('/dashboard');
    }
  }, [router, params?.id]);

  return null;
}
