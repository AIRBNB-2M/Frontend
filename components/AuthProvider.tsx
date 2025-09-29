"use client";

import { useEffect, useState } from "react";
import { initializeAuth } from "@/lib/authInitializer";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth().finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
