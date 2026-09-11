export const CadmusMaterialStrip = () => {
  const materials = [
    "PDF",
    "Word",
    "Web URL",
    "Notion",
    "Canvas export",
    "PowerPoint"
  ];

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: "hsl(var(--cadmus-cream))" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
        <h3 className="text-sm font-semibold tracking-[0.15em] uppercase text-nav-ink mb-8">
          WORKS WITH YOUR MATERIAL
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {materials.map((material, idx) => (
            <div 
              key={idx}
              className="flex items-center text-sm md:text-base text-muted-foreground font-medium"
            >
              {material}
              {idx < materials.length - 1 && (
                <span className="hidden md:inline-block ml-8 h-4 w-px bg-border"></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CadmusMaterialStrip;
