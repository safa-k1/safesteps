"use client";

import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./mapInner"), { ssr: false });

export default function Map() {
  return <MapInner />;
}