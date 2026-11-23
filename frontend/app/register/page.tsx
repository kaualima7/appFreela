import RegisterForm from "./RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const { tipo } = await searchParams;
  const initialAccountType = tipo === "freelancer" ? "FREELANCER" : "";

  return (
    <RegisterForm
      key={initialAccountType}
      initialAccountType={initialAccountType}
    />
  );
}