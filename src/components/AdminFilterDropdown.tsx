"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

type AdminFilterDropdownProps = {
  label: string;
  placeholder?: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

export default function AdminFilterDropdown({
  label,
  placeholder = 'Semua',
  options,
  selectedValues,
  onChange,
}: AdminFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions = useMemo(
    () => Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [options]
  );

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return normalizedOptions;
    return normalizedOptions.filter((option) => option.toLowerCase().includes(keyword));
  }, [normalizedOptions, search]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const allSelected = normalizedOptions.length > 0 && selectedValues.length === normalizedOptions.length;

  const buttonText =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
      ? selectedValues[0]
      : `${selectedValues.length} dipilih`;

  const toggleValue = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : normalizedOptions);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm shadow-sm transition ${
          isOpen ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`truncate ${selectedValues.length ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
          {buttonText}
        </span>
        <ChevronDown size={16} className={`ml-2 shrink-0 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full min-w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <label className="flex min-w-0 cursor-pointer items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  allSelected || selectedValues.length > 0
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-gray-100 text-transparent'
                }`}
              >
                <Check size={17} strokeWidth={3} />
              </span>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="sr-only" />
              <span className="truncate text-sm font-bold text-gray-700">{label}</span>
            </label>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                title="Bersihkan filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative border-b border-gray-100 px-4 py-3">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type to search"
              className="h-10 w-full rounded-xl border border-transparent bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-gray-400">Tidak ada opsi.</p>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedSet.has(option);
                return (
                  <div key={option} className="group flex items-center gap-2 px-4 py-2 hover:bg-blue-50/70">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          checked ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        <Check size={17} strokeWidth={3} />
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleValue(option)}
                        className="sr-only"
                      />
                      <span className="truncate text-sm font-medium text-gray-700">{option}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onChange([option])}
                      className="rounded-md bg-gray-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-600 opacity-0 transition hover:bg-blue-100 hover:text-blue-700 group-hover:opacity-100"
                    >
                      Only
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
