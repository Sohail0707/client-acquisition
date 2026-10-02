import { useLayoutEffect, useRef, useState } from "react";
import { api, imageUrl } from "./api.js";
import { compressImage, imageFiles } from "./images.js";

export default function Remarks({ text, images = [], onText, onAddImages, onRemoveImage, onOpen, onError }) {
  const ref = useRef(null);
  const [pending, setPending] = useState([]);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const t = ref.current;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [text]);

  async function upload(files) {
    const items = files.map((f) => ({ key: crypto.randomUUID(), url: URL.createObjectURL(f), file: f }));
    setPending((p) => [...p, ...items]);
    const results = await Promise.allSettled(items.map(async (i) => api.uploadImage(await compressImage(i.file))));
    const ids = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    if (ids.length) onAddImages(ids);
    const failed = results.find((r) => r.status === "rejected");
    if (failed) onError(failed.reason);
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setPending((p) => p.filter((x) => !items.includes(x)));
  }

  function onPaste(e) {
    const files = imageFiles(e.clipboardData.files);
    // Spreadsheet/Word copies carry text plus an image preview; keep those as text.
    if (!files.length || e.clipboardData.getData("text/plain")) return;
    e.preventDefault();
    upload(files);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = imageFiles(e.dataTransfer.files);
    if (files.length) upload(files);
  }

  const hasFiles = (e) => [...e.dataTransfer.types].includes("Files");

  return (
    <div
      className={`remarks-box${dragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDragging(false)}
      onDrop={onDrop}
    >
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder="Notes, their problem… paste or drop screenshots"
        onChange={(e) => onText(e.target.value)}
        onPaste={onPaste}
      />
      {(images.length > 0 || pending.length > 0) && (
        <div className="thumbs">
          {images.map((id, i) => (
            <div className="thumb" key={id}>
              <img src={imageUrl(id)} alt="" loading="lazy" onClick={() => onOpen(images, i)} />
              <button className="thumb-del" title="Remove screenshot" onClick={() => confirm("Remove this screenshot?") && onRemoveImage(id)}>✕</button>
            </div>
          ))}
          {pending.map((p) => (
            <div className="thumb uploading" key={p.key}>
              <img src={p.url} alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
