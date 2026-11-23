"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { categories, type Title } from "../domain/title";
import { saveTitleAction } from "../server/actions";
import { initialActionState } from "@/shared/lib/action-state";
import { FormFeedback, FormField } from "@/shared/ui/form-field";

export function TitleEditor({
  title,
  cancelHref,
  onCancel,
}: {
  title?: Title;
  cancelHref?: string;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveTitleAction,
    initialActionState,
  );
  const [values, setValues] = useState<Record<string, string>>({
    name: title?.name ?? "",
    originalTitle: title?.originalTitle ?? "",
    category: title?.category ?? "film",
    releaseYear: String(title?.releaseYear ?? ""),
    genres: title?.genres.join(", ") ?? "",
    country: title?.country ?? "",
    language: title?.language ?? "",
    runtimeMinutes: String(title?.runtimeMinutes ?? ""),
    totalEpisodes: String(title?.totalEpisodes ?? ""),
    coverUrl: title?.coverUrl ?? "",
    backdropUrl: title?.backdropUrl ?? "",
    synopsis: title?.synopsis ?? "",
    viewingCount: String(title?.viewingCount ?? 0),
  });
  const common = (name: string) => ({
    id: name,
    name,
    value: values[name] ?? "",
    onChange: (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": Boolean(state.fields?.[name]),
    "aria-describedby": state.fields?.[name] ? `${name}-error` : undefined,
  });
  return (
    <form action={action} className="editorForm">
      {title && <input type="hidden" name="id" value={title.id} />}
      <div className="formGrid">
        <FormField name="name" label="ชื่อเรื่อง *" state={state}>
          <input
            {...common("name")}
            required
            maxLength={200}
            placeholder="ชื่อเรื่องที่อยากเก็บไว้"
          />
        </FormField>
        <FormField name="originalTitle" label="ชื่อดั้งเดิม / ชื่ออื่น" state={state}>
          <input {...common("originalTitle")} maxLength={200} />
        </FormField>
        <FormField name="category" label="หมวดสำหรับจัดอันดับ" state={state}>
          <select {...common("category")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="releaseYear" label="ปีที่ฉาย (ค.ศ.)" state={state}>
          <input
            {...common("releaseYear")}
            type="number"
            min={1}
            max={2200}
            placeholder="2026"
          />
        </FormField>
        <FormField
          name="viewingCount"
          label="จำนวนรอบที่ดูจบทั้งหมด"
          hint="รวมครั้งแรกและดูซ้ำ · แก้ได้เองโดยไม่ขึ้นกับจำนวนรีวิว"
          state={state}
        >
          <input
            {...common("viewingCount")}
            type="number"
            min={0}
            max={100000}
            step={1}
            required
          />
        </FormField>
        <FormField
          name="genres"
          label="แนวของเรื่อง"
          hint="คั่นแต่ละแนวด้วยเครื่องหมาย , เช่น ดราม่า, Sci-fi"
          state={state}
        >
          <input {...common("genres")} maxLength={500} />
        </FormField>
        <FormField name="country" label="ประเทศ" state={state}>
          <input
            {...common("country")}
            maxLength={100}
            placeholder="ไทย / ญี่ปุ่น / สหรัฐอเมริกา"
          />
        </FormField>
        <FormField name="language" label="ภาษา" state={state}>
          <input {...common("language")} maxLength={100} />
        </FormField>
        <FormField name="runtimeMinutes" label="ความยาว (นาที)" state={state}>
          <input
            {...common("runtimeMinutes")}
            type="number"
            min={1}
            max={10000}
          />
        </FormField>
        <FormField
          name="totalEpisodes"
          label="จำนวนตอนทั้งหมด"
          hint="ไม่ทราบจำนวนตอน เว้นว่างได้"
          state={state}
        >
          <input
            {...common("totalEpisodes")}
            type="number"
            min={1}
            max={100000}
          />
        </FormField>
        <FormField
          name="coverUrl"
          label="URL ภาพปก"
          hint="ใช้ลิงก์ https:// หรือเว้นไว้แล้วเพิ่มทีหลัง"
          state={state}
        >
          <input
            {...common("coverUrl")}
            maxLength={2048}
            placeholder="https://…"
          />
        </FormField>
        <FormField
          name="backdropUrl"
          label="URL ภาพบรรยากาศ"
          state={state}
          wide
        >
          <input
            {...common("backdropUrl")}
            maxLength={2048}
            placeholder="https://…"
          />
        </FormField>
        <FormField name="synopsis" label="เรื่องย่อ" state={state} wide>
          <textarea {...common("synopsis")} maxLength={5000} rows={5} />
        </FormField>
      </div>
      <FormFeedback state={state} />
      <div className="formActions">
        <button className="button" type="submit" disabled={pending}>
          <Save size={17} aria-hidden="true" />
          {pending ? "กำลังบันทึก…" : "บันทึกเรื่อง"}
        </button>
        <Link
          className="quietLink"
          href={cancelHref ?? (title ? `/titles/${title.id}` : "/library")}
          onClick={onCancel}
          scroll={false}
        >
          ยกเลิก
        </Link>
      </div>
      <p className="muted small">
        Scores and personal memories belong to each viewing. Add them after
        saving this title.
      </p>
    </form>
  );
}
