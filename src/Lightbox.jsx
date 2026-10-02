import { useEffect, useState } from "react";
import { imageUrl } from "./api.js";

export default function Lightbox({ images, start, onClose }) {
  const [index, setIndex] = useState(start);
  const many = images.length > 1;
  const go = (step) => setIndex((i) => (i + step + images.length) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowRight") go(1);
      if (many && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [many, onClose]);

  return (
    <div className="lightbox" onClick={onClose}>
      <img src={imageUrl(images[index])} alt="" onClick={(e) => e.stopPropagation()} />
      {many && (
        <>
          <button className="lb-nav prev" onClick={(e) => (e.stopPropagation(), go(-1))} title="Previous">‹</button>
          <button className="lb-nav next" onClick={(e) => (e.stopPropagation(), go(1))} title="Next">›</button>
          <div className="lb-count">{index + 1} / {images.length}</div>
        </>
      )}
      <button className="lb-close" onClick={onClose} title="Close (Esc)">✕</button>
    </div>
  );
}
