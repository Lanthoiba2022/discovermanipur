"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

interface Preset {
  id: string;
  label: string;
  unit: string;
  unitPlural: string;
  defaultRate: number;
  minRate: number;
  maxRate: number;
  defaultUnits: number;
  maxUnits: number;
  typicalNote: string;
}

const PRESETS: Preset[] = [
  {
    id: "room",
    label: "A spare room in your home",
    unit: "night",
    unitPlural: "nights booked a month",
    defaultRate: 1400,
    minRate: 500,
    maxRate: 6000,
    defaultUnits: 10,
    maxUnits: 28,
    typicalNote: "Rooms in Imphal leikais list between ₹900 and ₹2,200 a night.",
  },
  {
    id: "whole",
    label: "A whole homestay or cottage",
    unit: "night",
    unitPlural: "nights booked a month",
    defaultRate: 3200,
    minRate: 1000,
    maxRate: 12000,
    defaultUnits: 8,
    maxUnits: 28,
    typicalNote: "Lakeside and hill cottages list between ₹2,000 and ₹5,500 a night.",
  },
  {
    id: "meal",
    label: "Meals from your kitchen",
    unit: "sitting",
    unitPlural: "sittings a month",
    defaultRate: 600,
    minRate: 150,
    maxRate: 2500,
    defaultUnits: 12,
    maxUnits: 60,
    typicalNote: "A four-course Manipuri thali with a host usually sits at ₹450 to ₹900 a head.",
  },
  {
    id: "experience",
    label: "A craft, loom or guided experience",
    unit: "session",
    unitPlural: "sessions a month",
    defaultRate: 900,
    minRate: 200,
    maxRate: 5000,
    defaultUnits: 8,
    maxUnits: 40,
    typicalNote: "Loom hours, pottery firings and ridge walks list between ₹600 and ₹1,800.",
  },
];

export function EarningsEstimator() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [rate, setRate] = useState(preset.defaultRate);
  const [units, setUnits] = useState(preset.defaultUnits);

  function choosePreset(id: string) {
    const next = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
    setPresetId(id);
    setRate(next.defaultRate);
    setUnits(next.defaultUnits);
  }

  // Discover Manipur takes no fee or commission and no money moves through the
  // site, so what guests pay is what the host receives.
  const { gross, yearly } = useMemo(() => {
    const g = Math.max(0, rate) * Math.max(0, units);
    return { gross: g, yearly: g * 12 };
  }, [rate, units]);

  return (
    <div className="grid gap-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)] md:grid-cols-2 md:p-8">
      <div className="space-y-6">
        <div>
          <Label htmlFor="est-type">What would you share?</Label>
          <Select value={presetId} onValueChange={choosePreset}>
            <SelectTrigger id="est-type" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="est-rate">Your price per {preset.unit}</Label>
            <output
              htmlFor="est-rate"
              className="text-sm font-semibold tabular-nums text-foreground"
            >
              {formatINR(rate)}
            </output>
          </div>
          <input
            id="est-rate"
            type="range"
            min={preset.minRate}
            max={preset.maxRate}
            step={50}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
          <p className="mt-2 text-xs text-muted-foreground">{preset.typicalNote}</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="est-units">How many {preset.unitPlural}?</Label>
            <output
              htmlFor="est-units"
              className="text-sm font-semibold tabular-nums text-foreground"
            >
              {units}
            </output>
          </div>
          <input
            id="est-units"
            type="range"
            min={0}
            max={preset.maxUnits}
            step={1}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Most new hosts fill between a quarter and a half of the month in their first season.
          </p>
        </div>
      </div>

      <div className="flex flex-col rounded-[var(--radius)] bg-surface-sunken p-6">
        <p className="eyebrow text-muted-foreground">What guests would pay you each month</p>
        <p
          className="mt-3 font-sans text-4xl font-semibold leading-none text-foreground md:text-5xl"
          aria-live="polite"
        >
          {formatINR(gross)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          about {formatINR(yearly, { compact: true })} across a full year at this rate
        </p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {units} × {formatINR(rate)}
            </dt>
            <dd className="tabular-nums text-foreground">{formatINR(gross)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Discover Manipur fee or commission</dt>
            <dd className="tabular-nums text-foreground">{formatINR(0)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <dt>Guests pay you directly</dt>
            <dd className="tabular-nums">{formatINR(gross)}</dd>
          </div>
        </dl>

        <p className="mt-auto flex gap-2 pt-6 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            This is an estimate, not an offer. It assumes you fill the nights you set here and
            excludes your own costs — food, laundry, electricity, repairs — and any tax you owe.
            Demand in Manipur is strongly seasonal: November around the Sangai Festival and the
            Shirui lily season in May run far fuller than the monsoon months.
          </span>
        </p>
      </div>
    </div>
  );
}
