"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDbClient } from "../lib/firebaseClient";
import { Accompanist } from "../lib/types";

const purposes = ["입시", "공연", "콩쿨", "레슨"];

export default function HomePage() {
  const [items, setItems] = useState<Accompanist[]>([]);
  const [region, setRegion] = useState("");
  const [purpose, setPurpose] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDbClient();
      if (!db) return;
      const q = query(collection(db, "accompanists"), where("isPublic", "==", true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as Omit<Accompanist, "uid">) }));
      setItems(data);
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (region && !item.region.includes(region)) return false;
      if (purpose && !item.purposes.includes(purpose)) return false;
      if (specialty && !item.specialties.includes(specialty)) return false;
      if (priceMin && item.priceMax < Number(priceMin)) return false;
      if (priceMax && item.priceMin > Number(priceMax)) return false;
      return true;
    });
  }, [items, region, purpose, specialty, priceMin, priceMax]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">반주자 목록</h1>
        <p className="mt-2 text-sm text-muted">
          목적, 지역, 비용 범위를 선택해 적합한 반주자를 찾아보세요.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label>지역</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 서울" />
          </div>
          <div className="flex flex-col gap-1">
            <label>목적</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="">전체</option>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label>분야</label>
            <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="예: 성악" />
          </div>
          <div className="flex flex-col gap-1">
            <label>최소 비용</label>
            <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="원" />
          </div>
          <div className="flex flex-col gap-1">
            <label>최대 비용</label>
            <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="원" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <Link key={item.uid} href={`/a/${item.uid}`} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{item.displayName}</h2>
              <span className="text-xs text-muted">{item.region}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{item.bio || "소개가 아직 없습니다."}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {item.purposes.map((p) => (
                <span key={p} className="rounded-full bg-stone px-3 py-1">
                  {p}
                </span>
              ))}
              {item.specialties.map((s) => (
                <span key={s} className="rounded-full bg-stone px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm font-semibold">
              {item.priceMin.toLocaleString()}원 ~ {item.priceMax.toLocaleString()}원
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-sm text-muted">조건에 맞는 반주자가 없습니다.</div>
        )}
      </section>
    </div>
  );
}
