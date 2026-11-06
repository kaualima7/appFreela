import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

async function main() {
  const storage = new Map();
  const events = new EventTarget();
  let responseStatus = 200;
  let storedTokenDuringResponse;
  let requestHeaders;
  let destination;
  const user = {
    id: 1,
    name: "Teste de sessão",
    email: "session@example.test",
    accountType: "CLIENT",
  };
  const exported = {};
  const context = {
    exports: exported,
    require: () => ({ API_URL: "http://api.test/api" }),
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: {
      dispatchEvent: (event) => events.dispatchEvent(event),
      location: {
        replace: (url) => {
          destination = url;
        },
      },
    },
    Event,
    Headers,
    AbortSignal,
    fetch: async (_url, options) => {
      requestHeaders = options.headers;
      if (storedTokenDuringResponse)
        storage.set("auth_token", storedTokenDuringResponse);
      return new Response(JSON.stringify([user]), { status: responseStatus });
    },
  };
  const compiled = ts.transpileModule(
    fs.readFileSync(
      new URL("../app/login/auth_service.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  vm.runInNewContext(compiled.outputText, context);
  const auth = exported;
  assert.equal(auth.getToken(), null);
  assert.equal(await auth.currentUser(new AbortController().signal), null);
  storage.set("auth_token", "token-antigo-sem-metadados");
  assert.equal(
    (await auth.currentUser(new AbortController().signal)).accountType,
    "CLIENT",
  );
  assert.equal(
    requestHeaders.get("Authorization"),
    "Bearer token-antigo-sem-metadados",
  );
  responseStatus = 403;
  await assert.rejects(
    auth.currentUser(new AbortController().signal),
    /permissão/,
  );
  assert.equal(auth.getToken(), "token-antigo-sem-metadados");
  responseStatus = 401;
  assert.equal(await auth.currentUser(new AbortController().signal), null);
  assert.equal(auth.getToken(), null);
  storage.set("auth_token", "token-da-sessao-anterior");
  storedTokenDuringResponse = "token-da-nova-sessao";
  await auth.authenticatedFetch("http://api.test/api/users");
  assert.equal(auth.getToken(), "token-da-nova-sessao");
  storedTokenDuringResponse = undefined;
  auth.saveSession({ access_token: "token-de-teste", user });
  assert.equal(auth.getToken(), "token-de-teste");
  assert.equal(storage.size, 1);
  assert.equal(auth.accountHome("CLIENT"), "/client");
  assert.equal(auth.accountHome("FREELANCER"), "/admin");
  auth.logout();
  assert.equal(auth.getToken(), null);
  assert.equal(destination, "/");
  delete context.window;
  assert.equal(auth.getToken(), null);
  console.log(
    "OK: sessão antiga, identidade, Bearer, 401, 403, resposta atrasada, destinos, logout e leitura segura no servidor.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
