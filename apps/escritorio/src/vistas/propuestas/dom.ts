/**
 * Utilidades mínimas de DOM para esta vista. Sin framework: el resto del
 * Escritorio tampoco usa uno todavía, y esta vista no depende de eso.
 */

export function crear<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K,
  opciones?: { readonly clase?: string; readonly texto?: string; readonly atributos?: Readonly<Record<string, string>> },
): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(etiqueta);
  if (opciones?.clase) elemento.className = opciones.clase;
  if (opciones?.texto !== undefined) elemento.textContent = opciones.texto;
  if (opciones?.atributos) {
    for (const [nombre, valor] of Object.entries(opciones.atributos)) elemento.setAttribute(nombre, valor);
  }
  return elemento;
}

export function vaciar(elemento: HTMLElement): void {
  elemento.replaceChildren();
}

export function agregar(padre: HTMLElement, ...hijos: ReadonlyArray<Node | string>): void {
  for (const hijo of hijos) padre.append(hijo);
}
