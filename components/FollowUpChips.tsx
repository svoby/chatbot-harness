"use client";

interface Props {
  chips: string[];
  onSelect: (chip: string) => void;
}

export default function FollowUpChips({ chips, onSelect }: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-xs text-gray-400 self-center">Try:</span>
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
