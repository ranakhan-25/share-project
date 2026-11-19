"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Clock, ArrowRight } from "lucide-react";

export interface PredictiveSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  onSelectSuggestion?: (item: string) => void;
  debounceMs?: number;
}

export default function PredictiveSearchInput({
  value,
  onChange,
  placeholder = "Search with predictive hints...",
  suggestions = [],
  className = "",
  onSelectSuggestion,
  debounceMs = 250,
}: PredictiveSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal value with prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced parent onChange
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered predictive suggestions
  const filteredSuggestions = useMemo(() => {
    const q = internalValue.trim().toLowerCase();
    if (!q || !suggestions.length) return [];
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      .slice(0, 6);
  }, [suggestions, internalValue]);

  const handleSelect = (s: string) => {
    setInternalValue(s);
    onChange(s);
    onSelectSuggestion?.(s);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setInternalValue(e.target.value);
          setIsOpen(true);
        }}
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Predictive Suggestions Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in duration-150">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Predictive suggestions
          </div>
          <ul className="space-y-0.5">
            {filteredSuggestions.map((suggestion, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(suggestion)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
