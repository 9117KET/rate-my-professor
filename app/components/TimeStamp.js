"use client";

import { formatTimestamp } from "../utils/formatters";

export default function TimeStamp() {
  return <div suppressHydrationWarning>{formatTimestamp(new Date())}</div>;
}
