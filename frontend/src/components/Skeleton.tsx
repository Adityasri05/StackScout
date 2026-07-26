import React from 'react';

export function CardSkeleton() {
  return (
    <div className="p-5 bg-surface border border-border rounded-xl space-y-3 animate-pulse">
      <div className="h-4 bg-raised rounded w-3/4"></div>
      <div className="h-3 bg-raised rounded w-1/2"></div>
      <div className="space-y-1.5 pt-2">
        <div className="h-2 bg-raised rounded"></div>
        <div className="h-2 bg-raised rounded w-5/6"></div>
      </div>
      <div className="h-8 bg-raised rounded-lg w-full pt-4"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border/50">
      <td className="p-4"><div className="h-4 bg-raised rounded w-2/3"></div></td>
      <td className="p-4"><div className="h-3 bg-raised rounded w-1/2"></div></td>
      <td className="p-4"><div className="h-3 bg-raised rounded w-1/3"></div></td>
      <td className="p-4"><div className="h-4 bg-raised rounded w-20"></div></td>
    </tr>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 bg-surface rounded w-2/3"></div>
        <div className="h-4 bg-surface rounded w-1/3"></div>
      </div>

      {/* Rec Card */}
      <div className="p-6 bg-surface border border-border rounded-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-raised rounded-xl"></div>
          <div className="h-6 bg-raised rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-raised rounded w-5/6"></div>
        <div className="h-4 bg-raised rounded w-2/3"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-surface border border-border rounded-xl h-48"></div>
        <div className="p-5 bg-surface border border-border rounded-xl h-48"></div>
      </div>
    </div>
  );
}
