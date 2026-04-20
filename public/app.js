const form = document.querySelector("#contact-form");
const statusElement = document.querySelector("#form-status");

function setStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `form-status ${type || ""}`.trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Envoi en cours...", "");

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error || "Une erreur est survenue.", "error");
      return;
    }

    setStatus(
      "Demande preparee. Votre messagerie va s'ouvrir pour finaliser l'email.",
      "success"
    );
    form.reset();

    if (result.mailtoLink) {
      window.location.href = result.mailtoLink;
    }
  } catch (error) {
    setStatus("Impossible d'envoyer la demande pour le moment.", "error");
  }
});
