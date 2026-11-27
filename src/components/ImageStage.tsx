import { useEffect, useRef, useState } from 'react';
import type { ImageSample } from '../lib/readImage';

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif,image/bmp';

interface ImageStageProps {
  image: ImageSample | null;
  reading: boolean;
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
  onClear: () => void;
}

export function ImageStage({ image, reading, error, onFile, onSample, onClear }: ImageStageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function guard(event: DragEvent) {
      const items = event.dataTransfer?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file') {
          event.preventDefault();
          return;
        }
      }
    }
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', guard);
    return () => {
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', guard);
    };
  }, []);

  function takeFiles(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const file = Array.from(files).find((candidate) => candidate.type.startsWith('image/'));
    if (file) onFile(file);
    else if (files.length > 0) onFile(files[0]);
  }

  return (
    <section
      className={dragging ? 'stage is-dragging' : 'stage'}
      aria-labelledby="image-heading"
      onDragEnter={(event) => {
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        takeFiles(event.dataTransfer.files);
      }}
    >
      <div className="section-label">
        <h2 id="image-heading">Image</h2>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        onChange={(event) => {
          takeFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {image ? (
        <figure className="preview">
          <div className={image.hasTransparency ? 'preview-frame is-transparent' : 'preview-frame'}>
            <img src={image.previewUrl} alt={`Uploaded image, ${image.fileName}`} />
          </div>
          <figcaption>
            <span>{image.fileName}</span>
            <span>
              {image.naturalWidth.toLocaleString('en-US')}×{image.naturalHeight.toLocaleString('en-US')}
            </span>
          </figcaption>
        </figure>
      ) : (
        <div className="drop">
          <p className="drop-title">{dragging ? 'Drop to extract' : 'Drop an image here'}</p>
          <p id="stage-hint" className="drop-copy">
            Or paste from the clipboard. PNG, JPEG, GIF, WebP, and SVG stay on this device.
          </p>
        </div>
      )}
      <div className="stage-actions">
        <button type="button" className="button button-primary" onClick={() => inputRef.current?.click()}>
          {image ? 'Replace image' : 'Browse files'}
        </button>
        <button type="button" className="button" onClick={onSample} disabled={reading}>
          Try a sample
        </button>
        {image ? (
          <button type="button" className="button" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      {reading ? <p className="stage-note">Reading pixels…</p> : null}
      {error ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
