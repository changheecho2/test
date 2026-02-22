"use client";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { getAuthClient, getDbClient, getFunctionsClient } from "../../../../lib/firebaseClient";
import { RequestDoc } from "../../../../lib/types";

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestDoc | null>(null);
  const [contact, setContact] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authClient = getAuthClient();
    if (!authClient) return;
    return onAuthStateChanged(authClient, (user) => {
      setUserId(user?.uid || null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getDbClient();
        if (!db) {
          setError("현재 설정으로 요청서를 불러올 수 없습니다.");
          return;
        }
        const snap = await getDoc(doc(db, "requests", params.id));
        if (!snap.exists()) {
          setError("요청서를 찾을 수 없습니다.");
          return;
        }
        setRequest({ id: snap.id, ...(snap.data() as Omit<RequestDoc, "id">) });
        if (snap.data().contactUnlocked) {
          const privateSnap = await getDoc(doc(db, "requests", params.id, "private", "contact"));
          if (privateSnap.exists()) {
            setContact(privateSnap.data().email);
          }
        }
      } catch (err) {
        setError("요청서를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, params.id]);

  const handleAccept = async () => {
    setMessage(null);
    try {
      const functions = getFunctionsClient();
      if (!functions) {
        setMessage("현재 설정으로 결제를 진행할 수 없습니다.");
        return;
      }
      const callable = httpsCallable(functions, "createCheckoutSession");
      const res = await callable({ requestId: params.id });
      const data = res.data as any;
      if (data?.mode === "mock") {
        setMessage("테스트 결제로 즉시 수락되었습니다.");
        const snap = await getDoc(doc(db, "requests", params.id));
        if (snap.exists()) {
          setRequest({ id: snap.id, ...(snap.data() as Omit<RequestDoc, "id">) });
          if (snap.data().contactUnlocked) {
            const privateSnap = await getDoc(doc(db, "requests", params.id, "private", "contact"));
            if (privateSnap.exists()) {
              setContact(privateSnap.data().email);
            }
          }
        }
        return;
      }
      const sessionId = data.sessionId as string;
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
      if (!stripe) throw new Error("Stripe 초기화 실패");
      await stripe.redirectToCheckout({ sessionId });
    } catch (err: any) {
      setMessage("결제 세션 생성에 실패했습니다.");
    }
  };

  const handleReject = async () => {
    setMessage(null);
    try {
      const functions = getFunctionsClient();
      if (!functions) {
        setMessage("현재 설정으로 거절 처리할 수 없습니다.");
        return;
      }
      const callable = httpsCallable(functions, "rejectRequest");
      await callable({ requestId: params.id });
      setMessage("요청서를 거절했습니다.");
    } catch (err: any) {
      setMessage("거절 처리에 실패했습니다.");
    }
  };

  if (!userId) return <div>로그인이 필요합니다.</div>;
  if (error) return <div>{error}</div>;
  if (loading || !request) return <div>로딩 중...</div>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">요청서 상세</h1>
        <span className="text-xs text-muted">상태: {request.status}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 text-sm">
        <div>
          <div className="font-semibold">목적</div>
          <div className="text-muted">{request.purpose}</div>
        </div>
        <div>
          <div className="font-semibold">악기/파트</div>
          <div className="text-muted">{request.instrument}</div>
        </div>
        <div>
          <div className="font-semibold">곡/레퍼토리</div>
          <div className="text-muted">{request.repertoire}</div>
        </div>
        <div>
          <div className="font-semibold">일정</div>
          <div className="text-muted">{request.schedule}</div>
        </div>
        <div>
          <div className="font-semibold">장소</div>
          <div className="text-muted">{request.location}</div>
        </div>
        <div>
          <div className="font-semibold">희망 비용</div>
          <div className="text-muted">
            {request.budgetMin.toLocaleString()}원 ~ {request.budgetMax.toLocaleString()}원
          </div>
        </div>
      </div>
      <div className="text-sm">
        <div className="font-semibold">추가 요청</div>
        <div className="text-muted">
          {request.options.sightReading && "초견 가능 "}
          {request.options.sameDayRehearsal && "당일 리허설 "}
          {request.options.recording && "녹음/촬영 "}
          {request.options.provideSheet && "악보 제공 "}
          {!request.options.sightReading &&
            !request.options.sameDayRehearsal &&
            !request.options.recording &&
            !request.options.provideSheet &&
            "없음"}
        </div>
      </div>
      <div className="text-sm">
        <div className="font-semibold">전달사항</div>
        <div className="text-muted">{request.note || "-"}</div>
      </div>
      <div className="rounded-lg border border-dashed border-black/20 p-4 text-sm">
        <div className="font-semibold">연락처</div>
        <div className="mt-1 text-muted">
          {request.contactUnlocked ? contact || "연락처 로딩 중..." : "결제 완료 후 공개됩니다."}
        </div>
      </div>
      <p className="text-xs text-muted">테스트 모드에서는 결제 없이 즉시 수락됩니다.</p>
      {message && <p className="text-sm text-rose-600">{message}</p>}
      {request.status === "pending" && (
        <div className="flex gap-2">
          <button className="bg-ink text-white" onClick={handleAccept}>
            수락하기 (1만원 결제)
          </button>
          <button className="border border-black/10" onClick={handleReject}>
            거절하기
          </button>
        </div>
      )}
    </div>
  );
}
