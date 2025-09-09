console.log("weekly js loaded");

const amountInput = document.getElementById("amount");

amountInput.addEventListener("input", function () {
  // ambil angka saja
  let value = this.value.replace(/\D/g, "");

  // kalau kosong, jangan kasih "Rp."
  if (value) {
    this.value = "Rp. " + value;
  } else {
    this.value = "";
  }
});

// ==================== FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAwbsfMhFUSb3Ko3owNHOyo-ybU3BMO_X4",
  authDomain: "catatan-keuangan-1c727.firebaseapp.com",
  projectId: "catatan-keuangan-1c727",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ==================== WEEKLY CONFIG ====================
const WEEKLY_LIMIT = 50000;
const rupiah = new Intl.NumberFormat("id-ID");

// Hitung weekId berdasarkan hari senin
function getWeekId(date = new Date()) {
  const d = new Date(date);
  let day = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  if (day === 0) day = 7; // anggap Minggu = 7

  // cari Senin minggu ini
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const dayNum = String(monday.getDate()).padStart(2, "0");

  const result = `${year}-${month}-${dayNum}`;

  return result;
}

// ✅ Increment saldo global secara atomik
function updateGlobalSaldo(change) {
  const saldoRef = db.collection("saldo").doc("main");
  // pastikan dokumen ada dan increment atomik
  return saldoRef.set(
    { value: firebase.firestore.FieldValue.increment(change) },
    { merge: true }
  );
}

// ==================== ADD TRANSACTION ====================
async function addWeeklyTransaction(isAdd) {
  const amountEl = document.getElementById("amount");
  const noteEl = document.getElementById("note");

  const raw = (amountEl.value || "").replace(/[^0-9]/g, "");
  const amount = parseInt(raw, 10);
  if (!amount) return alert("Input jumlah dulu!");

  const weekId = getWeekId();
  const signedAmount = isAdd ? amount : -amount;

  const tx = {
    amount: signedAmount,
    note: noteEl.value || "",
    date: new Date().toISOString(),
    weekId: weekId
  };

  try {
    // simpan ke koleksi global
    await db.collection("transactions").add(tx);
    // ✅ update saldo global (biar index.html ikut berubah)
    await updateGlobalSaldo(signedAmount);

    // reset input
    amountEl.value = "Rp. ";
    noteEl.value = "";
  } catch (e) {
    console.error(e);
    alert("Gagal menyimpan data");
  }
}

// ==================== LOAD WEEKLY SALDO & LIST ====================
function loadWeeklySaldo() {
  const weekId = getWeekId();
  
  db.collection("transactions")
    .where("weekId", "==", weekId)
    .onSnapshot(
      (snapshot) => {
        let total = 0;
        const items = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          total += data.amount;
          items.push(data);
        });

        // sort by date desc di client
        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        // render list
        const list = document.getElementById("transactions");
        list.innerHTML = "";
        items.forEach((data) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>date : </strong>${new Date(data.date).toLocaleString("id-ID")}<br>
            <strong>note : </strong>${data.note}<br>
            <strong>jmlh : </strong> Rp. ${rupiah.format(data.amount)}
          `;
          list.appendChild(li);
        });

        // saldo mingguan = LIMIT + total transaksi minggu ini (bisa minus kalau over)
        document.getElementById("saldo").innerText = rupiah.format(WEEKLY_LIMIT + total);
      },
      (err) => {
        console.error("Snapshot error:", err);
      }
    );
}

// ==================== INIT ====================
window.addEventListener("DOMContentLoaded", () => {
  // (opsional) kalau mau format input live
  const amountInput = document.getElementById("amount");
  if (amountInput) {
    amountInput.addEventListener("input", function () {
      const value = this.value.replace(/\D/g, "");
      this.value = value ? "Rp. " + value : "";
    });
  }

  loadWeeklySaldo();
});

// ==================== SAVE SESSION ====================
window.onload = function () {
  auth.onAuthStateChanged(user => {
    document.getElementById("loader").style.display = "none";

    if (user) {
      document.getElementById("appSectionTwo").style.display = "block";
      loadWeeklySaldo();
    } else {
      window.location.href = "index.html";
    }
  });
};
