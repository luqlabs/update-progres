export const CadmusTrustStrip = () => {
  return (
    <section className="bg-background pt-72 pb-16 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
        <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
          TRUSTED BY LECTURERS AT
        </span>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale">
          {/* Placeholder names instead of images to keep it simple and solid */}
          <span className="font-display text-2xl font-semibold">University of Melbourne</span>
          <span className="font-display text-2xl font-semibold">RMIT University</span>
          <span className="font-display text-2xl font-semibold">UNSW Sydney</span>
          <span className="font-display text-2xl font-semibold">University of Sydney</span>
        </div>
      </div>
    </section>
  );
};

export default CadmusTrustStrip;
