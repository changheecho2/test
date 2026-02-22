const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

const region = process.env.FUNCTIONS_REGION || "asia-northeast3";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const paymentMode = (process.env.PAYMENT_MODE || "mock").toLowerCase();
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

const contactPatterns = [
  /01[016789][ -]?\d{3,4}[ -]?\d{4}/,
  /\b0\d{1,2}[ -]?\d{3,4}[ -]?\d{4}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(https?:\/\/|www\.)/i,
  /\.(com|net|io|co|kr|me|app|link|gg|tv|me)\b/i,
  /(카톡|카카오|kakao|오픈채팅|open\.kakao|아이디|\bID\b)/i,
  /(텔레그램|telegram|라인|line|디스코드|discord)/i
];

function containsContactInfo(text) {
  return contactPatterns.some((pattern) => pattern.test(text));
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument", `${field} 값이 필요합니다.`);
  }
  return value.trim();
}

function requireNumber(value, field) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new functions.https.HttpsError("invalid-argument", `${field} 값이 필요합니다.`);
  }
  return value;
}

function validateNoContact(text) {
  if (!text) return;
  if (containsContactInfo(text)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "연락처/카카오톡ID/외부 링크는 입력할 수 없습니다. 수락 후에만 연락처가 공개됩니다."
    );
  }
}

exports.createRequest = functions.region(region).https.onCall(async (data) => {
  const accompanistUid = requireString(data.accompanistUid, "accompanistUid");
  const purpose = requireString(data.purpose, "purpose");
  const instrument = requireString(data.instrument, "instrument");
  const repertoire = requireString(data.repertoire, "repertoire");
  const schedule = requireString(data.schedule, "schedule");
  const location = requireString(data.location, "location");
  const budgetMin = requireNumber(data.budgetMin, "budgetMin");
  const budgetMax = requireNumber(data.budgetMax, "budgetMax");
  const note = typeof data.note === "string" ? data.note.trim() : "";
  const contactEmail = requireString(data.contactEmail, "contactEmail");

  if (note.length > 120) {
    throw new functions.https.HttpsError("invalid-argument", "전달사항은 120자 이내여야 합니다.");
  }
  if (budgetMin > budgetMax) {
    throw new functions.https.HttpsError("invalid-argument", "희망 비용 범위를 확인해 주세요.");
  }

  validateNoContact(instrument);
  validateNoContact(repertoire);
  validateNoContact(schedule);
  validateNoContact(location);
  validateNoContact(note);

  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  if (!emailPattern.test(contactEmail)) {
    throw new functions.https.HttpsError("invalid-argument", "유효한 이메일을 입력해 주세요.");
  }

  const accompanistSnap = await admin.firestore().doc(`accompanists/${accompanistUid}`).get();
  if (!accompanistSnap.exists || accompanistSnap.data().isPublic !== true) {
    throw new functions.https.HttpsError("not-found", "해당 반주자를 찾을 수 없습니다.");
  }

  const options = data.options || {};

  const requestRef = await admin.firestore().collection("requests").add({
    accompanistUid,
    status: "pending",
    purpose,
    instrument,
    repertoire,
    schedule,
    location,
    budgetMin,
    budgetMax,
    options: {
      sightReading: !!options.sightReading,
      sameDayRehearsal: !!options.sameDayRehearsal,
      recording: !!options.recording,
      provideSheet: !!options.provideSheet
    },
    note,
    contactUnlocked: false,
    stripeSessionId: null,
    paidAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await requestRef.collection("private").doc("contact").set({
    email: contactEmail,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { requestId: requestRef.id };
});

exports.createCheckoutSession = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const requestId = requireString(data.requestId, "requestId");
  const requestRef = admin.firestore().doc(`requests/${requestId}`);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new functions.https.HttpsError("not-found", "요청서를 찾을 수 없습니다.");
  }

  const requestData = requestSnap.data();
  if (requestData.accompanistUid !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "권한이 없습니다.");
  }
  if (requestData.status !== "pending") {
    throw new functions.https.HttpsError("failed-precondition", "이미 처리된 요청입니다.");
  }

  if (paymentMode === "mock") {
    await requestRef.update({
      status: "accepted",
      contactUnlocked: true,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { mode: "mock" };
  }

  if (!stripeSecretKey) {
    throw new functions.https.HttpsError("failed-precondition", "Stripe 비밀키 설정이 필요합니다.");
  }

  const successUrl = process.env.STRIPE_SUCCESS_URL;
  const cancelUrl = process.env.STRIPE_CANCEL_URL;
  if (!successUrl || !cancelUrl) {
    throw new functions.https.HttpsError("failed-precondition", "결제 URL 설정이 필요합니다.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "krw",
          unit_amount: 10000,
          product_data: {
            name: "요청 수락 비용"
          }
        },
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      requestId
    }
  });

  await requestRef.update({
    stripeSessionId: session.id
  });

  return { sessionId: session.id };
});

exports.rejectRequest = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const requestId = requireString(data.requestId, "requestId");
  const requestRef = admin.firestore().doc(`requests/${requestId}`);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new functions.https.HttpsError("not-found", "요청서를 찾을 수 없습니다.");
  }

  const requestData = requestSnap.data();
  if (requestData.accompanistUid !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "권한이 없습니다.");
  }
  if (requestData.status !== "pending") {
    throw new functions.https.HttpsError("failed-precondition", "이미 처리된 요청입니다.");
  }

  await requestRef.update({
    status: "rejected"
  });

  return { ok: true };
});

exports.stripeWebhook = functions.region(region).https.onRequest(async (req, res) => {
  if (paymentMode === "mock") {
    res.json({ received: true, mode: "mock" });
    return;
  }
  const signature = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    res.status(500).send("Webhook secret not configured");
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const requestId = session.metadata?.requestId;
    if (requestId) {
      await admin.firestore().doc(`requests/${requestId}`).update({
        status: "accepted",
        contactUnlocked: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  res.json({ received: true });
});
