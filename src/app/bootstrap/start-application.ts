export function startApplication(root: HTMLElement): void {
  const heading = document.createElement("h1");
  heading.textContent = "Mariage OS";

  const status = document.createElement("p");
  status.textContent = "Socle d’ingénierie Lot 0 initialisé.";

  const note = document.createElement("p");
  note.textContent = "Aucune fonctionnalité métier n’est encore implémentée.";

  root.replaceChildren(heading, status, note);
}
