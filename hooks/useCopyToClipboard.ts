import { useState, useCallback } from 'react';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  }, []);

  return { copied, copy };
}
