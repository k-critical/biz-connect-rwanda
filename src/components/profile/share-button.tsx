"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The person closed the share sheet; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={share}>
        {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
        {copied ? "Link copied" : "Share"}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </>
  );
}
