"use client";

import { createManhole } from "@/lib/api";
import { ManholeForm } from "@/components/ManholeForm";

export default function NewManholePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-700 text-mist">Register manhole</h1>
      <ManholeForm
        submitLabel="Register manhole"
        onSubmit={(input) => createManhole(input).then(() => {})}
      />
    </div>
  );
}
