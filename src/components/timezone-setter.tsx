"use client";

import { useEffect } from "react";

/** Sets a cookie with the user's IANA timezone so the server can compute correct day boundaries. */
export function TimezoneSetter() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (document.cookie.includes(`tz=${tz}`)) return;
    document.cookie = `tz=${tz}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);
  return null;
}
