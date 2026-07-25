"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getManhole, updateManhole, deleteManhole, Manhole } from "@/lib/api";
import { ManholeForm } from "@/components/ManholeForm";

export default function EditManholePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [manhole, setManhole] = useState<Manhole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManhole(id)
      .then(setManhole)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this manhole? This can't be undone.")) return;
    await deleteManhole(id);
    router.push("/manholes");
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg border border-ink-700 bg-ink-900/40" />;
  }

  if (!manhole) {
    return <p className="text-haze">Manhole not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-700 text-mist">{manhole.code}</h1>
        <p className="font-mono text-xs text-haze">{manhole.id}</p>
      </div>
      <ManholeForm
        initial={manhole}
        submitLabel="Save changes"
        onSubmit={(input) => updateManhole(id, input).then(() => {})}
        onDelete={handleDelete}
      />
    </div>
  );
}
