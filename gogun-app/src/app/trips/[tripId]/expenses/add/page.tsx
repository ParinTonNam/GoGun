"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TripExpensesView } from "@/components/trip-expenses-view";

function AddExpenseRouteInner() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  return <TripExpensesView initialOpenAdd={!editId} initialEditId={editId} />;
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={<TripExpensesView initialOpenAdd />}>
      <AddExpenseRouteInner />
    </Suspense>
  );
}
