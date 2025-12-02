async function load() {
  const res = await fetch("/invoices");
  const data = await res.json();

  document.getElementById("list").innerHTML = data.map(i => `
    <div style="margin:10px; padding:10px; border:1px solid #ccc;">
      <b>${i.Title}</b><br>
      Data: ${i.InvoiceDate}<br>
      Com IVA: ${i.ValueWithVAT} €<br>
      Sem IVA: ${i.ValueWithoutVAT} €<br>
      ${i.AttachmentUrl ? `<a target="_blank" href="${i.AttachmentUrl}">Ver ficheiro</a>` : ""}
    </div>
  `).join("");
}

document.getElementById("form").onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(e.target);

  await fetch("/invoices", { method:"POST", body:f });
  load();
};

load();
