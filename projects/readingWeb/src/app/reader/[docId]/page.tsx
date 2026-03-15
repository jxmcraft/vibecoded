"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useReader } from "@/context/ReaderContext";

export default function ReaderDocumentPage() {
  const params = useParams<{ docId: string }>();
  const router = useRouter();
  const { loadDocumentById, stopTts } = useReader();

  const docId = useMemo(() => {
    const value = params?.docId;
    return typeof value === "string" ? decodeURIComponent(value) : "";
  }, [params?.docId]);

  useEffect(() => {
    if (!docId) {
      router.replace("/library");
      return;
    }

    void loadDocumentById(docId).then((loaded) => {
      if (!loaded) {
        router.replace("/library");
      }
    });

    return () => {
      stopTts();
    };
  }, [docId, loadDocumentById, router, stopTts]);

  return <AppShell />;
}
