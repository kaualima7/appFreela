// Mostra o texto de apresentação do projeto dentro da área do freelancer.

export default function AboutPage() {
  return (
    <section className="account-home">
      <h1 className="h2 mb-4">Sobre o Freelike</h1>
      <div className="card card-body p-4">
        <p className="mb-2">
          Freelike é um projeto acadêmico desenvolvido por{" "}
          <strong>Kauã Lima Rodrigues</strong>.
        </p>
        <p className="text-secondary mb-4">
          Freelancers publicam serviços e clientes exploram os anúncios e dão
          like nos que chamam sua atenção.
        </p>
        <div className="workspace-actions">
          <a
            className="btn btn-outline-primary"
            href="https://github.com/kaualima7/appFreela"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-github" aria-hidden="true" />
            Ver repositório no GitHub
            <span className="visually-hidden"> (abre em outra aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
