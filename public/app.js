const form = document.getElementById("form");
const listDiv = document.getElementById("list");

async function loadInvoices() {
  try {
    const res = await fetch("/invoices");
    const invoices = await res.json();

    if (!invoices.length) {
      listDiv.innerHTML = "<p>Nenhuma invoice ainda</p>";
      return;
    }

    listDiv.innerHTML = invoices.map(inv => `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
        <b>${inv.Title}</b><br>
        Data: ${new Date(inv.InvoiceDate).toLocaleDateString()}<br>
        Com IVA: ${inv.ValueWithVAT} €<br>
        Sem IVA: ${inv.ValueWithoutVAT} €<br>
        ${inv.AttachmentUrl ? `<a href="${inv.AttachmentUrl}" target="_blank">Ver ficheiro</a>` : "Sem ficheiro"}
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    listDiv.innerHTML = "<p>Erro ao carregar invoices</p>";
  }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const formData = new FormData(form);

  try {
    const res = await fetch("/invoices", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Erro ao guardar invoice");

    alert("Invoice criada com sucesso!");
    form.reset();
    loadInvoices();
  } catch (err) {
    console.error(err);
    alert("Erro ao guardar invoice");
  }
});

// Carrega invoices ao iniciar
loadInvoices();
