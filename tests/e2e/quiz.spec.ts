import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test("rodada completa só pelo teclado, do início ao ranking", async ({ page }) => {
  const roundBodies: string[] = [];
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/rounds") && response.request().method() === "POST") {
      roundBodies.push(await response.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Claude Code");
  await expectNoHorizontalScroll(page);

  // Chega ao link "Começar" com Tab e ativa com Enter.
  const start = page.getByRole("link", { name: "Começar" });
  for (let i = 0; i < 15 && !(await start.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/quiz$/);

  const levels: string[] = [];
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Pergunta ${i} de 10`)).toBeVisible();
    const statement = page.locator("#afirmacao");
    await expect(statement).toBeFocused();
    levels.push(
      (await page.locator("section[aria-labelledby=afirmacao] span").first().innerText()).trim(),
    );
    if (i === 1) await expectNoHorizontalScroll(page);

    await page.keyboard.press(i % 2 === 0 ? "f" : "v");
    await expect(page.getByText(/Correto!|Não foi dessa vez/)).toBeVisible();
    const docLink = page.getByRole("link", { name: /Saiba mais na documentação/ });
    await expect(docLink).toHaveAttribute("href", /^https:\/\//);
    await expect(docLink).toHaveAttribute("target", "_blank");

    const next = page.getByRole("button", { name: i === 10 ? "Ver resultado" : "Próxima" });
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
  }

  // Ordem progressiva 4/3/3 (o selo tem um prefixo só para leitor de tela).
  const shown = levels.map((text) => text.replace("Nível:", "").trim());
  expect(shown).toEqual([
    ...Array(4).fill("Iniciante"),
    ...Array(3).fill("Intermediário"),
    ...Array(3).fill("Avançado"),
  ]);

  // O gabarito nunca veio na criação da rodada.
  expect(roundBodies).toHaveLength(1);
  expect(roundBodies[0]).not.toMatch(/"answer"\s*:|"explanation"|"sourceUrl"/);

  await expect(page).toHaveURL(/\/resultado\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/\d+\/10 acertos/);
  await expect(page.getByText("Revisão das perguntas")).toBeVisible();
  await expectNoHorizontalScroll(page);

  const nickname = `e2e_${randomUUID().slice(0, 8)}`;
  await page.getByRole("textbox", { name: "Apelido" }).focus();
  await page.keyboard.type(nickname);
  await page.keyboard.press("Tab");
  await page.keyboard.type(`${nickname}@exemplo.com`);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Enviar ao ranking" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/ranking\?pos=\d+/);
  const position = Number(new URL(page.url()).searchParams.get("pos"));
  await expect(page.getByText(new RegExp(`${nickname}, sua posição: ${position}º`))).toBeVisible();
  if (position <= 20) {
    await expect(page.locator("tr[aria-current=true]")).toContainText(nickname);
  } else {
    await expect(page.getByText(/fora do top 20/)).toBeVisible();
  }
  await expect(page.locator("body")).not.toContainText("@exemplo.com");
  await expectNoHorizontalScroll(page);
});

test("o formulário do ranking mostra erros por campo", async ({ page }) => {
  await page.goto("/quiz");
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Pergunta ${i} de 10`)).toBeVisible();
    await page.getByRole("button", { name: /^Verdadeiro/ }).click();
    await page.getByRole("button", { name: i === 10 ? "Ver resultado" : "Próxima" }).click();
  }
  await expect(page).toHaveURL(/\/resultado\//);
  await page.getByRole("button", { name: "Enviar ao ranking" }).click();
  await expect(page.getByText(/pelo menos 3 caracteres/)).toBeVisible();
  await expect(page.getByText("Informe um e-mail válido")).toBeVisible();
  await expect(page.getByText("É preciso concordar para entrar no ranking")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Apelido" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("diálogo de privacidade abre e fecha pelo teclado", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Privacidade" }).click();
  const dialog = page.getByRole("dialog", { name: "Privacidade" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("E-mail");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Privacidade" })).toBeFocused();
});

test("ranking e resultado inexistente", async ({ page }) => {
  await page.goto("/ranking");
  await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("@");
  await expectNoHorizontalScroll(page);

  // A página é transmitida em partes (streaming): o status HTTP já saiu como 200 quando o
  // notFound() dispara, então o teste confere o conteúdo da página 404.
  await page.goto(`/resultado/${randomUUID()}`);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await page.goto("/resultado/nao-e-uuid");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
