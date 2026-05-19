import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ec-spr-mnp-simulator",
    short_name: "EC-SPR MNP",
    description:
      "Simulador PWA para estudos MP-SPR e EC-SPR de microplasticos e nanoplasticos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0e7490",
  };
}
