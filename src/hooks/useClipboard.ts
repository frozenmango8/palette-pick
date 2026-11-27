import { useCallback, useEffect, useRef, useState } from 'react';

function copyWithTextarea(text: string) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Copy failed.');
}

export function useClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else copyWithTextarea(text);
      setNotice(`Copied ${text}`);
    } catch {
      try {
        copyWithTextarea(text);
        setNotice(`Copied ${text}`);
      } catch {
        setNotice('Could not copy to the clipboard.');
      }
    }
    setCopiedKey(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopiedKey(null);
      setNotice('');
    }, 1800);
  }, []);

  return { copiedKey, notice, copy };
}
