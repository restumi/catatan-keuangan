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

// ==================== LOGIN ====================
function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(email === "ovelmi@gmail.com" && password === "OvelMi09"){
        isLoggedIn = true;
        localStorage.setItem("isLoggedIn", "true");

        document.getElementById("authSection").style.display = "none";
        document.getElementById("appSection").style.display = "block";

        loadSaldo();
        transaction();
    } else {
        alert("email atau password salah");
    }
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

// ==================== LOAD SALDO ====================
function loadSaldo() {
    db.collection("saldo").doc("main").onSnapshot(doc => {
        document.getElementById("saldo").innerText = doc.exists ? doc.data().value : 0;
    })
}

// ==================== TRANSACTION ====================
function transaction(){
    db.collection("transactions").orderBy("date", "desc").onSnapshot(snapshot => {
        const list = document.getElementById("transactions");
        list.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const li = document.createElement("li");
            li.textContent = `${new Date(data.date).toLocaleString()} | ${data.note} | Rp ${data.amount}`;
            list.appendChild(li);
        });
    });
}

// ==================== LOGOUT ====================
function logOut(){
    isLoggedIn = false;
    localStorage.removeItem("isLoggedIn");
    document.getElementById("authSection").style.display = "block";
    document.getElementById("appSection").style.display = "none";
}

// ==================== SAVE SESSION ====================
window.onload = function(){
    if(localStorage.getItem("isLoggedIn") === "true"){
        isLoggedIn = true;

        document.getElementById("authSection").style.display = "none";
        document.getElementById("appSection").style.display = "block";

        loadSaldo();
        transaction();
    }
}
