"use client";

import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import { getDbClient, getFunctionsClient } from "../../lib/firebaseClient";
import { Accompanist } from "../../lib/types";
import { validateNoContact } from "../../lib/validation";

const purposes = ["입시", "공연", "콩쿨", "레슨"];
const mockAccompanists: Record<string, Accompanist> = {
  "mock-1": {
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
  "mock-2": {
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
  "mock-3": {
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
  "mock-4": {
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
};

export default function AccompanistPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [data, setData] = useState<Accompanist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    purpose: "입시",
    instrument: "",
    repertoire: "",
    schedule: "",
    location: "",
    budgetMin: "",
    budgetMax: "",
    options: {
      sightReading: false,
      sameDayRehearsal: false,
      recording: false,
      provideSheet: false
    },
    note: "",
    contactEmail: ""
  });
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const value = params.get("uid");
    if (!value) {
      setError("반주자 정보를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }
    setUid(value);
  }, []);

  useEffect(() => {
    if (!uid) return;
    const fetchData = async () => {
      try {
        const db = getDbClient();
        if (!db) {
          const mock = mockAccompanists[uid];
          if (mock) {
            setData(mock);
            return;
          }
          setError("현재 설정으로 프로필을 불러올 수 없습니다.");
          return;
        }
        const snap = await getDoc(doc(db, "accompanists", uid));
        if (!snap.exists()) {
          const mock = mockAccompanists[uid];
          if (mock) {
            setData(mock);
            return;
          }
          setError("해당 반주자를 찾을 수 없습니다.");
          return;
        }
        const docData = snap.data() as Omit<Accompanist, "uid">;
        if (!docData.isPublic) {
          setError("해당 반주자 프로필은 비공개입니다.");
          return;
        }
        setData({ uid: snap.id, ...docData });
      } catch (err) {
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  const validate = () => {
    if (!form.instrument.trim() || !form.repertoire.trim() || !form.schedule.trim() || !form.location.trim()) {
      return "필수 정보를 모두 입력해 주세요.";
    }
    if (!form.budgetMin || !form.budgetMax) {
      return "희망 비용을 입력해 주세요.";
    }
    if (!form.contactEmail.trim()) {
      return "연락 가능한 이메일을 입력해 주세요.";
    }
    const fieldsToCheck = [form.instrument, form.repertoire, form.schedule, form.location, form.note];
    for (const field of fieldsToCheck) {
      const message = validateNoContact(field);
      if (message) return message;
    }
    return null;
  };

  const submit = async () => {
    setSubmitMessage(null);
    const message = validate();
    if (message) {
      setSubmitMessage(message);
      return;
    }
    if (isTestMode) {
      setSubmitMessage("테스트 단계로 실제 전송은 되지 않습니다. 입력 경험만 확인해 주세요.");
      return;
    }
    try {
      const functions = getFunctionsClient();
      if (!functions) {
        setSubmitMessage("현재 설정으로 요청서를 전송할 수 없습니다.");
        return;
      }
      const callable = httpsCallable(functions, "createRequest");
      await callable({
        accompanistUid: uid,
        purpose: form.purpose,
        instrument: form.instrument.trim(),
        repertoire: form.repertoire.trim(),
        schedule: form.schedule.trim(),
        location: form.location.trim(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        options: form.options,
        note: form.note.trim(),
        contactEmail: form.contactEmail.trim()
      });
      setSubmitMessage("요청서가 접수되었습니다. 반주자가 확인 후 연락드립니다.");
      setForm({
        purpose: "입시",
        instrument: "",
        repertoire: "",
        schedule: "",
        location: "",
        budgetMin: "",
        budgetMax: "",
        options: {
          sightReading: false,
          sameDayRehearsal: false,
          recording: false,
          provideSheet: false
        },
        note: "",
        contactEmail: ""
      });
    } catch (err: any) {
      setSubmitMessage(err?.message || "요청서 제출에 실패했습니다.");
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#15110f]">
        <h1 className="text-lg font-semibold">반주자 프로필 미리보기</h1>
        <p className="mt-2 text-sm text-muted">
          주소가 올바르지 않거나 현재는 테스트 데이터만 준비되어 있습니다.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.values(mockAccompanists).map((item) => (
            <a
              key={item.uid}
              href={`/a?uid=${item.uid}`}
              className="rounded-xl border border-line bg-sand px-4 py-3 text-sm"
            >
              {item.displayName} · {item.region} · {item.specialties.join(", ")}
            </a>
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#15110f]">
        <h1 className="text-2xl font-semibold">{data.displayName}</h1>
        <p className="mt-2 text-sm text-muted">{data.region}</p>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <div className="font-semibold">소개</div>
            <div className="text-muted">{data.bio || "소개가 아직 없습니다."}</div>
          </div>
          <div>
            <div className="font-semibold">학력</div>
            <div className="text-muted">{data.education || "-"}</div>
          </div>
          <div>
            <div className="font-semibold">경력</div>
            <div className="text-muted">{data.experience || "-"}</div>
          </div>
          <div>
            <div className="font-semibold">전문 분야</div>
            <div className="text-muted">{data.specialties.join(", ")}</div>
          </div>
          <div>
            <div className="font-semibold">목적</div>
            <div className="text-muted">{data.purposes.join(", ")}</div>
          </div>
          <div>
            <div className="font-semibold">비용 범위</div>
            <div className="text-muted">
              {data.priceMin.toLocaleString()}원 ~ {data.priceMax.toLocaleString()}원
            </div>
          </div>
          <div>
            <div className="font-semibold">가능 일정</div>
            <div className="text-muted">{data.availableSlots || "협의"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#15110f]">
        <h2 className="text-lg font-semibold">요청서 보내기</h2>
        <p className="mt-2 text-xs text-muted">
          연락처는 결제 승인 후에만 공개됩니다. 무료 텍스트에 연락처를 입력할 수 없습니다.
        </p>
        {isTestMode && (
          <p className="mt-1 text-xs text-muted">현재는 테스트 단계로 실제 전송은 되지 않습니다.</p>
        )}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <label>목적</label>
            <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label>악기/파트</label>
            <input
              value={form.instrument}
              onChange={(e) => setForm({ ...form, instrument: e.target.value })}
              placeholder="예: 성악, 바이올린"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>곡/레퍼토리</label>
            <input
              value={form.repertoire}
              onChange={(e) => setForm({ ...form, repertoire: e.target.value })}
              placeholder="예: Schubert Ave Maria"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>일정(날짜/시간)</label>
            <input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="예: 3/10 오후 2시"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>장소(지역/온라인)</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="예: 서울 / 온라인"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label>희망 비용(최소)</label>
              <input
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                placeholder="원"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>희망 비용(최대)</label>
              <input
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                placeholder="원"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label>추가 요청</label>
            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.options.sightReading}
                onChange={(e) =>
                  setForm({ ...form, options: { ...form.options, sightReading: e.target.checked } })
                }
              />
              초견 가능
            </label>
            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.options.sameDayRehearsal}
                onChange={(e) =>
                  setForm({ ...form, options: { ...form.options, sameDayRehearsal: e.target.checked } })
                }
              />
              당일 리허설
            </label>
            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.options.recording}
                onChange={(e) =>
                  setForm({ ...form, options: { ...form.options, recording: e.target.checked } })
                }
              />
              녹음/촬영
            </label>
            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={form.options.provideSheet}
                onChange={(e) =>
                  setForm({ ...form, options: { ...form.options, provideSheet: e.target.checked } })
                }
              />
              악보 제공 가능
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <label>전달사항(선택, 120자)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              maxLength={120}
              rows={3}
              placeholder="예: 특정 곡 템포 요청"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label>연락 이메일</label>
            <input
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="example@email.com"
            />
          </div>
          {submitMessage && <p className="text-sm text-rose-600">{submitMessage}</p>}
          <button className="w-full bg-cocoa text-white" onClick={submit}>
            요청서 제출
          </button>
        </div>
      </section>
    </div>
  );
}
