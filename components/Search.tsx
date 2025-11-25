"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect } from "react";

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentQuery = searchParams.get("query") || "";
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  // Sync local state with URL params when they change
  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (term.trim()) {
      params.set("query", term);
    } else {
      params.delete("query");
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="admin-search mb-6 flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
      <SearchIcon className="w-5 h-5 text-muted-foreground shrink-0" />

      <Input
        type="text"
        placeholder="Search by name or register number..."
        className="admin-search_input"
        value={searchTerm}
        onChange={handleInputChange}
      />

      {searchTerm && (
        <button
          onClick={clearSearch}
          className="p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
