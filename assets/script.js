console.log("js loaded");

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

// ==================== FIRE BASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAwbsfMhFUSb3Ko3owNHOyo-ybU3BMO_X4",
  authDomain: "catatan-keuangan-1c727.firebaseapp.com",
  projectId: "catatan-keuangan-1c727",
//   storageBucket: "catatan-keuangan-1c727.firebasestorage.app",
//   messagingSenderId: "197547529172",
//   appId: "1:197547529172:web:b305e5b92bd634a384bc41",
//   measurementId: "G-VM7XYZZ0LD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ==================== LOGIN ====================
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      console.log("Login sukses:", user);

      document.getElementById("authSection").style.display = "none";
      document.getElementById("appSection").style.display = "block";

      loadSaldo();
      transaction();
    })
    .catch(err => alert("Login gagal: " + err.message));
}

// ==================== ADD TRANSACTION ====================
function addTransaction(isAdd){
    if(!isLoggedIn) return;

    let rawValue = document.getElementById("amount").value.replace(/[^0-9]/g, "")
    const amount = parseInt(rawValue);

    const note = document.getElementById("note").value;
    if(!amount) return alert("input data please!")

    const transaction = {
        amount: isAdd ? amount : -amount,
        note: note,
        date: new Date().toISOString()
    };

    db.collection("transactions").add(transaction).then(() =>{
        updateSaldo(transaction.amount);
        document.getElementById("amount").value = "Rp. ";
        document.getElementById("note").value = "";
    });
}

// ==================== UPDATE SALDO ====================
function updateSaldo(change){
    const saldoRef = db.collection("saldo").doc("main");
    saldoRef.get().then((doc) => {
        let saldo = doc.exists ? doc.data().value : 0;
        saldo += change;
        saldoRef.set({ value:saldo });
        document.getElementById("saldo").innerText = saldo;
    });
}

// ==================== NUMBER FORMAT ====================
const rupiah = new Intl.NumberFormat("id-ID");

// ==================== LOAD SALDO ====================
function loadSaldo() {
    db.collection("saldo").doc("main").onSnapshot(doc => {
        document.getElementById("saldo").innerText = doc.exists 
            ? rupiah.format(doc.data().value)
            : 0;
    })
}

// ==================== TRANSACTION ====================
let allTransactions = [];

function transaction(){
    db.collection("transactions").orderBy("date", "desc").onSnapshot(snapshot => {
        allTransactions =[];
        snapshot.forEach(doc => {
            allTransactions.push(doc.data());
        });

        renderYearMonthOptions();
        renderTransactions();
    });
}

function renderYearMonthOptions(){
    const yearSelect = document.getElementById("yearFilter");
    const monthSelect = document.getElementById("monthFilter");

    // Ambil tahun unik
    const years = [...new Set(allTransactions.map(t => {
        return new Date(t.date).getFullYear();
    }))].sort((a, b) => b - a);

    // Ambil bulan unik (pakai angka 1–12)
    const months = [...new Set(allTransactions.map(t => {
        return new Date(t.date).getMonth() + 1; // Januari = 1
    }))].sort((a, b) => a - b);

    // Render tahun
    yearSelect.innerHTML = "<option value=''>Semua Tahun</option>";
    years.forEach(y => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    });

    // Render bulan
    monthSelect.innerHTML = "<option value=''>Semua Bulan</option>";
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = new Date(0, m - 1).toLocaleString("id-ID", { month: "long" });
        monthSelect.appendChild(opt);
    });
}


function renderTransactions(){
    const yearSelect = document.getElementById("yearFilter").value;
    const monthSelect = document.getElementById("monthFilter").value;
    const list = document.getElementById("transactions");
    list.innerHTML = "";
    let totalPengeluaran = 0;

    const filtered = allTransactions.filter(t => {
        const d = new Date(t.date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return (!yearSelect || y == yearSelect) && (!monthSelect || m == monthSelect);
    });

    filtered.forEach(data => {
        const li = document.createElement("li");
        li.innerHTML = `
                <strong>Date   : </strong> ${new Date(data.date).toLocaleString()} <br>
                <strong>Note   : </strong> ${data.note} <br>
                <strong>jmlh : </strong> Rp. ${rupiah.format(data.amount)}
            `;
        list.appendChild(li);

        if(data.amount < 0){
            totalPengeluaran += Math.abs(data.amount);
        }
    });

    document.getElementById("totalPengeluaran").innerHTML = rupiah.format(totalPengeluaran);
}


// ==================== LOGOUT ====================
function logOut(){
    auth.signOut().then(() => {
        console.log("logout success");
        document.getElementById("authSection").style.display = "block";
        document.getElementById("appSection").style.display = "none";
    }).catch((error) => {
        console.log("logOut gagal: ", error);
    });
}

// ==================== SAVE SESSION ====================
window.onload = function () {
  auth.onAuthStateChanged(user => {
    document.getElementById("loader").style.display = "none";

    if (user) {
      // user login
      document.getElementById("authSection").style.display = "none";
      document.getElementById("appSection").style.display = "block";
      loadSaldo();
      transaction();
    } else {
      // user belum login
      document.getElementById("authSection").style.display = "block";
      document.getElementById("appSection").style.display = "none";
    }
  });
};
