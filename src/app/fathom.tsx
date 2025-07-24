'use client';

import React, { Suspense } from 'react';
import { load, trackPageview } from 'fathom-client';
import { usePathname, useSearchParams } from 'next/navigation';

function Track() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    load('VTWNRJJD', { includedDomains: ['localhost', 'capa.ped.ro'] });
    trackPageview();
  }, [pathname, searchParams]);

  return null;
}

export default function Fathom() {
  return (
    <Suspense fallback={null}>
      <Track />
    </Suspense>
  );
}
