"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import Button from "@/components/ui/Button";
import RemakePromise from "@/components/measurements/RemakePromise";
import { mmToUnit, parseToMm, fmtMm, unitLabel } from "@/lib/measurements/api";

/**
 * "My size" module. Three ways to enter the same measurements:
 *   form   - every measurement on one page
 *   steps  - one at a time, with a picture
 *   video  - one at a time, with a how-to video
 *
 * mode="profile": create / edit / choose a saved profile.
 * mode="remake" : edit an existing order's measurements, but only inside
 *                 `limits` ({ CODE: { min, max } } in mm).
 *
 * Optional groups (see OPTIONAL_GROUPS) can be left empty for now.
 */
const OPTIONAL_GROUPS = new Set(["Trousers"]);
const MODES = [
  { key: "form", label: "Full form" },
  { key: "steps", label: "Step by step" },
  { key: "video", label: "Video guide" },
];

function useBodyLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function BodyIllustration({ label }) {
  // Placeholder picture until real illustrations are added.
  return (
    <svg viewBox="0 0 120 150" className="h-40 w-auto text-[var(--color-gold)]" aria-hidden="true">
      <circle cx="60" cy="18" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M36 40 Q60 32 84 40 L94 82 L82 84 L78 140 L42 140 L38 84 L26 82 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="30" y1="62" x2="90" y2="62" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <title>{label}</title>
    </svg>
  );
}

