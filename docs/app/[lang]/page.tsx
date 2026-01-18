import Link from 'next/link';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const isGerman = lang === 'de';

  return (
    <main className="container max-w-5xl px-4 py-16 md:py-24">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            {isGerman ? 'Austria MCP Server' : 'Austria MCP Server'}
          </h1>
          <p className="text-xl text-fd-muted-foreground max-w-2xl">
            {isGerman
              ? 'Zugriff auf österreichische Open Government Daten über das Model Context Protocol'
              : 'Access Austrian Open Government Data through the Model Context Protocol'}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/${lang}/docs`}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors"
          >
            {isGerman ? 'Dokumentation' : 'Documentation'}
          </Link>
          <Link
            href={`/${lang}/docs/guides/installation`}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-fd-border hover:bg-fd-accent transition-colors"
          >
            {isGerman ? 'Installation' : 'Get Started'}
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="rounded-lg border border-fd-border p-6">
            <h3 className="font-semibold mb-2">
              {isGerman ? 'Daten-Discovery' : 'Dataset Discovery'}
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              {isGerman
                ? 'Durchsuchen Sie tausende österreichische Datensätze mit natürlicher Sprache'
                : 'Search thousands of Austrian datasets using natural language queries'}
            </p>
          </div>

          <div className="rounded-lg border border-fd-border p-6">
            <h3 className="font-semibold mb-2">
              {isGerman ? 'Typsicher' : 'Type-Safe'}
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              {isGerman
                ? 'Vollständig in TypeScript entwickelt für beste Entwicklererfahrung'
                : 'Built with TypeScript for complete type safety and developer experience'}
            </p>
          </div>

          <div className="rounded-lg border border-fd-border p-6">
            <h3 className="font-semibold mb-2">
              {isGerman ? 'MCP-kompatibel' : 'MCP Compatible'}
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              {isGerman
                ? 'Nahtlose Integration mit KI-Assistenten über das Model Context Protocol'
                : 'Seamless integration with AI assistants through the Model Context Protocol'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-fd-border p-6 mt-4">
          <h3 className="font-semibold mb-3">
            {isGerman ? 'Schnellstart' : 'Quick Start'}
          </h3>
          <pre className="bg-fd-muted rounded p-4 text-sm overflow-x-auto">
            <code>{`npm install austria-mcp

# ${isGerman ? 'Konfiguration' : 'Configuration'}
{
  "mcpServers": {
    "austria": {
      "command": "npx",
      "args": ["austria-mcp"]
    }
  }
}`}</code>
          </pre>
        </div>
      </div>
    </main>
  );
}
