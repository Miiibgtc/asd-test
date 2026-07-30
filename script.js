/* ======= CONFIG ======= */
/* رابط Google Apps Script Web App (الذي زودتِني به) */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw0vIXsdm1gbLYTRRmf3E87cjtMy7bXWwnjwgIxdhAEn53UzXphrkxvQPYPINYjwOcjig/exec";

/* كلمة سر لوحة الإدارة */
const ADMIN_PASSWORD = "sara2007";

/* أسئلة الاختبار: مصفوفة من الكائنات {id, text, type, weight}
   يمكنك تعديلها لتطابق مشروعك الأصلي */
const QUESTIONS = [
  {id: "q1", text: "هل يواجه صعوبة في التواصل البصري؟", type: "yesno", weight: 1},
  {id: "q2", text: "هل يكرر نفس الأفعال بشكل متكرر؟", type: "yesno", weight: 1},
  {id: "q3", text: "هل هناك تأخر في الكلام؟", type: "yesno", weight: 1},
  {id: "q4", text: "هل يبدو مُنعزلًا اجتماعيًا؟", type: "yesno", weight: 1},
  {id: "q5", text: "هل تلاحظ سلوكيات حسية غير معتادة؟", type: "yesno", weight: 1}
];
/* ======================== */

document.addEventListener("DOMContentLoaded", () => {
  const preForm = document.getElementById("preForm");
  const quizSection = document.getElementById("quiz");
  const quizForm = document.getElementById("quizForm");
  const resultSection = document.getElementById("result");
  const resultText = document.getElementById("resultText");
  const intro = document.getElementById("intro");

  // بناء الأسئلة ديناميكياً
  QUESTIONS.forEach(q => {
    const wrapper = document.createElement("div");
    wrapper.className = "question";
    const label = document.createElement("label");
    label.textContent = q.text;
    wrapper.appendChild(label);

    if (q.type === "yesno"){
      const yes = document.createElement("input");
      yes.type = "radio"; yes.name = q.id; yes.value = "yes"; yes.required = true;
      const no = document.createElement("input");
      no.type = "radio"; no.name = q.id; no.value = "no";
      const lyes = document.createElement("label"); lyes.innerHTML = " نعم"; lyes.prepend(yes);
      const lno = document.createElement("label"); lno.innerHTML = " لا"; lno.prepend(no);
      wrapper.appendChild(lyes);
      wrapper.appendChild(lno);
    } else if (q.type === "scale"){
      const input = document.createElement("input"); input.type="range"; input.name=q.id; input.min=0; input.max=10; input.value=0;
      wrapper.appendChild(input);
    } else {
      const input = document.createElement("input"); input.type="text"; input.name=q.id;
      wrapper.appendChild(input);
    }
    quizForm.appendChild(wrapper);
  });

  preForm.addEventListener("submit", e => {
    e.preventDefault();
    // عرض قسم الأسئلة
    intro.classList.add("hidden");
    quizSection.classList.remove("hidden");
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    quizSection.classList.add("hidden");
    intro.classList.remove("hidden");
  });

  document.getElementById("submitQuiz").addEventListener("click", async () => {
    // جمع بيانات
    const name = document.getElementById("name").value.trim();
    const age = document.getElementById("age").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const consent = document.getElementById("consent").checked;
    if (!consent){ alert("يجب الموافقة لنستمر."); return; }

    // اجابات
    const answers = {};
    let score = 0; let maxScore = 0;
    QUESTIONS.forEach(q => {
      const elChecked = document.querySelector(`[name="${q.id}"]:checked`);
      const val = (elChecked && elChecked.value) || (document.querySelector(`[name="${q.id}"]`) && document.querySelector(`[name="${q.id}"]`).value) || null;
      answers[q.id] = val;
      if (q.type === "yesno"){
        maxScore += q.weight;
        if (val === "yes") score += q.weight;
      } else if (q.type === "scale"){
        maxScore += 1 * q.weight;
        score += (Number(val) / 10) * q.weight;
      }
    });

    const percentage = Math.round((score / Math.max(maxScore,1)) * 100);

    // عرض النتيجة للمستخدم
    resultText.innerHTML = `نسبة احتمال طيف التوحد: <strong>${percentage}%</strong><br>ملاحظات: هذه نتيجة مبدئية وليست تشخيصًا نهائياً.`;
    quizSection.classList.add("hidden");
    resultSection.classList.remove("hidden");

    // إرسال البيانات إلى Google Apps Script (Sheet) عبر POST
    const payload = {
      name, age, phone, consent, answers, percentage, timestamp: new Date().toISOString()
    };

    try {
      if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
        console.warn("لم يتم وضع رابط Google Apps Script. البيانات لن تُخزن تلقائياً حتى تضيفي الرابط.");
        return;
      }
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      console.log("Server response:", text);
    } catch (err) {
      console.error("خطأ في إرسال البيانات:", err);
    }
  });

  document.getElementById("homeBtn").addEventListener("click", () => {
    // إعادة الصفحة للوضع الابتدائي
    resultSection.classList.add("hidden");
    intro.classList.remove("hidden");
    preForm.reset();
    quizForm.reset();
  });

});
