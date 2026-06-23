"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker enregistré :", registration);
        })
        .catch((error) => {
          console.log("Service Worker non supporté :", error);
        });
    }
  }, []);

  return null;
}
