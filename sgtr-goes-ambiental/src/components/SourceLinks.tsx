const officialSources = [
  ['NOAA GOES Image Viewer', 'https://www.star.nesdis.noaa.gov/goes/'],
  ['NASA Worldview', 'https://worldview.earthdata.nasa.gov/'],
  ['NOAA NCEI CLASS/AIRS', 'https://www.avl.class.noaa.gov/saa/products/welcome'],
  ['NOAA Open Data AWS GOES', 'https://registry.opendata.aws/noaa-goes/'],
] as const;

export function SourceLinks() {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Fontes oficiais</h2>
      </div>
      <div className="source-grid">
        {officialSources.map(([label, url]) => (
          <a className="button secondary" href={url} target="_blank" rel="noreferrer" key={url}>
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
