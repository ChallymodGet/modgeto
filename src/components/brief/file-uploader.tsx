"use client";

/**
 * File uploads for the Brief (docs/06 §35, D-018). UI only: the parent passes
 * an `upload` function (R2 arrives in Phase 10). Each file shows its name,
 * progress, success or failure; failures can be retried, and any file can be
 * removed. A failed upload never clears other answers.
 */
import { CircleAlert, CircleCheck, FileText, RotateCw, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { MAX_FILES_PER_QUESTION, MAX_FILE_BYTES, validateFile } from "@/lib/domain";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

export type UploadedFile = { assetId: string; name: string; sizeBytes: number };

type Item =
  | { key: string; file: File; status: "uploading"; progress: number }
  | { key: string; file: File; status: "failed"; message: string; retryable: boolean }
  | { key: string; file: File | null; status: "done"; uploaded: UploadedFile };

export type UploadFn = (file: File, onProgress: (percent: number) => void) => Promise<UploadedFile>;

type FileUploaderProps = {
  /** Id of the field's label, so the drop zone button is named by the question. */
  labelledBy?: string;
  describedBy?: string;
  multiple?: boolean;
  /** Files already uploaded, e.g. when returning to the Brief. */
  initialFiles?: UploadedFile[];
  upload: UploadFn;
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  invalid?: boolean;
};

const PROBLEM_MESSAGES = {
  TOO_LARGE: `is larger than ${formatFileSize(MAX_FILE_BYTES)}. Choose a smaller file.`,
  EMPTY: "is empty. Choose another file.",
  TYPE_NOT_ALLOWED: "isn't a supported file type. Use an image, PDF or Office document.",
} as const;

export function FileUploader({
  labelledBy,
  describedBy,
  multiple = false,
  initialFiles = [],
  upload,
  onChange,
  accept,
  invalid,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const [items, setItems] = useState<Item[]>(() =>
    initialFiles.map((f) => ({ key: f.assetId, file: null, status: "done" as const, uploaded: f })),
  );
  const [announcement, setAnnouncement] = useState("");
  const limit = multiple ? MAX_FILES_PER_QUESTION : 1;

  // Report finished uploads after render, never from inside a state update.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const doneFiles = items.flatMap((i) => (i.status === "done" ? [i.uploaded] : []));
  const doneKey = doneFiles.map((f) => f.assetId).join(",");
  const reported = useRef(doneKey);
  useEffect(() => {
    if (reported.current === doneKey) return;
    reported.current = doneKey;
    onChangeRef.current(doneFiles);
    // doneFiles is derived from doneKey's items; doneKey is the change signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey]);

  // After removing a file, return focus to the visible "Choose" button.
  const chooseRef = useRef<HTMLButtonElement>(null);
  const [refocusTick, setRefocusTick] = useState(0);
  useEffect(() => {
    if (refocusTick > 0) chooseRef.current?.focus();
  }, [refocusTick]);

  const start = useCallback(
    (key: string, file: File) => {
      setItems((prev) =>
        prev.map((i) => (i.key === key ? { key, file, status: "uploading", progress: 0 } : i)),
      );
      upload(file, (progress) =>
        setItems((prev) =>
          prev.map((i) => (i.key === key && i.status === "uploading" ? { ...i, progress } : i)),
        ),
      ).then(
        (uploaded) => {
          setItems((prev) =>
            prev.map((i) =>
              i.key === key ? ({ key, file, status: "done", uploaded } as Item) : i,
            ),
          );
          setAnnouncement(`${file.name} uploaded.`);
        },
        () => {
          setItems((prev) =>
            prev.map((i) =>
              i.key === key
                ? {
                    key,
                    file,
                    status: "failed",
                    message: "didn't upload. Check your connection and try again.",
                    retryable: true,
                  }
                : i,
            ),
          );
          setAnnouncement(`${file.name} didn't upload.`);
        },
      );
    },
    [upload],
  );

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = limit - items.length;
    const chosen = Array.from(files).slice(0, Math.max(room, 0));
    const added: Item[] = chosen.map((file) => {
      const key = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const problem = validateFile(
        { mimeType: file.type || "application/octet-stream", sizeBytes: file.size },
        "PRIVATE",
      );
      return problem
        ? { key, file, status: "failed", message: PROBLEM_MESSAGES[problem], retryable: false }
        : { key, file, status: "uploading", progress: 0 };
    });
    const base = multiple ? items : [];
    setItems([...base, ...added]);
    for (const item of added) if (item.status === "uploading") start(item.key, item.file);
    if (files.length > chosen.length) {
      setAnnouncement(`You can add up to ${limit} files. Some files weren't added.`);
    }
  };

  const remove = (key: string) => {
    const item = items.find((i) => i.key === key);
    setItems(items.filter((i) => i.key !== key));
    const name = item?.status === "done" ? item.uploaded.name : item?.file?.name;
    setAnnouncement(`${name ?? "File"} removed.`);
    setRefocusTick((t) => t + 1);
  };

  const [dragging, setDragging] = useState(false);
  const canAdd = items.length < limit;

  return (
    <div className="flex flex-col gap-3">
      {canAdd && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:text-left",
            dragging ? "border-primary bg-primary-subtle" : "border-border-control bg-surface",
            invalid && "border-danger",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-text"
          >
            <Upload className="size-5" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            {/* Drag-and-drop is an extra: the button always works (CLAUDE.md §8). */}
            <span className="text-body-sm text-foreground">
              <span className="hidden sm:inline">Drag files here or </span>choose{" "}
              {multiple ? "files" : "a file"}
            </span>
            <span className="text-caption text-foreground-muted">
              Images, PDF or Office documents up to {formatFileSize(MAX_FILE_BYTES)}
              {multiple ? `, ${limit} files at most` : ""}.
            </span>
          </span>
          <Button
            ref={chooseRef}
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            aria-labelledby={labelledBy ? `${labelledBy} ${statusId}-choose` : undefined}
            aria-describedby={describedBy}
          >
            <span id={`${statusId}-choose`}>Choose {multiple ? "files" : "file"}</span>
          </Button>
          <input
            ref={inputRef}
            type="file"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            multiple={multiple}
            accept={accept}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const name = item.status === "done" ? item.uploaded.name : item.file!.name;
            const size = item.status === "done" ? item.uploaded.sizeBytes : item.file!.size;
            return (
              <li
                key={item.key}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3",
                  item.status === "failed"
                    ? "border-danger-border bg-danger-subtle"
                    : "border-border bg-surface",
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-subtle"
                >
                  {item.status === "uploading" ? (
                    <Spinner className="text-foreground-muted" />
                  ) : item.status === "failed" ? (
                    <CircleAlert className="size-4 text-danger" />
                  ) : (
                    <FileText className="size-4 text-foreground-muted" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-body-sm font-medium text-foreground">{name}</span>
                  {item.status === "uploading" && (
                    <span className="flex items-center gap-2">
                      <span
                        role="progressbar"
                        aria-label={`Uploading ${name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-subtle"
                      >
                        <span
                          className="block h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </span>
                      <span className="text-caption text-foreground-muted tabular-nums">
                        {item.progress}%
                      </span>
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="text-caption text-danger-text">
                      {name} {item.message}
                    </span>
                  )}
                  {item.status === "done" && (
                    <span className="flex items-center gap-1 text-caption text-foreground-muted">
                      <CircleCheck aria-hidden="true" className="size-3.5 text-success" />
                      Uploaded · {formatFileSize(size)}
                    </span>
                  )}
                </span>
                {item.status === "failed" && item.retryable && (
                  <IconButton
                    size="sm"
                    variant="secondary"
                    label={`Retry uploading ${name}`}
                    icon={<RotateCw />}
                    onClick={() => start(item.key, item.file)}
                  />
                )}
                <IconButton
                  size="sm"
                  label={`Remove ${name}`}
                  icon={<X />}
                  onClick={() => remove(item.key)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
