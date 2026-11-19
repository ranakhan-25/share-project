"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

export interface PredictiveOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface PredictiveSearchSelectProps {
  options: PredictiveOption[] | Array<{ value: string; label: string }>;
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
  label?: string;
  multiple?: boolean;
}

export default function PredictiveSearchSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search or select an option...",
  disabled = false,
  required = false,
  className = "",
  name,
  id,
  multiple = false,
}: PredictiveSearchSelectProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize options
  const normalizedOptions: PredictiveOption[] = useMemo(() => {
    return (options || []).map((opt) => ({
      value: String(opt.value ?? ""),
      label: String(opt.label ?? opt.value ?? ""),
      subLabel: (opt as PredictiveOption).subLabel,
      badge: (opt as PredictiveOption).badge,
    }));
  }, [options]);

  // Selected values array
  const selectedValues: string[] = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value.map(String);
      return value ? [String(value)] : [];
    }
    return value ? [String(value)] : [];
  }, [multiple, value]);

  // Current selected option object(s)
  const selectedOptions = useMemo(() => {
    return normalizedOptions.filter((opt) => selectedValues.includes(opt.value));
  }, [normalizedOptions, selectedValues]);

  const singleSelectedOption = useMemo(() => {
    return selectedOptions[0] || null;
  }, [selectedOptions]);

  // Filter options based on predictive search term
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return normalizedOptions;

    return normalizedOptions.filter((opt) => {
      const l = opt.label.toLowerCase();
      const s = (opt.subLabel || "").toLowerCase();
      const v = opt.value.toLowerCase();
      return l.includes(q) || s.includes(q) || v.includes(q);
    });
  }, [normalizedOptions, searchTerm]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDownGlobal(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, []);

  // Sync search input when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setHighlightedIndex(-1);
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optValue: string) => {
    if (multiple) {
      const current = [...selectedValues];
      const index = current.indexOf(optValue);
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(optValue);
      }
      onChange(current);
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleRemoveChip = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== optValue));
    } else {
      onChange("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredOptions.length
      ) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper function to highlight matched search string
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span
          key={index}
          className="bg-amber-100 font-semibold text-emerald-800 rounded px-0.5"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-xs font-normal ${className}`}
    >
      {/* Hidden input for form submission compatibility */}
      <input
        type="hidden"
        name={name}
        id={inputId}
        value={Array.isArray(value) ? value.join(",") : value}
        required={required}
      />

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex min-h-10 w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-left text-xs transition shadow-xs outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70" : "cursor-pointer"}`}
      >
        <div className="flex-1 truncate pr-2">
          {multiple && selectedOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
                >
                  <span className="truncate max-w-[140px]">{opt.label}</span>
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveChip(e, opt.value)}
                      className="hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : !multiple && singleSelectedOption ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 truncate">
                {singleSelectedOption.label}
              </span>
              {singleSelectedOption.badge && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {singleSelectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedValues.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded-md p-0.5 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          {/* Predictive Search Input */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to filter..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Match Count Banner */}
          <div className="flex items-center justify-between px-2 pb-1 text-[11px] text-slate-400">
            <span>
              {searchTerm ? (
                <span>
                  Found <strong className="text-emerald-700">{filteredOptions.length}</strong> matches
                </span>
              ) : (
                <span>{normalizedOptions.length} options available</span>
              )}
            </span>
            <span className="text-[10px] text-slate-400">Press ↑↓ to navigate</span>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-36 overflow-y-auto space-y-0.5 rounded-lg pr-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400">
                <p>No matching options found</p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="mt-1.5 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedValues.includes(opt.value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition text-xs ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">
                        {renderHighlightedText(opt.label, searchTerm)}
                      </span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {renderHighlightedText(opt.subLabel, searchTerm)}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {multiple && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500 font-semibold">
                {selectedValues.length} selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
