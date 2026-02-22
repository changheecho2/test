"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDbClient } from "../lib/firebaseClient";
import { Accompanist } from "../lib/types";

const purposes = ["입시", "공연", "콩쿨", "레슨"];
const regions = ["서울", "경기", "인천", "부산", "대전", "대구", "광주", "온라인"];
const mockAccompanists: Accompanist[] = [
  {
    uid: "mock-1",
    displayName: "우아한 모차르트",
    region: "서울",
    specialties: ["성악", "뮤지컬"],
    purposes: ["공연", "입시"],
    priceMin: 70000,
    priceMax: 140000,
    bio: "오페라 & 뮤지컬 반주 8년. 리허설 동선과 템포 맞춤에 강합니다.",
    education: "한국예술종합학교",
    experience: "시립오페라단 객원",
    portfolioLinks: [],
    availableSlots: "평일 저녁, 주말 오후",
    isPublic: true
  },
  {
    uid: "mock-2",
    displayName: "담백한 베토벤",
    region: "경기",
    specialties: ["바이올린", "실내악"],
    purposes: ["콩쿨", "레슨"],
    priceMin: 60000,
    priceMax: 120000,
    bio: "콩쿨 대비 템포/다이내믹 디렉션 가능합니다.",
    education: "서울대학교",
    experience: "국내 콩쿨 반주 다수",
    portfolioLinks: [],
    availableSlots: "주말 오전",
    isPublic: true
  },
  {
    uid: "mock-3",
    displayName: "섬세한 드뷔시",
    region: "부산",
    specialties: ["피아노", "합창"],
    purposes: ["공연", "레슨"],
    priceMin: 50000,
    priceMax: 90000,
    bio: "합창단 반주 경험이 풍부하고 합주 리딩에 익숙합니다.",
    education: "부산예술대",
    experience: "지역 합창단 전속 반주",
    portfolioLinks: [],
    availableSlots: "평일 오후",
    isPublic: true
  },
  {
    uid: "mock-4",
    displayName: "단정한 쇼팽",
    region: "대전",
    specialties: ["첼로", "클래식"],
    purposes: ["입시", "콩쿨"],
    priceMin: 80000,
    priceMax: 160000,
    bio: "입시 곡목 빠른 초견 가능, 당일 리허설 옵션 제공.",
    education: "연세대학교",
    experience: "입시 전문 반주 5년",
    portfolioLinks: [],
    availableSlots: "주중 낮",
    isPublic: true
  }
];

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
      if (!db) {
        setItems(mockAccompanists);
        return;
      }
      const q = query(collection(db, "accompanists"), where("isPublic", "==", true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as Omit<Accompanist, "uid">) }));
      setItems(data.length ? data : mockAccompanists);
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-white to-stone/60 p-6 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-[#120d0a] dark:via-[#17120f] dark:to-[#0b0806]">
        <div className="pointer-events-none absolute -right-16 top-6 h-40 w-40 rounded-full bg-cocoa/20 blur-3xl dark:bg-[#2a201a]/70" />
        <div className="pointer-events-none absolute -left-10 bottom-6 h-32 w-32 rounded-full bg-ink/15 blur-3xl dark:bg-[#0b0806]/80" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Ensemble</p>
            <h1 className="mt-2 text-3xl font-display font-semibold md:text-4xl text-ink dark:text-[#f8f2ec]">
              오늘 필요한 반주자를 24시간 안에
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted dark:text-[#cdbfb3]">
              목적·일정·예산에 맞는 반주자를 즉시 찾고 요청서를 보내세요. 수락 후에만 연락처가
              공개됩니다. 빠른 매칭을 위해 응답 속도와 전문 분야를 함께 보여드립니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-ink px-3 py-1 text-white">연락처 보호</span>
              <span className="rounded-full bg-cocoa px-3 py-1 text-white">빠른 수락 흐름</span>
              <span className="rounded-full bg-sand px-3 py-1 text-muted dark:bg-[#1f1915] dark:text-[#c9bfb6]">
                모바일 최적화
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm dark:bg-[#1a1512]">
              <div className="text-lg font-semibold">24시간</div>
              <div className="text-xs text-muted">평균 응답</div>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm dark:bg-[#1a1512]">
              <div className="text-lg font-semibold">200+</div>
              <div className="text-xs text-muted">예상 매칭</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#14100e]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">반주자 탐색</h2>
            <p className="mt-1 text-sm text-muted dark:text-[#cdbfb3]">
              목적, 지역, 비용 범위를 선택해 적합한 반주자를 찾아보세요.
            </p>
          </div>
          <p className="text-xs text-muted dark:text-[#b9aa9e]">현재는 데모 목록이 포함되어 있습니다.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label>지역</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">전체</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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
          <Link
            key={item.uid}
            href={`/a?uid=${item.uid}`}
            className="group rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-night/30 hover:shadow-md dark:border-white/10 dark:bg-[#14100e] dark:hover:border-[#c9a483]/60"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{item.displayName}</h3>
              <span className="rounded-full bg-sand px-3 py-1 text-xs text-muted dark:bg-[#1c1613] dark:text-[#d6c8bd]">
                {item.region}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted dark:text-[#cdbfb3]">
              {item.bio || "소개가 아직 없습니다."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {item.purposes.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-sand px-3 py-1 text-ink dark:bg-[#1c1613] dark:text-[#f4efe9]"
                >
                  {p}
                </span>
              ))}
              {item.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-stone px-3 py-1 text-cocoa dark:bg-[#0f0c0a] dark:text-[#e0d5cc]"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold">
              <span>
                {item.priceMin.toLocaleString()}원 ~ {item.priceMax.toLocaleString()}원
              </span>
              <span className="text-xs font-medium text-muted group-hover:text-cocoa dark:text-[#cdbfb3] dark:group-hover:text-[#f4efe9]">
                프로필 보기 →
              </span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted dark:border-white/10 dark:bg-[#14100e] dark:text-[#cdbfb3]">
            조건에 맞는 반주자가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
