"use client";

import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthClient, getDbClient } from "../../lib/firebaseClient";
import { Accompanist, RequestDoc } from "../../lib/types";

export default function DashboardPage() {
  const authClient = getAuthClient();
  const [user, setUser] = useState(authClient?.currentUser ?? null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Accompanist | null>(null);
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authClient) return;
    return onAuthStateChanged(authClient, (current) => {
      setUser(current);
    });
  }, [authClient]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRequests([]);
      return;
    }

    const fetchProfile = async () => {
      const db = getDbClient();
      if (!db) return;
      const snap = await getDoc(doc(db, "accompanists", user.uid));
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...(snap.data() as Omit<Accompanist, "uid">) });
      } else {
        setProfile({
          uid: user.uid,
          displayName: "",
          region: "",
          specialties: [],
          purposes: [],
          priceMin: 0,
          priceMax: 0,
          bio: "",
          education: "",
          experience: "",
          portfolioLinks: [],
          availableSlots: "",
          isPublic: false
        });
      }
    };

    const fetchRequests = async () => {
      const db = getDbClient();
      if (!db) return;
      const q = query(collection(db, "requests"), where("accompanistUid", "==", user.uid));
      const snap = await getDocs(q);
      const items = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<RequestDoc, "id">) }));
      setRequests(items);
    };

    fetchProfile();
    fetchRequests();
  }, [user]);

  const handleAuth = async (mode: "login" | "signup") => {
    setAuthMessage(null);
    try {
      if (mode === "signup") {
        if (!authClient) throw new Error("auth not ready");
        await createUserWithEmailAndPassword(authClient, authEmail, authPassword);
      } else {
        if (!authClient) throw new Error("auth not ready");
        await signInWithEmailAndPassword(authClient, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthMessage("로그인/회원가입에 실패했습니다.");
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setProfileMessage(null);
    if (!profile.displayName.trim() || !profile.region.trim()) {
      setProfileMessage("이름과 지역은 필수입니다.");
      return;
    }
    const db = getDbClient();
    if (!db) return;
    await setDoc(doc(db, "accompanists", user.uid), {
      displayName: profile.displayName.trim(),
      region: profile.region.trim(),
      specialties: profile.specialties,
      purposes: profile.purposes,
      priceMin: profile.priceMin,
      priceMax: profile.priceMax,
      bio: profile.bio,
      education: profile.education,
      experience: profile.experience,
      portfolioLinks: profile.portfolioLinks,
      availableSlots: profile.availableSlots,
      isPublic: profile.isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setProfileMessage("프로필이 저장되었습니다.");
  };

  return (
    <div className="space-y-6">
      {!authClient && (
        <div className="rounded-xl bg-white p-4 text-sm text-muted">
          Firebase 설정이 아직 완료되지 않았습니다. Cloudflare 환경 변수에 Firebase 값을 추가해 주세요.
        </div>
      )}
      {!user && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">반주자 로그인</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label>이메일</label>
              <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label>비밀번호</label>
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
            </div>
          </div>
          {authMessage && <p className="mt-2 text-sm text-rose-600">{authMessage}</p>}
          <div className="mt-4 flex gap-2">
            <button className="bg-ink text-white" onClick={() => handleAuth("login")}>
              로그인
            </button>
            <button className="border border-black/10" onClick={() => handleAuth("signup")}>
              회원가입
            </button>
          </div>
        </section>
      )}

      {user && profile && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">반주자 프로필</h1>
            <button className="border border-black/10" onClick={() => authClient && signOut(authClient)}>
              로그아웃
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label>이름</label>
              <input
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>지역</label>
              <input value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label>전문 분야(쉼표)</label>
              <input
                value={profile.specialties.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    specialties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>목적(쉼표)</label>
              <input
                value={profile.purposes.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    purposes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>최소 비용</label>
              <input
                value={profile.priceMin}
                onChange={(e) => setProfile({ ...profile, priceMin: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>최대 비용</label>
              <input
                value={profile.priceMax}
                onChange={(e) => setProfile({ ...profile, priceMax: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label>소개</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>학력</label>
              <input
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>경력</label>
              <input
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label>포트폴리오 링크(쉼표)</label>
              <input
                value={profile.portfolioLinks.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    portfolioLinks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>가능 일정</label>
              <input
                value={profile.availableSlots}
                onChange={(e) => setProfile({ ...profile, availableSlots: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.isPublic}
                onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
              />
              <label>프로필 공개</label>
            </div>
          </div>
          {profileMessage && <p className="mt-2 text-sm text-rose-600">{profileMessage}</p>}
          <button className="mt-4 bg-ink text-white" onClick={saveProfile}>
            프로필 저장
          </button>
        </section>
      )}

      {user && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">요청서함</h2>
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/requests/${request.id}`}
                className="flex items-center justify-between rounded-md border border-black/10 p-4"
              >
                <div>
                  <div className="text-sm font-semibold">{request.instrument}</div>
                  <div className="text-xs text-muted">{request.purpose} · {request.schedule}</div>
                </div>
                <span className="text-xs text-muted">{request.status}</span>
              </Link>
            ))}
            {requests.length === 0 && <div className="text-sm text-muted">새 요청이 없습니다.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
