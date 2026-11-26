// Redireciona a entrada da área do cliente para a vitrine em /explorar.

import { redirect } from "next/navigation";

export default function ClientHome() {
  redirect("/explorar");
}
