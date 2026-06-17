import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";

export interface PrintItem {
  id: string;
  name: string;
  color: string;
  weight: number;
  infill: number;
  supports: boolean;
  printTimeHours: number;
  printTimeMinutes: number;
  costOverride?: number;
}

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: PrintItem) => void;
  item?: PrintItem | null;
}

const COLORS = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Gray",
  "Yellow",
  "Green",
  "Orange",
  "Purple",
];

const emptyItem = (): PrintItem => ({
  id: crypto.randomUUID(),
  name: "",
  color: "Black",
  weight: 0,
  infill: 20,
  supports: false,
  printTimeHours: 0,
  printTimeMinutes: 0,
  costOverride: undefined,
});

export function ItemDialog({ open, onClose, onSave, item }: ItemDialogProps) {
  const [form, setForm] = useState<PrintItem>(emptyItem());

  useEffect(() => {
    if (open) {
      setForm(item ? { ...item } : emptyItem());
    }
  }, [open, item]);

  const set = <K extends keyof PrintItem>(key: K, value: PrintItem[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle style={{ color: "#0f172a" }}>
            {item ? "Edit Print Item" : "Add Print Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="item-name" style={{ color: "#0f172a" }}>
              Name
            </Label>
            <Input
              id="item-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Phone Case"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>

          {/* Color */}
          <div className="grid gap-1.5">
            <Label style={{ color: "#0f172a" }}>Color</Label>
            <Select
              value={form.color}
              onValueChange={(v) => set("color", v)}
            >
              <SelectTrigger style={{ borderColor: "#e2e8f0" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight & Infill */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="item-weight" style={{ color: "#0f172a" }}>
                Weight (g)
              </Label>
              <Input
                id="item-weight"
                type="number"
                min={0}
                value={form.weight}
                onChange={(e) => set("weight", Number(e.target.value))}
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="item-infill" style={{ color: "#0f172a" }}>
                Infill %
              </Label>
              <Input
                id="item-infill"
                type="number"
                min={0}
                max={100}
                value={form.infill}
                onChange={(e) => set("infill", Number(e.target.value))}
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>
          </div>

          {/* Supports */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="item-supports"
              checked={form.supports}
              onCheckedChange={(v) => set("supports", Boolean(v))}
            />
            <Label
              htmlFor="item-supports"
              className="cursor-pointer"
              style={{ color: "#0f172a" }}
            >
              Requires Supports
            </Label>
          </div>

          {/* Print Time */}
          <div className="grid gap-1.5">
            <Label style={{ color: "#0f172a" }}>Print Time</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <span className="text-xs" style={{ color: "#64748b" }}>
                  Hours
                </span>
                <Input
                  type="number"
                  min={0}
                  value={form.printTimeHours}
                  onChange={(e) =>
                    set("printTimeHours", Number(e.target.value))
                  }
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
              <div className="grid gap-1">
                <span className="text-xs" style={{ color: "#64748b" }}>
                  Minutes
                </span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={form.printTimeMinutes}
                  onChange={(e) =>
                    set("printTimeMinutes", Number(e.target.value))
                  }
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
            </div>
          </div>

          {/* Cost Override */}
          <div className="grid gap-1.5">
            <Label htmlFor="item-cost" style={{ color: "#0f172a" }}>
              Cost Override (EGP)
            </Label>
            <Input
              id="item-cost"
              type="number"
              min={0}
              placeholder="Auto-calculated"
              value={form.costOverride ?? ""}
              onChange={(e) =>
                set(
                  "costOverride",
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.name.trim()}
            style={{ backgroundColor: "#1e3a8a", color: "#fff" }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
