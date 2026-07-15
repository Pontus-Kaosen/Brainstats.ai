"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type BetSlipImageUploadProps = {
  disabled?: boolean;
  isLoggedIn?: boolean | null;
  onParsed: (result: {
    text: string;
    warning: string | null;
    previewUrl: string;
  }) => void;
  onError: (message: string) => void;
  onParsingChange?: (parsing: boolean) => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

function isAcceptedImage(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return ACCEPTED_EXTENSIONS.test(file.name);
}

export default function BetSlipImageUpload({
  disabled = false,
  isLoggedIn = null,
  onParsed,
  onError,
  onParsingChange,
}: BetSlipImageUploadProps) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function updateParsing(next: boolean) {
    setParsing(next);
    onParsingChange?.(next);
  }

  async function processFile(file: File) {
    setLocalError("");
    setSuccessMessage("");

    if (!isAcceptedImage(file)) {
      const message = t.analyze.imageInvalidType;
      setLocalError(message);
      onError(message);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      const message = t.analyze.imageTooLarge;
      setLocalError(message);
      onError(message);
      return;
    }

    if (isLoggedIn === false) {
      const message = t.analyze.loginRequiredDescription;
      setLocalError(message);
      onError(message);
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("read_failed"));
      };

      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(file);
    });

    setPreviewUrl(dataUrl);
    updateParsing(true);
    onError("");

    try {
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const message = t.analyze.loginRequiredDescription;
        setLocalError(message);
        onError(message);
        return;
      }

      const response = await fetch("/api/analyze/parse-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: dataUrl,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.text) {
        throw new Error(data.error || t.analyze.imageParseFailed);
      }

      setSuccessMessage(t.analyze.imageParsedHint);
      onParsed({
        text: data.text,
        warning: data.warning || null,
        previewUrl: dataUrl,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t.analyze.imageParseFailed;
      setLocalError(message);
      onError(message);
    } finally {
      updateParsing(false);
    }
  }

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];

    if (!file || disabled || parsing) {
      return;
    }

    void processFile(file);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-2xl border border-dashed px-5 py-8 text-center transition ${
          dragOver
            ? "border-[#18ff6d] bg-[#18ff6d]/10"
            : "border-[#18ff6d33] bg-black/30"
        }`}
      >
        <span className="text-4xl">📸</span>
        <p className="mt-4 text-lg font-bold text-white">
          {parsing ? t.analyze.imageParsing : t.analyze.imageUploadTitle}
        </p>
        <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-[#A9A9A9]">
          {t.analyze.imageUploadHint}
        </p>
        <p className="mt-2 text-xs text-[#777]">{t.analyze.imageHeicHint}</p>

        <button
          type="button"
          disabled={disabled || parsing}
          onClick={() => inputRef.current?.click()}
          className={`mt-5 rounded-full border border-[#18ff6d44] bg-[#18ff6d]/10 px-5 py-2.5 text-sm font-semibold text-[#18ff6d] transition hover:bg-[#18ff6d]/20 ${
            disabled || parsing ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {parsing ? t.analyze.imageParsing : t.analyze.imageUploadButton}
        </button>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <img
            src={previewUrl}
            alt={t.analyze.imagePreviewAlt}
            className="max-h-72 w-full object-contain"
          />
        </div>
      ) : null}

      {localError ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {localError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[#18ff6d33] bg-[#18ff6d]/10 p-4 text-sm text-[#18ff6d]">
          {successMessage}
        </div>
      ) : null}
    </div>
  );
}
