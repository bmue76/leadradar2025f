// web/app/(admin)/admin/leads/LeadFormFilter.tsx
'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormDto } from '@/lib/api-types';

type LeadFormFilterProps = {
  forms: FormDto[];
  currentFormId?: number;
};

export function LeadFormFilter({ forms, currentFormId }: LeadFormFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('formId', value);
    } else {
      params.delete('formId');
    }

    const query = params.toString();
    const url = query ? `/admin/leads?${query}` : '/admin/leads';

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="form-filter" className="text-slate-600">
        Formular:
      </label>
      <select
        id="form-filter"
        name="formId"
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        onChange={handleChange}
        defaultValue={currentFormId ? String(currentFormId) : ''}
        disabled={isPending || forms.length === 0}
      >
        <option value="">Alle Formulare</option>
        {forms.map((form) => (
          <option key={form.id} value={String(form.id)}>
            {form.name}
          </option>
        ))}
      </select>
    </div>
  );
}