export default function MeasurementModal({
  open,
  onClose,
  form = [],
  profiles = [],
  mode = "profile",
  initialValues = null,
  initialName = "",
  initialWeight = "",
  editingId = null,
  limits = null,
  title,
  submitLabel = "Save and use this size",
  onSubmit,
  onDeleteProfile,
}) {
  useBodyLock(open);

  const [unit, setUnitState] = useState("mm"); // measurements are kept in millimetres
  const [view, setView] = useState("edit"); // "pick" | "edit"
  const [entry, setEntry] = useState("form");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ohmust_measure_unit");
      if (saved === "mm" || saved === "in" || saved === "cm") setUnitState(saved);
    } catch {}
  }, []);

  function changeUnit(next) {
    if (next === unit) return;
    // convert whatever is typed so far, so nothing is lost
    setValues((current) =>
      Object.fromEntries(
        Object.entries(current).map(([code, text]) => {
          const mm = parseToMm(text, unit);
          return [code, Number.isFinite(mm) ? mmToUnit(mm, next) : text];
        })
      )
    );
    setUnitState(next);
    try {
      window.localStorage.setItem("ohmust_measure_unit", next);
    } catch {}
  }

  const byCode = useMemo(() => Object.fromEntries(form.map((f) => [f.code, f])), [form]);

  function loadProfile(profile) {
    setProfileId(profile?.id ?? null);
    setName(profile?.name ?? "");
    setWeight(profile?.weightKg ?? "");
    setValues(
      Object.fromEntries(
        Object.entries(profile?.values ?? {}).map(([code, mm]) => [code, mmToUnit(mm, unit)])
      )
    );
  }

  useEffect(() => {
    if (!open) return;
    setError("");
    setStep(0);
    setBusy(false);
    if (mode === "remake") {
      setView("edit");
      setProfileId(null);
      setName("");
      setWeight("");
      setValues(
        Object.fromEntries(Object.entries(initialValues ?? {}).map(([c, mm]) => [c, mmToUnit(mm, unit)]))
      );
      return;
    }
    if (profiles.length > 0 && !editingId) {
      setView("pick");
    } else {
      setView("edit");
      const editing = profiles.find((p) => p.id === editingId);
      loadProfile(editing ?? null);
      if (!editing) setName(profiles.length ? "" : "My measurements");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fields = useMemo(() => {
    // Remake edits exactly what the order has; profile edits everything.
    const wanted = mode === "remake" ? Object.keys(initialValues ?? {}) : null;
    return form.filter((f) => !wanted || wanted.includes(f.code));
  }, [form, mode, initialValues]);

  const groups = useMemo(() => {
    const out = [];
    for (const f of fields) {
      let g = out.find((x) => x.name === f.group);
      if (!g) out.push((g = { name: f.group, items: [] }));
      g.items.push(f);
    }
    return out;
  }, [fields]);

  const [openGroup, setOpenGroup] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setOpenGroup(groups[0]?.name ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groups.length]);

  if (!open || !mounted) return null;

  function rangeFor(field) {
    const lim = limits?.[field.code];
    return {
      min: lim?.min ?? field.minMm,
      max: lim?.max ?? field.maxMm,
    };
  }

  function validateField(field) {
    const raw = values[field.code];
    const optional = mode === "profile" && OPTIONAL_GROUPS.has(field.group);
    if (raw === undefined || raw === "") {
      return optional ? "" : `Enter your ${field.name.toLowerCase()}.`;
    }
    const mm = parseToMm(raw, unit);
    if (!Number.isFinite(mm)) return `${field.name}: enter a number, like 32 or 32 1/2.`;
    const { min, max } = rangeFor(field);
    if (min != null && (mm < min || mm > max)) {
      return `${field.name} should be between ${mmToUnit(min, unit)} and ${mmToUnit(max, unit)} ${unitLabel(unit)}.`;
    }
    return "";
  }

  function validateAll() {
    for (const f of fields) {
      const msg = validateField(f);
      if (msg) return { msg, field: f };
    }
    if (mode === "profile" && !name.trim()) return { msg: "Give this profile a name." };
    return null;
  }

  async function submit() {
    const problem = validateAll();
    if (problem) {
      setError(problem.msg);
      if (problem.field) {
        const idx = fields.findIndex((f) => f.code === problem.field.code);
        if (idx >= 0) setStep(idx);
      }
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mmValues = {};
      for (const f of fields) {
        const raw = values[f.code];
        if (raw !== undefined && raw !== "") mmValues[f.code] = parseToMm(raw, unit);
      }
      await onSubmit({
        id: profileId,
        name: name.trim(),
        values: mmValues,
        weightKg: weight === "" ? null : Number(weight),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save measurements.");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-gold)]";

  function numberInput(field, extra = {}) {
    return (
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={unit === "in" ? "e.g. 32 1/2" : unit === "mm" ? "e.g. 825" : "e.g. 82.5"}
        value={values[field.code] ?? ""}
        onChange={(e) => setValues((v) => ({ ...v, [field.code]: e.target.value }))}
        className={inputCls}
        {...extra}
      />
    );
  }

  const current = fields[step];
  const isLast = step === fields.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div
        className="relative w-full rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl sm:max-w-2xl sm:rounded-3xl"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-4">
          <div>
            <h2 className="font-[var(--font-display)] text-xl">
              {title ?? (mode === "remake" ? "Remake measurements" : "My size")}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {mode === "remake"
                ? "You can adjust each measurement by up to 20 mm (2 cm, about ¾ inch)."
                : "Measured once, used for every garment. Saved to your account."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="om-tap rounded-full px-3 py-1 text-sm text-[var(--color-text-muted)]"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4">
          {view === "pick" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Choose a saved size</p>
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.name}
                      {p.isDefault ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-gold-bright)]">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--color-text-faint)]">
                      Chest {mmToUnit(p.values?.CHEST, unit)} · Waist {mmToUnit(p.values?.WAIST, unit)} · Hip{" "}
                      {mmToUnit(p.values?.HIP, unit)} {unitLabel(unit)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="om-tap text-xs text-[var(--color-text-muted)]"
                      onClick={() => {
                        setView("edit");
                        loadProfile(p);
                      }}
                    >
                      Edit
                    </button>
                    {onDeleteProfile ? (
                      <button
                        type="button"
                        className="om-tap text-xs text-[var(--color-danger)]"
                        onClick={() => onDeleteProfile(p)}
                      >
                        Delete
                      </button>
                    ) : null}
                    <Button
                      className="!px-4 !py-2 !text-xs"
                      loading={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          await onSubmit({ useExistingId: p.id });
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not use this size.");
                          setBusy(false);
                        }
                      }}
                    >
                      Use this
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => {
                  setView("edit");
                  loadProfile(null);
                  setName("");
                }}
              >
                + Add new measurements
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {mode === "profile" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)]">Profile name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Me, Work fit"
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)]">Weight (kg)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="20"
                      max="250"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="optional"
                      className={inputCls}
                    />
                  </label>
                </div>
              )}

              {/* units */}
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Measuring in</span>
                <div className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-0.5">
                  {[
                    { key: "mm", label: "mm" },
                    { key: "cm", label: "cm" },
                    { key: "in", label: "Inches" },
                  ].map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => changeUnit(u.key)}
                      className={[
                        "om-tap rounded-full px-3 py-1.5 font-medium transition-colors",
                        unit === u.key
                          ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                          : "text-[var(--color-text-muted)]",
                      ].join(" ")}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                {unit === "in" && <span className="text-[var(--color-text-faint)]">Fractions like 32 1/2 work</span>}
              </div>

              {/* entry mode tabs */}
              <div className="inline-flex self-start rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] p-1">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setEntry(m.key);
                      setError("");
                    }}
                    className={[
                      "om-tap rounded-full px-4 py-2 text-xs font-medium transition-colors",
                      entry === m.key
                        ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                        : "text-[var(--color-text-muted)]",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {entry === "form" ? (
                <div className="flex flex-col gap-2.5">
                  {groups.map((g) => {
                    const done = g.items.filter((f) => String(values[f.code] ?? "").trim() !== "").length;
                    const isOpen = openGroup === g.name;
                    const optional = mode === "profile" && OPTIONAL_GROUPS.has(g.name);
                    return (
                      <div
                        key={g.name}
                        className={[
                          "overflow-hidden rounded-2xl border transition-colors",
                          isOpen
                            ? "border-[var(--color-gold)]/60 bg-[var(--color-surface)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)]",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenGroup(isOpen ? null : g.name)}
                          className="om-tap flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={[
                                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                                done === g.items.length
                                  ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)]"
                                  : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)]",
                              ].join(" ")}
                            >
                              {done === g.items.length ? "✓" : done}
                            </span>
                            <span>
                              <span className="block text-sm font-medium">{g.name}</span>
                              <span className="block text-[11px] text-[var(--color-text-muted)]">
                                {done} of {g.items.length} filled{optional ? " · optional for now" : ""}
                              </span>
                            </span>
                          </span>
                          <span
                            aria-hidden="true"
                            className={`text-[var(--color-gold-bright)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                          >
                            ▾
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] px-4 py-4 sm:grid-cols-3">
                            {g.items.map((f) => {
                              const { min, max } = rangeFor(f);
                              return (
                                <label key={f.code} className="flex flex-col gap-1" title={f.help}>
                                  <span className="text-[11px] text-[var(--color-text-muted)]">
                                    {f.name} ({unitLabel(unit)})
                                  </span>
                                  {numberInput(f)}
                                  {limits ? (
                                    <span className="text-[10px] text-[var(--color-text-faint)]">
                                      {mmToUnit(min, unit)} – {mmToUnit(max, unit)} {unitLabel(unit)}
                                    </span>
                                  ) : null}
                                </label>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : current ? (
                <div className="flex flex-col gap-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full bg-[var(--color-gold)] transition-all"
                      style={{ width: `${((step + 1) / fields.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {current.group} · {step + 1} of {fields.length}
                  </p>
                  <h3 className="font-[var(--font-display)] text-lg">{current.name}</h3>

                  <div className="flex justify-center rounded-2xl bg-[var(--color-surface-2)] p-3">
                    {entry === "video" ? (
                      <video
                        key={current.code}
                        src={current.videoUrl}
                        controls
                        loop
                        muted
                        playsInline
                        className="max-h-56 w-full rounded-xl bg-black"
                      />
                    ) : (
                      <BodyIllustration label={current.name} />
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">{current.help}</p>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{current.name} ({unitLabel(unit)})</span>
                    {numberInput(current, {
                      autoFocus: true,
                      onKeyDown: (e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const msg = validateField(current);
                          if (msg) return setError(msg);
                          setError("");
                          if (isLast) submit();
                          else setStep((s) => s + 1);
                        }
                      },
                    })}
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={step === 0}
                      onClick={() => {
                        setError("");
                        setStep((s) => Math.max(0, s - 1));
                      }}
                      className="om-tap text-sm text-[var(--color-text-muted)] disabled:opacity-40"
                    >
                      Back
                    </button>
                    {!isLast ? (
                      <Button
                        className="!px-6 !py-2.5 !text-sm"
                        onClick={() => {
                          const msg = validateField(current);
                          if (msg) return setError(msg);
                          setError("");
                          setStep((s) => s + 1);
                        }}
                      >
                        Next
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {mode === "profile" && <RemakePromise compact />}
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}
        </div>

        {view === "edit" && (
          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-4">
            {profiles.length > 0 && mode === "profile" ? (
              <button
                type="button"
                onClick={() => {
                  setView("pick");
                  setError("");
                }}
                className="om-tap text-sm text-[var(--color-text-muted)]"
              >
                Saved sizes
              </button>
            ) : (
              <span />
            )}
            <Button loading={busy} onClick={submit}>
              {submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
